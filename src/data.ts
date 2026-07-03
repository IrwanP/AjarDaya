import { Persona, Intervention } from "./types";

export const PERSONAS: Persona[] = [
  {
    name: "Ayu Lestari",
    role: "Student (East Java)",
    region: "Jawa",
    bio: "Motivated 17-year-old learner in Banyuwangi who wants to improve academic performance and digital skills. Main challenges: inconsistent internet, limited laptop access, limited mentoring support.",
    avatarSeed: "ayu",
    isStudent: true
  },
  {
    name: "Rafi Pratama",
    role: "Student (East Java)",
    region: "Jawa",
    bio: "Student in East Java who faces irregular attendance because he helps his family with work after school. Needs flexible learning support and mentoring.",
    avatarSeed: "rafi",
    isStudent: true
  },
  {
    name: "Dinda Rahmawati",
    role: "Student (West Java)",
    region: "Jawa",
    bio: "Active and enthusiastic student in West Java who lacks access to a personal device for home study. Needs digital learning access and learning materials.",
    avatarSeed: "dinda",
    isStudent: true
  },
  {
    name: "Maria Lewaherilla",
    role: "Student (Maluku)",
    region: "Maluku Islands",
    bio: "Student in Maluku who has limited learning resources and fewer local support programs. Needs offline learning materials and community mentoring.",
    avatarSeed: "maria",
    isStudent: true
  },
  {
    name: "Yosep Wenda",
    role: "Student (Papua)",
    region: "Papua",
    bio: "Highly motivated student in Papua who needs structured mentorship and access to learning support. Needs mentoring circle and a targeted learning pathway.",
    avatarSeed: "yosep",
    isStudent: true
  },
  {
    name: "Bu Maya",
    role: "School Counselor",
    region: "Jawa",
    bio: "A school counselor whose goal is to identify which learners need support first and coordinate guidance.",
    avatarSeed: "maya",
    isStudent: false
  },
  {
    name: "Pak Arif",
    role: "NGO Program Manager",
    region: "National",
    bio: "An NGO program manager whose goal is to prioritize the right intervention for limited budget and mentor capacity.",
    avatarSeed: "arif",
    isStudent: false
  },
  {
    name: "Kak Nisa",
    role: "Community Mentor",
    region: "Jawa",
    bio: "A community mentor whose goal is to coordinate mentoring circles, lead study sessions, and provide student follow-up.",
    avatarSeed: "nisa",
    isStudent: false
  },
  {
    name: "Pak Budi",
    role: "Community Representative",
    region: "Bali & Nusa Tenggara",
    bio: "A community representative whose goal is to align local stakeholders, parents, and support local implementation.",
    avatarSeed: "budi",
    isStudent: false
  }
];

export const INTERVENTIONS: Intervention[] = [
  {
    id: "after_school",
    name: "After-school Tutoring",
    description: "Targeted additional tutoring sessions twice a week after formal school hours for critical literacy and numeracy.",
    estimatedGain: 12,
    estimatedEngagement: 15,
    estimatedEquity: "Medium",
    costPerLearner: "$10 / learner",
    recommendedPriority: "High",
    color: "emerald"
  },
  {
    id: "teacher_coaching",
    name: "Teacher Coaching",
    description: "Professional coaching for local teachers to implement child-friendly, interactive learning methods.",
    estimatedGain: 16,
    estimatedEngagement: 8,
    estimatedEquity: "Medium",
    costPerLearner: "$20 / learner",
    recommendedPriority: "High",
    color: "indigo"
  },
  {
    id: "mentoring_circles",
    name: "Community Mentoring Circles",
    description: "Small study circles (10 children) led by local youth mentor volunteers using learning-through-play modules.",
    estimatedGain: 10,
    estimatedEngagement: 25,
    estimatedEquity: "High",
    costPerLearner: "$5 / learner",
    recommendedPriority: "Critical",
    color: "teal"
  },
  {
    id: "digital_kits",
    name: "Digital Learning Kits",
    description: "Providing durable low-cost tablets with pre-installed offline educational apps and a solar-powered local server.",
    estimatedGain: 18,
    estimatedEngagement: 22,
    estimatedEquity: "High",
    costPerLearner: "$50 / learner",
    recommendedPriority: "Critical",
    color: "blue"
  },
  {
    id: "parent_sessions",
    name: "Parent Learning Sessions",
    description: "Monthly support sessions for parents on techniques for reading with children at home and maintaining psychosocial well-being.",
    estimatedGain: 8,
    estimatedEngagement: 12,
    estimatedEquity: "Medium",
    costPerLearner: "$2.50 / learner",
    recommendedPriority: "Medium",
    color: "amber"
  },
  {
    id: "offline_resources",
    name: "Offline Learning Resources",
    description: "Direct distribution of storybooks, physical flashcards, and numeracy posters to learner homes in remote 3T areas.",
    estimatedGain: 11,
    estimatedEngagement: 18,
    estimatedEquity: "High",
    costPerLearner: "$8 / learner",
    recommendedPriority: "Critical",
    color: "orange"
  }
];

export const HEATMAP_GROUPS = [
  "Urban learners",
  "Rural learners",
  "Low-income learners",
  "Remote islands",
  "Maluku",
  "Papua",
  "Learners with disabilities"
];

export const HEATMAP_DOMAINS = [
  "Access",
  "Literacy",
  "Numeracy",
  "Mentorship",
  "Participation",
  "Digital access"
];

// Initial precalculated gaps (0 = low gap, 1 = high gap)
export const SUPPORT_GAPS_MATRIX: { [key: string]: { [key: string]: number } } = {
  "Urban learners": {
    "Access": 0.22,
    "Literacy": 0.31,
    "Numeracy": 0.35,
    "Mentorship": 0.40,
    "Participation": 0.28,
    "Digital access": 0.15
  },
  "Rural learners": {
    "Access": 0.52,
    "Literacy": 0.48,
    "Numeracy": 0.54,
    "Mentorship": 0.45,
    "Participation": 0.38,
    "Digital access": 0.65
  },
  "Low-income learners": {
    "Access": 0.61,
    "Literacy": 0.52,
    "Numeracy": 0.58,
    "Mentorship": 0.55,
    "Participation": 0.44,
    "Digital access": 0.72
  },
  "Remote islands": {
    "Access": 0.82,
    "Literacy": 0.65,
    "Numeracy": 0.70,
    "Mentorship": 0.75,
    "Participation": 0.58,
    "Digital access": 0.88
  },
  "Maluku": {
    "Access": 0.76,
    "Literacy": 0.58,
    "Numeracy": 0.62,
    "Mentorship": 0.68,
    "Participation": 0.52,
    "Digital access": 0.81
  },
  "Papua": {
    "Access": 0.89,
    "Literacy": 0.72,
    "Numeracy": 0.78,
    "Mentorship": 0.79,
    "Participation": 0.61,
    "Digital access": 0.85
  },
  "Learners with disabilities": {
    "Access": 0.80,
    "Literacy": 0.62,
    "Numeracy": 0.65,
    "Mentorship": 0.78,
    "Participation": 0.70,
    "Digital access": 0.55
  }
};

export const INDONESIA_MAP_REGIONS = [
  { name: "Sumatra", x: 18, y: 35, count: 485, active: 12050 },
  { name: "Jawa", x: 38, y: 70, count: 1120, active: 22400 },
  { name: "Kalimantan", x: 45, y: 38, count: 310, active: 5800 },
  { name: "Sulawesi", x: 62, y: 45, count: 280, active: 4120 },
  { name: "Bali & Nusa Tenggara", x: 55, y: 75, count: 125, active: 2150 },
  { name: "Maluku Islands", x: 78, y: 48, count: 95, active: 1125 },
  { name: "Papua", x: 92, y: 56, count: 43, active: 1120 }
];

export const MONTHLY_TREND = [
  { month: "Jan", participants: 28500, sessions: 1820 },
  { month: "Feb", participants: 29800, sessions: 1940 },
  { month: "Mar", participants: 34200, sessions: 2420 },
  { month: "Apr", participants: 35900, sessions: 2580 },
  { month: "May", participants: 43600, sessions: 3210 },
  { month: "Jun", participants: 48765, sessions: 3621 }
];

export const COHORT_GRADES = [
  "Grade 1-3 Primary (Early Literacy)",
  "Grade 4-6 Primary",
  "Grade 7-9 Middle School",
  "Grade 10-12 High School"
];
