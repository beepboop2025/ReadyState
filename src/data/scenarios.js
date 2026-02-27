import {
  CloudLightning, Briefcase, Wifi, Bug, Zap, Stethoscope,
  TrendingDown, Truck,
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'job-loss',
    name: 'Job Loss',
    icon: Briefcase,
    color: '#f59e0b',
    severity: 'high',
    description: 'Sudden loss of primary income source.',
    impacts: {
      financial: { weight: 0.40, reason: 'Emergency fund, debt ratio, insurance continuity' },
      skills:    { weight: 0.25, reason: 'Resume readiness, transferable skills, current learning' },
      network:   { weight: 0.20, reason: 'Professional contacts, community support' },
      health:    { weight: 0.10, reason: 'Mental health, stress management' },
      digital:   { weight: 0.05, reason: 'Portfolio/resume backups, account access' },
      supplies:  { weight: 0.00, reason: 'Minimal direct impact' },
    },
    criticalItems: ['fin-01', 'fin-02', 'fin-09', 'fin-10', 'skl-09', 'skl-10', 'hlt-09'],
    tips: [
      'Build your emergency fund to cover 3-6 months of bare-minimum expenses.',
      'Keep your resume updated and LinkedIn active — always be ready.',
      'Develop skills that transfer across industries.',
      'Build your professional network before you need it.',
    ],
  },
  {
    id: 'natural-disaster',
    name: 'Natural Disaster',
    icon: CloudLightning,
    color: '#ef4444',
    severity: 'critical',
    description: 'Earthquake, hurricane, wildfire, or severe flooding.',
    impacts: {
      supplies:  { weight: 0.30, reason: 'Food, water, first aid, go-bag, documents' },
      network:   { weight: 0.25, reason: 'Emergency plan, meeting points, communication' },
      health:    { weight: 0.20, reason: 'Physical fitness, medical preparedness' },
      financial: { weight: 0.15, reason: 'Insurance, emergency funds, document preservation' },
      skills:    { weight: 0.05, reason: 'First aid, utility shutoffs, navigation' },
      digital:   { weight: 0.05, reason: 'Cloud backups, device protection' },
    },
    criticalItems: ['sup-01', 'sup-02', 'sup-05', 'sup-12', 'sup-13', 'net-08', 'net-09', 'net-10', 'skl-01', 'skl-04'],
    tips: [
      'Know your area\'s specific risks (earthquake zone, flood plain, wildfire risk).',
      'Have your go-bag packed and accessible — near the front door.',
      'Practice your evacuation route with your entire household.',
      'Keep physical copies of documents in a waterproof container.',
    ],
  },
  {
    id: 'cyberattack',
    name: 'Cyberattack / Data Breach',
    icon: Wifi,
    color: '#3b82f6',
    severity: 'high',
    description: 'Account compromise, ransomware, or identity theft.',
    impacts: {
      digital:   { weight: 0.45, reason: 'Passwords, 2FA, backups, encryption' },
      financial: { weight: 0.30, reason: 'Banking access, fraud protection, credit monitoring' },
      network:   { weight: 0.10, reason: 'Warning contacts, shared account access' },
      health:    { weight: 0.05, reason: 'Stress management during recovery' },
      skills:    { weight: 0.05, reason: 'Technical literacy for response' },
      supplies:  { weight: 0.05, reason: 'Physical document backups' },
    },
    criticalItems: ['dig-01', 'dig-02', 'dig-03', 'dig-04', 'dig-05', 'dig-08', 'dig-12', 'fin-13'],
    tips: [
      'A password manager is your single best defense against account compromise.',
      'Enable 2FA on EVERY account that supports it — especially email.',
      'Regular backups protect against ransomware better than any antivirus.',
      'Freeze your credit at all three bureaus — it\'s free and reversible.',
    ],
  },
  {
    id: 'pandemic',
    name: 'Pandemic / Health Crisis',
    icon: Bug,
    color: '#8b5cf6',
    severity: 'high',
    description: 'Widespread illness with supply chain disruption and isolation.',
    impacts: {
      health:    { weight: 0.30, reason: 'Vaccinations, fitness, mental health, medications' },
      supplies:  { weight: 0.25, reason: 'Extended food/water/medical supplies' },
      financial: { weight: 0.20, reason: 'Income stability, emergency savings' },
      network:   { weight: 0.15, reason: 'Support systems, community aid' },
      skills:    { weight: 0.05, reason: 'Remote work ability, self-sufficiency' },
      digital:   { weight: 0.05, reason: 'Remote communication tools' },
    },
    criticalItems: ['hlt-04', 'hlt-07', 'hlt-09', 'sup-01', 'sup-02', 'sup-04', 'sup-06', 'fin-01', 'net-05'],
    tips: [
      'Keep a 30-day supply of medications — pharmacies can face shortages.',
      'Stock 7+ days of food and water (supply chains can break down).',
      'Build community connections — mutual aid networks saved lives in COVID.',
      'Maintain physical and mental health routines even during isolation.',
    ],
  },
  {
    id: 'power-outage',
    name: 'Extended Power Outage',
    icon: Zap,
    color: '#f97316',
    severity: 'medium',
    description: 'Multi-day blackout from storm, grid failure, or infrastructure attack.',
    impacts: {
      supplies:  { weight: 0.35, reason: 'Flashlights, batteries, power banks, food that doesn\'t need cooking' },
      digital:   { weight: 0.25, reason: 'Device charging, offline access to info' },
      skills:    { weight: 0.15, reason: 'Cooking without power, utility management' },
      network:   { weight: 0.15, reason: 'Communication without internet/phone' },
      financial: { weight: 0.05, reason: 'Cash on hand (card readers won\'t work)' },
      health:    { weight: 0.05, reason: 'Temperature-sensitive medications' },
    },
    criticalItems: ['sup-08', 'sup-09', 'sup-01', 'sup-02', 'fin-03', 'net-10', 'skl-04', 'skl-05'],
    tips: [
      'Keep phones and battery banks charged — treat it like keeping gas in the tank.',
      'Cash is king during outages — ATMs and card readers won\'t work.',
      'Know how to stay warm/cool without HVAC (blankets, fans, shade).',
      'NOAA weather radio works when cell towers go down.',
    ],
  },
  {
    id: 'medical-emergency',
    name: 'Medical Emergency',
    icon: Stethoscope,
    color: '#ec4899',
    severity: 'critical',
    description: 'Serious injury or illness requiring immediate response.',
    impacts: {
      health:    { weight: 0.35, reason: 'Medical records, allergies, medications, fitness' },
      network:   { weight: 0.25, reason: 'ICE contacts, family notification, hospital location' },
      financial: { weight: 0.25, reason: 'Insurance coverage, emergency funds for copays/deductibles' },
      skills:    { weight: 0.10, reason: 'CPR, first aid, choking response' },
      digital:   { weight: 0.05, reason: 'Access to medical records, insurance info' },
      supplies:  { weight: 0.00, reason: 'Minimal direct impact beyond first aid' },
    },
    criticalItems: ['hlt-01', 'hlt-02', 'hlt-03', 'net-01', 'net-02', 'net-07', 'fin-04', 'skl-01', 'skl-02', 'sup-05'],
    tips: [
      'Seconds matter — know your nearest hospital and fastest route.',
      'ICE contacts in your phone let paramedics reach your family.',
      'A medical alert bracelet can save your life if you\'re unconscious.',
      'Learn CPR — it doubles survival rates for cardiac arrest.',
    ],
  },
  {
    id: 'economic-crisis',
    name: 'Economic Recession',
    icon: TrendingDown,
    color: '#6366f1',
    severity: 'high',
    description: 'Prolonged economic downturn with job market contraction.',
    impacts: {
      financial: { weight: 0.40, reason: 'Savings, debt management, income diversification' },
      skills:    { weight: 0.30, reason: 'Employability, adaptability, upskilling' },
      network:   { weight: 0.15, reason: 'Professional network, community support' },
      health:    { weight: 0.10, reason: 'Mental health during financial stress' },
      digital:   { weight: 0.03, reason: 'Online presence for job hunting' },
      supplies:  { weight: 0.02, reason: 'Cost savings from stocked supplies' },
    },
    criticalItems: ['fin-01', 'fin-02', 'fin-08', 'fin-09', 'fin-10', 'skl-09', 'skl-10', 'skl-11', 'skl-12', 'hlt-09'],
    tips: [
      'Recessions reward those who prepared — emergency funds are critical.',
      'Diversify income now. Side skills become main skills in downturns.',
      'Reduce debt aggressively — high interest payments compound crisis.',
      'Network actively. 80% of jobs come through connections.',
    ],
  },
  {
    id: 'forced-relocation',
    name: 'Forced Relocation',
    icon: Truck,
    color: '#14b8a6',
    severity: 'medium',
    description: 'Having to leave your home due to disaster, eviction, or conflict.',
    impacts: {
      supplies:  { weight: 0.25, reason: 'Go-bag, vital documents, portable essentials' },
      network:   { weight: 0.25, reason: 'Where to go, who can help, out-of-area contacts' },
      financial: { weight: 0.25, reason: 'Emergency funds, insurance, portable savings' },
      digital:   { weight: 0.15, reason: 'Cloud backups of everything, account access from anywhere' },
      health:    { weight: 0.05, reason: 'Medications, medical records portability' },
      skills:    { weight: 0.05, reason: 'Adaptability, navigation' },
    },
    criticalItems: ['sup-12', 'sup-13', 'net-04', 'net-08', 'net-09', 'fin-03', 'fin-13', 'dig-05', 'hlt-01'],
    tips: [
      'Your go-bag should be ready at all times — not something you pack during a crisis.',
      'Keep documents in cloud AND physical waterproof container.',
      'Have a pre-arranged place to go. Don\'t figure this out during the event.',
      'Emergency cash — small bills. Your cards might not work.',
    ],
  },
];

export default SCENARIOS;

/** Calculate scenario readiness from pre-computed domain scores */
export function calcScenarioScore(scenario, domainScores) {
  let totalScore = 0;
  for (const [domainId, impact] of Object.entries(scenario.impacts)) {
    if (impact.weight > 0) {
      totalScore += (domainScores[domainId] || 0) * impact.weight;
    }
  }
  return Math.round(totalScore);
}
