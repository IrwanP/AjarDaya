export interface Persona {
  name: string;
  role: string;
  region: string;
  bio: string;
  avatarSeed: string; // Used for unique visual representation (e.g. dicebear or initial avatars)
  isStudent: boolean;
}

export interface Alert {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  message: string;
  action: string;
}

export interface SupportGap {
  group: string;
  domain: string;
  gapScore: number; // 0 to 1
  what: string;
  why: string;
  action: string;
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  estimatedGain: number; // %
  estimatedEngagement: number; // %
  estimatedEquity: "High" | "Medium" | "Low";
  costPerLearner: string;
  recommendedPriority: "High" | "Medium" | "Low" | "Critical";
  color: string;
}

export interface SimulationResult {
  summary: string;
  learningGainLift: string;
  engagementLift: string;
  equityImpactScore: string;
  costEfficiencyRating: string;
  recommendationPriority: string;
  whyThisMixFits?: string;
  supportGapsAddressed?: string[];
  expectedImpact?: string;
  tradeOffToReview?: string;
  recommendedNextStep?: string;
}

export interface AllocationArea {
  area: string;
  percentage: number;
  amountIdr: string;
}

export interface AllocationRegion {
  region: string;
  percentage: number;
  justification: string;
}

export interface ResourceAllocation {
  recommendedAllocation: AllocationArea[];
  regionalDistribution: AllocationRegion[];
  justification: string;
  impactScore: number;
  projectedOutcomes: string[];
}

export interface ActionBrief {
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
}

export interface CommandCenterData {
  totalCommunities: number;
  totalLearners: number;
  activePrograms: number;
  completionRate: string;
  engagementRate: string;
  summary: string;
  alerts: Alert[];
  topHighlights: string[];
}

export interface CohortNBA {
  targetCohort: string;
  actionTitle: string;
  impactDescription: string;
  primaryOwner: string;
  priority: string;
}

export interface CohortIntelligenceData {
  nba: CohortNBA[];
  regionalTrend: string;
  topBlockers: string[];
}
