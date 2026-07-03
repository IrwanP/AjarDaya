import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;
let quotaExceededUntil = 0; // Backoff state for rate limits/quota exhaustion or high demand errors

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper function to call generateContent with automatic exponential backoff retry for transient errors (e.g. 503/UNAVAILABLE)
async function generateContentWithRetry(ai: GoogleGenAI, prompt: string, maxRetries = 2, delayMs = 1000): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });
      return response;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const isTransient = errorMsg.includes("503") || 
                          errorMsg.includes("UNAVAILABLE") || 
                          errorMsg.includes("high demand") || 
                          errorMsg.includes("overloaded") || 
                          errorMsg.includes("fetch failed") || 
                          errorMsg.includes("ENOTFOUND") || 
                          errorMsg.includes("ETIMEDOUT") || 
                          errorMsg.includes("ECONNREFUSED") || 
                          error.status === "UNAVAILABLE" || 
                          error.status === 503;
      
      if (isTransient && attempt < maxRetries) {
        attempt++;
        const currentDelay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[AjarDaya AI] Gemini API transient/network error detected on attempt ${attempt}. Retrying in ${currentDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
      } else {
        throw error;
      }
    }
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

// Primary Endpoint for AjarDaya Decision Intelligence
app.post("/api/gemini/generate", async (req: express.Request, res: express.Response) => {
  const { topic, data } = req.body;
  const hasKey = !!process.env.GEMINI_API_KEY;

  if (process.env.DEMO_SAFE_MODE === "true") {
    console.warn(`[AjarDaya AI] DEMO_SAFE_MODE active. Bypassing live Gemini API call to conserve quota.`);
    const fallback = getFallbackData(topic, data);
    return res.json({
      source: "local_intelligence_fallback_cached",
      data: fallback,
      message: "DEMO_SAFE_MODE is active. Using precomputed local intelligence data to conserve Gemini quota."
    });
  }

  if (Date.now() < quotaExceededUntil) {
    console.warn(`[AjarDaya AI] Cooldown/Quota backoff active. Bypassing live call and returning local fallback intelligence for topic: ${topic}.`);
    const fallback = getFallbackData(topic, data);
    return res.json({
      source: "local_intelligence_fallback",
      data: fallback,
      message: "API cooldown active due to rate limit or high demand. Using local fallback intelligence."
    });
  }

  if (!hasKey) {
    // Graceful fallback with premium localized data if key is missing
    console.warn("GEMINI_API_KEY is not defined. Returning highly structured fallback data.");
    const fallback = getFallbackData(topic, data);
    return res.json({ 
      source: "local_intelligence", 
      data: fallback,
      message: "Using local intelligence data (API Key not detected on server)." 
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = buildPrompt(topic, data);
    
    // Call our model generator with automatic retries for transient errors
    const response = await generateContentWithRetry(ai, prompt);

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    try {
      const parsedData = JSON.parse(responseText.trim());

      if (topic === "risk_lens") {
        const targetGroup = data.selectedLearnerCategory || "Remote islands";
        const targetDomain = data.selectedSupportDomain || "Digital access";
        const allowedLearners = data.affectedLearners || [];
        
        let isValid = true;
        
        // 1. Check learnerCategory
        if (parsedData.learnerCategory !== targetGroup) {
          console.warn(`[Validation Fail] learnerCategory mismatch: Expected "${targetGroup}", got "${parsedData.learnerCategory}"`);
          isValid = false;
        }
        
        // 2. Check supportDomain
        if (parsedData.supportDomain !== targetDomain) {
          console.warn(`[Validation Fail] supportDomain mismatch: Expected "${targetDomain}", got "${parsedData.supportDomain}"`);
          isValid = false;
        }
        
        // 3. Check affectedLearners are subset of allowedLearners
        if (Array.isArray(parsedData.affectedLearners)) {
          const hasUnallowedLearner = parsedData.affectedLearners.some((l: string) => !allowedLearners.includes(l));
          if (hasUnallowedLearner) {
            console.warn(`[Validation Fail] Unallowed learners found in output: ${parsedData.affectedLearners}`);
            isValid = false;
          }
        } else {
          isValid = false;
        }

        // If validation fails, use fallback data
        if (!isValid) {
          console.warn(`[AjarDaya AI] Output validation failed for risk_lens. Returning structured fallback.`);
          const fallback = getFallbackData(topic, data);
          return res.json({
            source: "local_intelligence_fallback_validated",
            data: fallback,
            message: "Insight aligned using structured demo evidence."
          });
        }
      }

      return res.json({
        source: "gemini_intelligence",
        data: parsedData
      });
    } catch (parseError) {
      console.warn("Failed to parse Gemini response as JSON:", responseText);
      // If parsing fails, wrap the text or try to return a structural fallback
      return res.json({
        source: "gemini_text",
        text: responseText,
        data: getFallbackData(topic, data)
      });
    }

  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED") || (error.status === "RESOURCE_EXHAUSTED");
    const isTransientError = errorMsg.includes("503") || 
                             errorMsg.includes("UNAVAILABLE") || 
                             errorMsg.includes("high demand") || 
                             errorMsg.includes("overloaded") || 
                             errorMsg.includes("fetch failed") || 
                             errorMsg.includes("ENOTFOUND") || 
                             errorMsg.includes("ETIMEDOUT") || 
                             errorMsg.includes("ECONNREFUSED") || 
                             error.status === "UNAVAILABLE" || 
                             error.status === 503;

    if (isQuotaError) {
      // Set bypass for 60 seconds
      quotaExceededUntil = Date.now() + 60000;
      console.warn(`[AjarDaya AI] Gemini API Quota Exceeded (429/RESOURCE_EXHAUSTED) for topic: ${topic}. Temporarily using local fallback intelligence to protect resources.`);
    } else if (isTransientError) {
      // Set bypass for 45 seconds to let the high demand or connection issue clear up
      quotaExceededUntil = Date.now() + 45000;
      console.warn(`[AjarDaya AI] Gemini API Transient/Network error (fetch failed, 503, etc.) for topic: ${topic}. Activating 45-second cooldown and using local fallback intelligence.`);
    } else {
      console.warn(`[AjarDaya AI] Gemini API Call warning (non-quota error) for topic: ${topic}:`, errorMsg);
    }

    // Graceful error recovery: fallback to local precomputed database
    const fallback = getFallbackData(topic, data);
    return res.json({
      source: "local_intelligence_fallback",
      data: fallback,
      error: errorMsg
    });
  }
});

// System Prompts Builder
function buildPrompt(topic: string, data: any): string {
  const baseContext = `
    You are AjarDaya, an AI Decision Intelligence agent for community learning enablement in Indonesia.
    You help schools, NGOs, mentors, and local communities analyze data, prioritize support gaps, run simulations, and allocate resources.
    We are working with Indonesian learning communities and stakeholders (such as Bu Maya, Pak Arif, Kak Nisa, Pak Budi)
    and student personas (Ayu Lestari from East Java, Rafi from Java, Dinda from West Java, Maria from Maluku, Yosep from Papua).
    
    You MUST output your response STRICTLY as a valid, parsable JSON object. No markdown wrappers except valid JSON keys.
    Use English or a professional mixture of Indonesian and English (Indoglish) that Indonesian educators and NGO managers use.
  `;

  switch (topic) {
    case "insights":
      return `
        ${baseContext}
        Generate an active learning insights summary for the dashboard.
        Current statistics:
        - Total active communities: ${data.totalCommunities || 2458}
        - Total learners participating: ${data.totalLearners || 48765}
        - Active programs: ${data.activePrograms || 1238}
        - Completion rate: ${data.completionRate || "78.6%"}
        - Engagement rate: ${data.engagementRate || "82%"}

        You must return a JSON object with:
        {
          "summary": "2-3 sentences overview of the entire national community learning health in English, indicating that communities like East Java and Maluku are showing strong participation, but digital access gaps remain.",
          "alerts": [
            {
              "id": "alert-1",
              "title": "Low Participation in Remote Areas",
              "severity": "high",
              "message": "12 communities in Maluku and Papua are showing participation rates below 40% due to infrastructure limitations.",
              "action": "Initiate offline learning kits deployment"
            },
            {
              "id": "alert-2",
              "title": "Mentor Burnout Risk",
              "severity": "medium",
              "message": "Mentor-to-learner ratio has exceeded 1:45 in West Java. Burnout indicators are emerging.",
              "action": "Recruit localized college volunteer circles"
            }
          ],
          "topHighlights": [
            "Maluku island circle learning centers achieved 85% attendance using offline modules.",
            "East Java digital literacy circles show high peer-to-peer motivation."
          ]
        }
      `;

    case "cohort_actions":
      return `
        ${baseContext}
        Generate Next-Best Actions (NBAs) for learner cohorts.
        Cohorts Status:
        - On Track: ${data.onTrack || 62}%
        - At Risk: ${data.atRisk || 22}%
        - Behind: ${data.behind || 12}%
        - Not Started: ${data.notStarted || 4}%
        
        Selected Filters: Grade: ${data.grade || "All Grades"}, Region: ${data.region || "All Regions"}.

        You must return a JSON object with:
        {
          "nba": [
            {
              "targetCohort": "At Risk Learners",
              "actionTitle": "Activate Micro-Mentoring Circles",
              "impactDescription": "Providing localized peer circles can boost engagement by 15-20% and reduce attrition.",
              "primaryOwner": "Kak Nisa (Community Mentor)",
              "priority": "High"
            },
            {
              "targetCohort": "Behind Learners",
              "actionTitle": "Deploy Targeted Catch-Up Literacy Modules",
              "impactDescription": "Providing focused reading assessments and interactive basic worksheets helps catch up lagging skills.",
              "primaryOwner": "Bu Maya (School Counselor)",
              "priority": "Critical"
            }
          ],
          "regionalTrend": "A brief analysis of regional progress comparing West Java's high digital completion with Papua's offline peer success.",
          "topBlockers": [
            "Lack of consistent mobile data / electricity (Remote Areas)",
            "Language barriers and bilingual support gaps in regional villages",
            "Socio-economic obligations helping families harvest or run home shops"
          ]
        }
      `;

    case "risk_lens":
      return `
        ${baseContext}
        You are generating a support gap explanation for one selected heatmap cell only.
        Use ONLY the provided selected context below.
        Do NOT invent unrelated regions, domains, causes, or learner names.
        Keep the response concise, specific, and strictly grounded in the supplied data.

        Selected Context:
        - selectedLearnerCategory: ${data.selectedLearnerCategory || "Remote islands"}
        - selectedSupportDomain: ${data.selectedSupportDomain || "Digital access"}
        - selectedGapIndex: ${data.selectedGapIndex || 0.5}
        - selectedSeverity: ${data.selectedSeverity || "Medium"}
        - affectedLearners: ${JSON.stringify(data.affectedLearners || [])}
        - learnerSignals: ${JSON.stringify(data.learnerSignals || [])}
        - matchedSupportGap: ${data.matchedSupportGap || "N/A"}
        - recommendedAction: ${data.recommendedAction || "N/A"}
        - cohortToGapTrace: ${JSON.stringify(data.cohortToGapTrace || {})}

        CRITICAL GROUNDING RULES:
        - If selectedLearnerCategory is "Low-income learners" and selectedSupportDomain is "Digital access", you MUST keep the response strictly grounded to Ayu Lestari, Dinda Rahmawati, low-income learners, digital access, limited internet, shared/no personal device, digital learning kits, and offline learning resources.
        - You are STRICTLY FORBIDDEN from mentioning anything unrelated like: Papua, Yosep, Maluku, numeracy, physical access, mountain areas, or bilingual educators.

        Your JSON output MUST match this exact schema:
        {
          "learnerCategory": "${data.selectedLearnerCategory || "Remote islands"}",
          "supportDomain": "${data.selectedSupportDomain || "Digital access"}",
          "severity": "${data.selectedSeverity || "Medium"}",
          "gapIndex": ${data.selectedGapIndex || 0.5},
          "whatTheGapIs": "A 1-2 sentence explanation strictly explaining the actual selected support gap for this category and domain. For low-income learners and digital access, explain that they face limited internet and device access. Use the provided learner names and signals directly. Keep it grounded, factual, and concise.",
          "whyItMatters": "A 1-2 sentence explanation explaining the concrete consequence and urgency (e.g. why missing internet/device access prevents consistent study participation and causes them to fall behind). Keep it specific and highly focused on the selected domain.",
          "evidenceSignals": ["List of signals directly taken from learnerSignals"],
          "affectedLearners": ["List of affected learners taken strictly from affectedLearners"],
          "recommendedAction": "Must match the selected recommendedAction: ${data.recommendedAction || "N/A"}",
          "confidenceNote": "Insight aligned using structured demo evidence."
        }
      `;

    case "intervention_simulation":
      return `
        ${baseContext}
        Simulate learning outcomes based on these active interventions:
        ${JSON.stringify(data.activeInterventions || [])}
        Target Group: ${data.targetGroup || "All Learners"}
        Duration: ${data.duration || "3 Months"}

        Calculate learning gain (%), engagement lift (%), equity impact (high/medium/low), and cost efficiency (IDR per learner/impact ratio).
        
        Return a JSON object in this format:
        {
          "summary": "Short analytical summary of how the selected combination of interventions will affect target groups.",
          "learningGainLift": "+15% expected",
          "engagementLift": "+22% expected",
          "equityImpactScore": "High Impact",
          "costEfficiencyRating": "Very High (Highly scalable physical distribution)",
          "recommendationPriority": "A customized priority recommendation (e.g., Prioritize Offline Learning Kits first, followed by Community Mentoring Circles for Maluku and Papua to bridge the massive gap)."
        }
      `;

    case "resource_allocator":
      return `
        ${baseContext}
        Allocate resources based on total budget in IDR: Rp ${data.totalBudget || "2,500,000,000"}.
        Priority focus selected: ${data.focusArea || "Balanced Enablement"}.
        
        Return a JSON object in this format:
        {
          "recommendedAllocation": [
            {"area": "Learning Support / Modules", "percentage": 35, "amountIdr": "875,000,000"},
            {"area": "Teacher & Mentor Capacity", "percentage": 25, "amountIdr": "625,000,000"},
            {"area": "Digital Learning Kits & Servers", "percentage": 20, "amountIdr": "500,000,000"},
            {"area": "Offline Mobile Infrastructure", "percentage": 15, "amountIdr": "375,000,000"},
            {"area": "Community Circle Incentives", "percentage": 5, "amountIdr": "125,000,000"}
          ],
          "regionalDistribution": [
            {"region": "Maluku & Papua (3T areas)", "percentage": 45, "justification": "Highest digital and physical access support gaps."},
            {"region": "Rural Sumatra & Java", "percentage": 30, "justification": "Substantial learner population requiring mentor scaffolding."},
            {"region": "Urban Disadvantaged Hubs", "percentage": 25, "justification": "Focus on digital literacy and vocational mentorship support."}
          ],
          "justification": "AI-recommended optimization to maximize support for low-infrastructure communities while preserving mentor health.",
          "impactScore": 89,
          "projectedOutcomes": [
            "Over 12,000 learners in 3T regions gaining weekly access to offline digital content.",
            "Mentor-to-learner ratio drops from 1:45 to a highly sustainable 1:20 through community incentivization."
          ]
        }
      `;

    case "action_brief":
      return `
        ${baseContext}
        Generate a comprehensive stakeholder-ready Community Action Brief.
        Key selected constraints:
        - Budget: Rp ${data.budget || "2,500,000,000"}
        - Primary Target: ${data.targetGroup || "Maluku, Papua & Low-Income rural cohorts"}
        - Selected Priorities: ${JSON.stringify(data.priorities || ["Literacy catch-up", "Offline Kits", "Peer mentoring"])}

        Return a JSON object in this format:
        {
          "executiveSummary": "A highly professional, collaborative-focused summary (4-5 sentences) in English, explaining that AjarDaya analyzed community learning gaps and outlines a clear framework to bridge access and mentorship.",
          "keyInsights": [
            "Access to digital infrastructure is the single greatest bottleneck (0.85 gap index).",
            "Micro-mentoring circles led by mentors like Kak Nisa achieve 2x retention over purely individual study."
          ],
          "topPriorities": [
            "Establish 40 new offline-first community learning hubs in remote Maluku and Papua.",
            "Deploy pre-loaded portable digital learning kits with bilingual localized worksheets."
          ],
          "recommendedActions": [
            "Initiate the 'AjarBersama' community drive to recruit 150 local community facilitators.",
            "Distribute cached local server boxes to 15 remote villages."
          ],
          "projectedImpact": {
            "learnerReach": "15,000 learners across 5 regions",
            "literacyNumeracyGain": "Estimated 24% boost in test competency",
            "sustainability": "Community-led structures will survive beyond funding due to local empowerment"
          },
          "timeline30_60_90": {
            "day30": "Draft community MOUs, purchase 100 offline kits, and organize local training sessions led by Pak Arif.",
            "day60": "Deploy kits to East Java and West Java hubs, host first localized circle sessions with Kak Nisa and Bu Maya.",
            "day90": "Scale to Papua & Maluku remote locations, gather assessment data via SMS/offline trackers, adjust allocations."
          },
          "stakeholderSharingChecklist": [
            "Present brief to BAPPEDA and Local Education Office (Dinas Pendidikan)",
            "Circulate WhatsApp summary with school principles (Kepala Sekolah) and Bu Maya",
            "Review allocation with Pak Budi (local community representative) and NGO sponsors"
          ]
        }
      `;

    default:
      return `${baseContext} Return any random valid JSON object.`;
  }
}

// Fallback high-quality localized database for previews
function getFallbackData(topic: string, data: any): any {
  switch (topic) {
    case "insights":
      return {
        summary: "AjarDaya data intelligence indicates that the national participation rate stands at 82%, heavily driven by community learning circles in East Java and Maluku. However, digital access disparities between remote 3T regions and urban areas remain the primary challenge for achieving educational equity.",
        alerts: [
          {
            id: "alert-1",
            title: "Critical Digital Access in Southeast Maluku",
            severity: "high",
            message: "12 learning communities guided by Maria in Southeast Maluku experienced a 35% decline in activity due to internet data and power limitations.",
            action: "Deploy Offline Learning Kits & independent non-digital materials."
          },
          {
            id: "alert-2",
            title: "Excessive Mentor Ratio in West Java",
            severity: "medium",
            message: "The student-to-mentor ratio in West Java (Dinda) has reached 1:48, raising burnout risks for mentor Kak Nisa.",
            action: "Open recruitment for local student volunteers or contact Pak Budi."
          },
          {
            id: "alert-3",
            title: "Lagging Numeracy Achievements in Papua",
            severity: "high",
            message: "Yosep's data in Papua indicates that basic reading skills are improving, but foundational numeracy remains stagnant.",
            action: "Allocate budget specifically for creative physical numeracy flashcards."
          }
        ],
        topHighlights: [
          "Independent learning circles in Maluku achieved an 85% module completion rate using interactive printed worksheets.",
          "East Java digital literacy circles (Ayu Lestari) recorded a 2.1x increase in reading interest over the last two months."
        ]
      };

    case "cohort_actions":
      const grade = data.grade || "All Grades";
      const region = data.region || "All Regions";
      return {
        nba: [
          {
            targetCohort: "At-Risk Learners (22%)",
            actionTitle: "Activate Peer-to-Peer Learning Circles",
            impactDescription: "Grouping at-risk students with peer tutors increases task completion by 25% and reduces learning anxiety.",
            primaryOwner: "Kak Nisa (Community Mentor)",
            priority: "High"
          },
          {
            targetCohort: "Behind Learners (12%)",
            actionTitle: "Design Targeted Remedial Literacy Plans",
            impactDescription: "A 15-minute 1-on-1 intervention using picture-word cards helps lagging students catch up within 6 weeks.",
            primaryOwner: "Bu Maya (School Counselor)",
            priority: "Critical"
          },
          {
            targetCohort: "On-Track Learners (62%)",
            actionTitle: "Offer Local Creative Project Challenges",
            impactDescription: "Students who are already on-track are given self-paced project-based learning modules to solve village challenges and build leadership.",
            primaryOwner: "Pak Arif (NGO Program Manager)",
            priority: "Medium"
          }
        ],
        regionalTrend: `The progress trend for ${grade} in ${region} demonstrates that face-to-face learning circles at community halls (Pak Budi's circle) perform significantly more stably compared to mobile-only self-study in weak signal areas.`,
        topBlockers: [
          "Lack of personal learning devices (students share a single smartphone with their parents)",
          "Formal instructional language barriers (some pupils in Papua highlands prefer local dialects over standard Indonesian)",
          "Domestic duties such as helping harvest crops or babysitting younger siblings while parents work"
        ]
      };

    case "risk_lens": {
      const selGroup = data?.selectedLearnerCategory || data?.group || "Remote islands";
      const selDomain = data?.selectedSupportDomain || data?.domain || "Digital access";
      const selScore = Number(data?.selectedGapIndex || data?.gapScore || 0.5);
      const selSev = data?.selectedSeverity || (selScore >= 0.8 ? "Critical" : selScore >= 0.6 ? "High" : selScore >= 0.4 ? "Medium" : "Low");
      const affLearners = data?.affectedLearners || (selGroup === "Low-income learners" ? ["Ayu Lestari", "Dinda Rahmawati"] : selGroup === "Papua" ? ["Yosep Wenda"] : selGroup === "Rural learners" ? ["Rafi Pratama"] : ["Ayu Lestari"]);
      const signals = data?.learnerSignals || (selGroup === "Low-income learners" ? ["limited internet access", "limited device access"] : ["lack of local resources"]);
      const recAct = data?.recommendedAction || "Provide supportive local infrastructure and learning materials.";

      // Tailored fallback sentences for realistic content style
      let what = `${selGroup} face significant barriers in ${selDomain.toLowerCase()} with a gap index of ${selScore.toFixed(2)}, leading to uneven learning experiences.`;
      let why = `Without addressing the ${selDomain.toLowerCase()} gap, learners cannot maintain academic momentum, resulting in increased risk of falling behind.`;

      if (selGroup === "Low-income learners" && selDomain.toLowerCase().includes("digital")) {
        what = `Low-income learners such as Ayu Lestari and Dinda Rahmawati face limited internet connectivity and insufficient access to personal learning devices, making digital participation inconsistent.`;
        why = `When learners cannot reliably access digital content, they fall behind in assignments, lose continuity in learning routines, and become less prepared to participate in structured academic support.`;
      } else if (selGroup === "Remote islands") {
        what = `Learners in remote island communities like Maria Lewaherilla face extreme isolation from stable networks and lack local physical educational resources.`;
        why = `Geographic isolation combined with sparse resources leaves students with fewer tutoring networks, compounding learning delays compared to main-island schools.`;
      } else if (selGroup === "Papua" && selDomain.toLowerCase().includes("mentor")) {
        what = `Learners in Papua like Yosep Wenda experience a severe bottleneck in support due to a shortage of qualified local mentors and structured coaching circles.`;
        why = `Without dedicated human scaffolding to guide math and language studies, student dropouts increase and regional learning losses persist.`;
      } else if (selGroup === "Rural learners" && selDomain.toLowerCase().includes("participation")) {
        what = `Rural learners like Rafi Pratama experience high participation gaps due to agriculture and household chores during planting and harvest seasons.`;
        why = `Irregular school and study group attendance disrupts learning cycles, leading to significant gaps in fundamental subject areas.`;
      } else {
        // Generically tailored fallback that sounds highly professional
        what = `${selGroup} face critical constraints in ${selDomain.toLowerCase()} (${selSev} gap of ${selScore.toFixed(2)}), making consistent learning highly challenging.`;
        why = `Leaving this gap unaddressed prevents students from achieving equitable outcomes, reinforcing geographic and socio-economic divisions.`;
      }

      return {
        learnerCategory: selGroup,
        supportDomain: selDomain,
        severity: selSev,
        gapIndex: selScore,
        whatTheGapIs: what,
        whyItMatters: why,
        evidenceSignals: signals,
        affectedLearners: affLearners,
        recommendedAction: recAct,
        confidenceNote: "Insight aligned using structured demo evidence."
      };
    }

    case "intervention_simulation":
      const selected = data.activeInterventions || [];
      let calculatedGain = 5;
      let calculatedEngagement = 8;
      let summaryText = "Select a combination of interventions in the simulator panel to project potential impacts.";

      if (selected.includes("after_school")) {
        calculatedGain += 8;
        calculatedEngagement += 10;
      }
      if (selected.includes("teacher_coaching")) {
        calculatedGain += 10;
        calculatedEngagement += 5;
      }
      if (selected.includes("mentoring_circles")) {
        calculatedGain += 6;
        calculatedEngagement += 15;
      }
      if (selected.includes("digital_kits")) {
        calculatedGain += 12;
        calculatedEngagement += 12;
      }
      if (selected.includes("parent_sessions")) {
        calculatedGain += 5;
        calculatedEngagement += 8;
      }
      if (selected.includes("offline_resources")) {
        calculatedGain += 7;
        calculatedEngagement += 6;
      }

      if (selected.length > 0) {
        summaryText = `Simulation shows that combining these ${selected.length} interventions will provide a highly positive multiplicative impact, especially by pairing physical (offline) material distribution with social mentoring circles.`;
      }

      return {
        summary: summaryText,
        learningGainLift: `+${calculatedGain}%`,
        engagementLift: `+${calculatedEngagement}%`,
        equityImpactScore: selected.includes("offline_resources") || selected.includes("mentoring_circles") ? "High Equity" : "Medium Equity",
        costEfficiencyRating: selected.length > 3 ? "Optimal (Highly Optimal Budget Allocation)" : "Highly Cost-Effective",
        recommendationPriority: "The most effective combination for rural remote areas is pairing 'Offline Learning Resources' with 'Community Mentoring Circles' (led by mentors like Kak Nisa) to ensure worksheets are delivered and students remain highly motivated."
      };

    case "resource_allocator":
      const budget = data.totalBudget || 2500000000;
      const budgetFmt = budget.toLocaleString("en-US");
      return {
        recommendedAllocation: [
          { area: "Learning Materials & Printed Worksheets", percentage: 35, amountIdr: `Rp ${(budget * 0.35).toLocaleString("id-ID")}` },
          { area: "Teacher & Mentor Professional Capacity", percentage: 25, amountIdr: `Rp ${(budget * 0.25).toLocaleString("id-ID")}` },
          { area: "Offline Digital Learning Kits (AjarBox & Tablets)", percentage: 20, amountIdr: `Rp ${(budget * 0.2).toLocaleString("id-ID")}` },
          { area: "Community Study Center Operations", percentage: 15, amountIdr: `Rp ${(budget * 0.15).toLocaleString("id-ID")}` },
          { area: "Local Mentor Stipends & Incentives", percentage: 5, amountIdr: `Rp ${(budget * 0.05).toLocaleString("id-ID")}` }
        ],
        regionalDistribution: [
          { region: "Southeast Maluku & Papua Highlands (3T)", percentage: 45, justification: "Receives the largest allocation as digital access gaps and device shortages have reached critical levels." },
          { region: "Rural Sumatra & Java (West & East)", percentage: 30, justification: "Focuses on post-school peer mentoring to reduce early drop-out risks." },
          { region: "Marginal Urban Areas (Disadvantaged Hubs)", percentage: 25, justification: "Focuses on basic literacy and numeracy programs for street children and shared digital center resources." }
        ],
        justification: `This total budget allocation of Rp ${budgetFmt} has been mathematically optimized using localized gap data. AI recommends directing the majority of funds toward remote 3T areas and non-internet resources to maximize impact per dollar invested.`,
        impactScore: 92,
        projectedOutcomes: [
          "Over 8,500 children on remote islands gain consistent access to structured learning without signal dependence.",
          "Around 350 local mentors are trained to facilitate independent community study circles.",
          "Average community learning participation increases to 88% within 6 months."
        ]
      };

    case "action_brief":
      return {
        executiveSummary: "This AjarDaya Community Action Brief serves as a collaborative roadmap for multi-stakeholder coordination (NGOs, schools, community leaders) to address regional learning gaps. Based on systematic analysis, our primary challenges are digital isolation and a shortage of trained local mentors. This document outlines a comprehensive community-led framework to double learning motivation and restore literacy competencies.",
        keyInsights: [
          "Access gaps on small remote islands (Maria) and mountain highlands (Yosep) demand physical non-internet solutions over online apps.",
          "Sustained peer guidance by local mentors (such as Kak Nisa) increases learner retention by up to 2.5x in low-infrastructure environments."
        ],
        topPriorities: [
          "Distribute 120 Offline AjarBox Kits to remote areas of Maluku and Papua highlands.",
          "Host integrated training for 80 community mentors on creative physical numeracy pedagogy.",
          "Foster active collaboration with parents through monthly localized family reading circles."
        ],
        recommendedActions: [
          "Establish weekly coordination forums connecting school teachers (Bu Maya) with community circle mentors (Kak Nisa).",
          "Conduct a collaborative home learning device audit alongside community leader Pak Budi to gauge physical access."
        ],
        projectedImpact: {
          "learnerReach": "Reach over 10,000+ vulnerable learners nationwide",
          "literacyNumeracyGain": "Projected 26% improvement in basic foundational literacy and numeracy levels",
          "sustainability": "Establishment of an independent, self-sustaining community learning ecosystem supported by local leaders"
        },
        timeline30_60_90: {
          "day30": "Socialize the program with local traditional and community leaders with Pak Budi, arrange printed modules, and open volunteer registrations.",
          "day60": "Official rollout of 15 Visiting Teacher Circles in remote Maluku, initiating weekly reading sessions with Ayu Lestari and Dinda.",
          "day90": "Evaluate mid-program reading scores, share insights with regional education offices, and draft secondary scale-out plans."
        },
        stakeholderSharingChecklist: [
          "Present this action brief PDF to the regional education office (Dinas Pendidikan)",
          "Distribute a highly scannable WhatsApp text summary to Parent-Teacher Associations",
          "Present budget allocations and projected outcome dashboards to NGO funding boards and sponsors"
        ]
      };

    default:
      return { status: "unknown" };
  }
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
