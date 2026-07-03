import { jsPDF } from "jspdf";

export function downloadActionBriefPdf(
  brief: {
    executiveSummary: string;
    keyInsights: string[];
    topPriorities: string[];
    recommendedActions: string[];
    projectedImpact: {
      learnerReach: string;
      literacyNumeracyGain: string;
      sustainability: string;
    };
    timeline30_60_90: {
      day30: string;
      day60: string;
      day90: string;
    };
    stakeholderSharingChecklist: string[];
  },
  isDemoActive: boolean,
  budget: string,
  lastGenerated: string | null
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFont("helvetica", "normal");

  let y = 20;
  const margin = 20;
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - margin * 2; // 170

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > 275) {
      doc.addPage();
      y = 20;
      // Add page header
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "AjarDaya Community Action Brief — Stakeholder Alignment Roadmap",
        margin,
        12
      );
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.2);
      doc.line(margin, 14, pageWidth - margin, 14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
    }
  }

  // Draw Header Stamp / Header lines
  doc.setDrawColor(13, 148, 136); // Teal color
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Badge "AjarDaya AI Output"
  doc.setFillColor(240, 253, 250); // Light teal
  doc.rect(margin, y, 42, 5, "F");
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110); // Dark teal
  doc.setFont("helvetica", "bold");
  doc.text("AJARDAYA AI OUTPUT", margin + 3, y + 3.8);

  // Badge "Generated with Gemini"
  doc.setFillColor(245, 243, 255); // Light purple
  doc.rect(margin + 46, y, 38, 5, "F");
  doc.setTextColor(109, 40, 217); // Purple
  doc.text("GENERATED WITH GEMINI", margin + 46 + 2.5, y + 3.8);

  y += 9;

  // Document title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Dark slate
  const titleText = isDemoActive
    ? "EAST JAVA COMMUNITY STUDY GROUP CLUSTERS"
    : "COMMUNITY ACTION BRIEF";
  doc.text(titleText, margin, y);
  y += 6;

  // Metadata
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const docNo = isDemoActive ? "AB-2026-JAVA-01" : "AD/CAB/2026/06-29";
  const genTime = lastGenerated
    ? `Time: ${lastGenerated}`
    : "Time: June 29, 2026";
  doc.text(
    `Document No: ${docNo}  |  Date: June 29, 2026  |  ${genTime}`,
    margin,
    y
  );
  y += 8;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Workspace Context info
  doc.setFillColor(248, 250, 252); // Light slate bg
  doc.rect(margin, y, contentWidth, 24, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Workspace Environment & Context:", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Organization:", margin + 4, y + 10);
  doc.text("User / Role:", margin + 4, y + 14);
  doc.text("Allocated Budget:", margin + 4, y + 18);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Nusantara Learning Foundation (Demo NGO Supporter Workspace)",
    margin + 30,
    y + 10
  );
  doc.text("Pak Arif (NGO Program Manager)", margin + 30, y + 14);
  doc.text(budget || "Rp 2,500,000,000", margin + 30, y + 18);

  y += 30;

  // Executive Summary
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110); // Teal
  doc.text("Executive Summary", margin, y);
  y += 4;

  // Draw left border line for blockquote
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(1);
  doc.line(margin, y, margin, y + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(
    brief.executiveSummary,
    contentWidth - 6
  );
  doc.text(summaryLines, margin + 4, y + 4);

  y += summaryLines.length * 5 + 6;

  // Key Gaps & Insights
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text("Key Gaps & Data Insights", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  brief.keyInsights.forEach((insight: string, idx: number) => {
    const text = `${idx + 1}. ${insight}`;
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, margin, y + 3);
    y += lines.length * 5 + 3;
  });

  y += 5;

  // Top Priorities
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text("Top Community Priorities", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  brief.topPriorities.forEach((pri: string, idx: number) => {
    const text = `* ${pri}`;
    const lines = doc.splitTextToSize(text, contentWidth - 4);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, margin + 2, y + 3);
    y += lines.length * 5 + 3;
  });

  y += 5;

  // Recommended Actions
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text("Recommended Action Plans", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  brief.recommendedActions.forEach((act: string, idx: number) => {
    const text = `[Action Plan ${idx + 1}] ${act}`;
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, margin, y + 3);
    y += lines.length * 5 + 3;
  });

  y += 5;

  // Projected Impact
  checkPageBreak(45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text("Projected Social Impact", margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Learner Reach
  doc.text("Learner Reach:", margin, y + 3);
  doc.setFont("helvetica", "normal");
  const reachLines = doc.splitTextToSize(
    brief.projectedImpact.learnerReach,
    contentWidth - 35
  );
  doc.text(reachLines, margin + 35, y + 3);
  y += Math.max(1, reachLines.length) * 5;

  // Academic Gain
  checkPageBreak(15);
  doc.setFont("helvetica", "bold");
  doc.text("Academic Gain:", margin, y + 3);
  doc.setFont("helvetica", "normal");
  const gainLines = doc.splitTextToSize(
    brief.projectedImpact.literacyNumeracyGain,
    contentWidth - 35
  );
  doc.text(gainLines, margin + 35, y + 3);
  y += Math.max(1, gainLines.length) * 5;

  // Sustainability
  checkPageBreak(15);
  doc.setFont("helvetica", "bold");
  doc.text("Sustainability:", margin, y + 3);
  doc.setFont("helvetica", "normal");
  const sustLines = doc.splitTextToSize(
    brief.projectedImpact.sustainability,
    contentWidth - 35
  );
  doc.text(sustLines, margin + 35, y + 3);
  y += Math.max(1, sustLines.length) * 5 + 5;

  // 30-60-90 Day Roadmap
  checkPageBreak(50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text("30-60-90 Day Tactical Roadmap", margin, y);
  y += 5;

  // 30 days
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("Days 1-30 (Initiation & Outreach):", margin, y + 3);
  doc.setFont("helvetica", "normal");
  const d30Lines = doc.splitTextToSize(
    brief.timeline30_60_90.day30,
    contentWidth
  );
  y += 8;
  doc.text(d30Lines, margin, y);
  y += d30Lines.length * 4.5 + 4;

  // 60 days
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.text("Days 31-60 (Logistics & First Sessions):", margin, y);
  doc.setFont("helvetica", "normal");
  const d60Lines = doc.splitTextToSize(
    brief.timeline30_60_90.day60,
    contentWidth
  );
  y += 5;
  doc.text(d60Lines, margin, y);
  y += d60Lines.length * 4.5 + 4;

  // 90 days
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.text("Days 61-90 (Evaluation & Scale-up):", margin, y);
  doc.setFont("helvetica", "normal");
  const d90Lines = doc.splitTextToSize(
    brief.timeline30_60_90.day90,
    contentWidth
  );
  y += 5;
  doc.text(d90Lines, margin, y);
  y += d90Lines.length * 4.5 + 5;

  // Sharing Checklist
  checkPageBreak(35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text("Stakeholder Sharing & Mobilization Checklist", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  brief.stakeholderSharingChecklist.forEach((item: string, idx: number) => {
    const text = `[ ] ${item}`;
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, margin, y + 3);
    y += lines.length * 5 + 3;
  });

  // Add page numbers at the bottom of all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "AjarDaya Indonesia — Empowering localized, community-led learning",
      margin,
      pageHeight - 10
    );
  }

  doc.save("AjarDaya_Action_Brief_AB-2026-JAWA-01.pdf");
}
