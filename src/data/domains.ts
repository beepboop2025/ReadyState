import {
  DollarSign, Package, Shield, Heart, Wrench, Users,
} from 'lucide-react';
import type { Domain, FlatItem, ActionItem } from '../types';

const DOMAINS: Domain[] = [
  {
    id: 'financial',
    name: 'Financial',
    icon: DollarSign,
    color: '#10b981',
    colorLight: '#d1fae5',
    colorBg: 'rgba(16,185,129,0.10)',
    description: 'Emergency funds, insurance, debt management, and income resilience.',
    categories: [
      {
        name: 'Emergency Savings',
        items: [
          { id: 'fin-01', text: 'Emergency fund covers 1 month of expenses', weight: 2, tips: 'Start here — even one month provides a critical buffer against unexpected costs.' },
          { id: 'fin-02', text: 'Emergency fund covers 3+ months of expenses', weight: 3, tips: 'The gold standard. Covers job loss, medical emergencies, and major repairs.' },
          { id: 'fin-03', text: 'Emergency cash at home ($200–500)', weight: 2, tips: 'ATMs and cards fail during power outages. Keep small bills in a secure location.' },
        ],
      },
      {
        name: 'Insurance',
        items: [
          { id: 'fin-04', text: 'Health insurance is active and covers major events', weight: 3, tips: 'One hospital stay without insurance can cause financial ruin.' },
          { id: 'fin-05', text: 'Renter\'s or homeowner\'s insurance is current', weight: 2, tips: 'Covers fire, theft, liability. Often under $20/month for renters.' },
          { id: 'fin-06', text: 'Auto / transportation insurance is current', weight: 2, tips: 'Required by law in most places and protects against major liability.' },
          { id: 'fin-07', text: 'Life insurance or income protection (if dependents)', weight: 2, tips: 'Critical if anyone depends on your income. Term life is affordable.' },
        ],
      },
      {
        name: 'Debt & Income',
        items: [
          { id: 'fin-08', text: 'Debt-to-income ratio is below 40%', weight: 2, tips: 'High debt amplifies every crisis. Prioritize high-interest debt first.' },
          { id: 'fin-09', text: 'Have at least one secondary income source or skill', weight: 2, tips: 'Freelancing, tutoring, side projects — any backup income stream helps.' },
          { id: 'fin-10', text: 'Essential bills can be paid for 2+ months if income stops', weight: 3, tips: 'Know your bare-minimum monthly costs and ensure coverage.' },
        ],
      },
      {
        name: 'Estate & Documents',
        items: [
          { id: 'fin-11', text: 'Will or testament is written and accessible', weight: 1, tips: 'Especially important if you have dependents or significant assets.' },
          { id: 'fin-12', text: 'Beneficiaries are updated on all financial accounts', weight: 1, tips: 'Check bank accounts, retirement funds, and insurance policies annually.' },
          { id: 'fin-13', text: 'Important financial documents are stored securely (digital + physical)', weight: 2, tips: 'Tax returns, deeds, contracts — keep copies in fireproof safe and cloud.' },
        ],
      },
    ],
  },
  {
    id: 'supplies',
    name: 'Supplies',
    icon: Package,
    color: '#f59e0b',
    colorLight: '#fef3c7',
    colorBg: 'rgba(245,158,11,0.10)',
    description: 'Food, water, medical supplies, tools, and essential documents.',
    categories: [
      {
        name: 'Water & Food',
        items: [
          { id: 'sup-01', text: 'At least 3 days of drinking water stored (1 gal/person/day)', weight: 3, tips: 'FEMA recommends minimum 3 days. Use food-grade containers, rotate every 6 months.' },
          { id: 'sup-02', text: 'Non-perishable food for 3+ days (canned, dried, energy bars)', weight: 3, tips: 'Include a manual can opener. Choose foods your family actually eats.' },
          { id: 'sup-03', text: 'Water purification method available (filter, tablets, or boiling kit)', weight: 2, tips: 'Backup for when stored water runs out. LifeStraw or purification tablets are compact.' },
          { id: 'sup-04', text: '7+ days of food and water stored', weight: 2, tips: 'Extended outages happen. Hurricane Katrina, Texas freeze — be ready for the long haul.' },
        ],
      },
      {
        name: 'Medical & First Aid',
        items: [
          { id: 'sup-05', text: 'Well-stocked first aid kit (bandages, antiseptic, pain relief, etc.)', weight: 3, tips: 'Pre-made kits are fine. Add personal medications and check expiry dates quarterly.' },
          { id: 'sup-06', text: '30-day supply of prescription medications', weight: 3, tips: 'Ask your doctor for a 90-day supply. Keep a written list of all medications.' },
          { id: 'sup-07', text: 'Basic OTC medications (pain, allergy, anti-diarrheal, cold)', weight: 2, tips: 'Pharmacies may close during emergencies. Stock the basics.' },
        ],
      },
      {
        name: 'Tools & Power',
        items: [
          { id: 'sup-08', text: 'Flashlight with extra batteries (or hand-crank)', weight: 2, tips: 'LED flashlights last longer. Keep one in each major room.' },
          { id: 'sup-09', text: 'Battery bank / portable charger for phone', weight: 2, tips: 'Your phone is your lifeline. Keep a charged 20,000mAh bank ready.' },
          { id: 'sup-10', text: 'Basic tool kit (screwdriver, pliers, tape, knife)', weight: 1, tips: 'For emergency repairs. Multi-tools are compact and versatile.' },
          { id: 'sup-11', text: 'Fire extinguisher (inspected, not expired)', weight: 2, tips: 'ABC-rated extinguisher covers most home fires. Check the gauge monthly.' },
        ],
      },
      {
        name: 'Documents & Go-Bag',
        items: [
          { id: 'sup-12', text: 'Copies of vital documents in waterproof container (ID, passport, insurance)', weight: 2, tips: 'Include birth certificates, insurance cards, property deeds. Both paper and digital copies.' },
          { id: 'sup-13', text: 'Go-bag packed and ready (72-hour bag)', weight: 2, tips: 'Clothes, water, snacks, first aid, documents, cash, phone charger. One per person.' },
          { id: 'sup-14', text: 'Pet supplies included in emergency plan (if applicable)', weight: 1, tips: 'Food, water, medications, carrier, vet records. Shelters may not accept pets.' },
        ],
      },
    ],
  },
  {
    id: 'digital',
    name: 'Digital',
    icon: Shield,
    color: '#3b82f6',
    colorLight: '#dbeafe',
    colorBg: 'rgba(59,130,246,0.10)',
    description: 'Data backups, passwords, 2FA, account recovery, and digital security.',
    categories: [
      {
        name: 'Passwords & Access',
        items: [
          { id: 'dig-01', text: 'Using a password manager for all accounts', weight: 3, tips: 'Bitwarden (free), 1Password, or LastPass. One master password, unique passwords everywhere.' },
          { id: 'dig-02', text: 'All critical accounts have unique, strong passwords', weight: 3, tips: 'Email, banking, social media. If one is breached, others stay safe.' },
          { id: 'dig-03', text: '2FA enabled on email, banking, and social media', weight: 3, tips: 'Use an authenticator app (not SMS). Google Authenticator or Authy.' },
          { id: 'dig-04', text: 'Recovery codes for 2FA stored securely offline', weight: 2, tips: 'Print them. If you lose your phone, these are your only way back in.' },
        ],
      },
      {
        name: 'Backups',
        items: [
          { id: 'dig-05', text: 'Important files backed up to cloud storage', weight: 3, tips: 'Google Drive, iCloud, Dropbox. Automate it so you don\'t forget.' },
          { id: 'dig-06', text: 'Local backup exists (external drive or NAS)', weight: 2, tips: 'Cloud can fail. The 3-2-1 rule: 3 copies, 2 media types, 1 offsite.' },
          { id: 'dig-07', text: 'Phone photos and contacts are automatically backed up', weight: 2, tips: 'Enable auto-backup in Google Photos or iCloud. Losing memories is permanent.' },
          { id: 'dig-08', text: 'Backup tested — you know you can restore from it', weight: 2, tips: 'An untested backup is not a backup. Try restoring one file to verify.' },
        ],
      },
      {
        name: 'Account Security',
        items: [
          { id: 'dig-09', text: 'Email account has recovery email and phone number set', weight: 2, tips: 'Your email is the key to everything. Losing access = losing all accounts.' },
          { id: 'dig-10', text: 'Know which accounts are linked to which email', weight: 1, tips: 'Make a list. You probably have 50+ accounts you\'ve forgotten about.' },
          { id: 'dig-11', text: 'Digital legacy / account handover plan exists', weight: 1, tips: 'Google Inactive Account Manager, Apple Legacy Contact. Plan for the worst.' },
          { id: 'dig-12', text: 'Devices are encrypted (FileVault, BitLocker, or equivalent)', weight: 2, tips: 'If your laptop is stolen, encryption prevents data theft. Usually just a settings toggle.' },
        ],
      },
    ],
  },
  {
    id: 'health',
    name: 'Health',
    icon: Heart,
    color: '#f43f5e',
    colorLight: '#ffe4e6',
    colorBg: 'rgba(244,63,94,0.10)',
    description: 'Medical records, fitness baseline, mental health, and health awareness.',
    categories: [
      {
        name: 'Medical Records',
        items: [
          { id: 'hlt-01', text: 'Complete list of current medications and dosages', weight: 3, tips: 'Carry a card in your wallet. Paramedics need this information fast.' },
          { id: 'hlt-02', text: 'Known allergies documented (medications, food, environmental)', weight: 3, tips: 'Include severity. Anaphylaxis risk should be on a medical alert bracelet.' },
          { id: 'hlt-03', text: 'Blood type is known and documented', weight: 1, tips: 'Ask your doctor or get a simple test. Critical for emergency transfusions.' },
          { id: 'hlt-04', text: 'Vaccination records are up to date and accessible', weight: 2, tips: 'Tetanus (every 10 years), flu (yearly), COVID boosters, travel vaccines.' },
          { id: 'hlt-05', text: 'Regular health checkup within the last 12 months', weight: 2, tips: 'Prevention catches problems early. Annual physicals save lives and money.' },
        ],
      },
      {
        name: 'Physical Readiness',
        items: [
          { id: 'hlt-06', text: 'Can walk/jog 1+ mile without stopping', weight: 2, tips: 'Basic cardiovascular fitness. Evacuation may require sustained movement.' },
          { id: 'hlt-07', text: 'Maintain a regular exercise routine (3+ times/week)', weight: 2, tips: 'Physical resilience is foundational. Even 20-minute walks count.' },
          { id: 'hlt-08', text: 'No chronic conditions are unmanaged', weight: 3, tips: 'Diabetes, hypertension, asthma — all need active management plans.' },
        ],
      },
      {
        name: 'Mental & Emotional',
        items: [
          { id: 'hlt-09', text: 'Have a stress management practice (meditation, journaling, therapy)', weight: 2, tips: 'Crisis amplifies stress. Build coping mechanisms before you need them.' },
          { id: 'hlt-10', text: 'Know signs of mental health crisis and where to get help', weight: 2, tips: '988 Suicide & Crisis Lifeline. NAMI helpline: 1-800-950-6264.' },
          { id: 'hlt-11', text: 'Sleep quality is generally good (6-8 hours consistently)', weight: 1, tips: 'Sleep deprivation degrades decision-making — exactly when you need it most.' },
        ],
      },
    ],
  },
  {
    id: 'skills',
    name: 'Skills',
    icon: Wrench,
    color: '#8b5cf6',
    colorLight: '#ede9fe',
    colorBg: 'rgba(139,92,246,0.10)',
    description: 'First aid, basic repairs, navigation, communication, and adaptability.',
    categories: [
      {
        name: 'Emergency Skills',
        items: [
          { id: 'skl-01', text: 'Know basic first aid (wound care, burns, choking)', weight: 3, tips: 'Red Cross offers free online courses. Could save a life — including your own.' },
          { id: 'skl-02', text: 'Know CPR (even if certification has lapsed)', weight: 3, tips: 'Hands-only CPR is effective. Push hard, push fast, center of chest.' },
          { id: 'skl-03', text: 'Can use a fire extinguisher (PASS technique)', weight: 2, tips: 'Pull, Aim, Squeeze, Sweep. Practice mentally — you won\'t have time to read instructions.' },
          { id: 'skl-04', text: 'Know how to shut off home utilities (water, gas, electricity)', weight: 2, tips: 'Locate shutoffs NOW. Gas leaks and water main breaks happen in disasters.' },
        ],
      },
      {
        name: 'Self-Sufficiency',
        items: [
          { id: 'skl-05', text: 'Can cook basic meals from non-perishable ingredients', weight: 2, tips: 'Rice, beans, canned goods. Practice making meals without fresh ingredients.' },
          { id: 'skl-06', text: 'Can perform basic home repairs (fix a leak, unclog drain)', weight: 1, tips: 'YouTube is your friend — but learn BEFORE the emergency.' },
          { id: 'skl-07', text: 'Can navigate without GPS (map reading, compass basics)', weight: 1, tips: 'Phone batteries die. Keep a physical map of your area in your go-bag.' },
          { id: 'skl-08', text: 'Basic self-defense awareness', weight: 1, tips: 'Situational awareness is the #1 self-defense skill. Know your exits.' },
        ],
      },
      {
        name: 'Career Resilience',
        items: [
          { id: 'skl-09', text: 'Resume / portfolio is updated within the last 6 months', weight: 2, tips: 'Job loss can happen overnight. Being ready to apply reduces recovery time by weeks.' },
          { id: 'skl-10', text: 'Have skills that transfer across industries', weight: 2, tips: 'Communication, data analysis, project management — these survive AI disruption.' },
          { id: 'skl-11', text: 'Currently learning something new (course, certification, hobby)', weight: 1, tips: 'Adaptability is the ultimate resilience skill. Stay curious, stay employable.' },
          { id: 'skl-12', text: 'Understand basics of AI tools relevant to your field', weight: 2, tips: 'AI won\'t replace you — someone using AI will. Learn the tools in your domain.' },
        ],
      },
    ],
  },
  {
    id: 'network',
    name: 'Network',
    icon: Users,
    color: '#06b6d4',
    colorLight: '#cffafe',
    colorBg: 'rgba(6,182,212,0.10)',
    description: 'Emergency contacts, community ties, communication plans, and mutual aid.',
    categories: [
      {
        name: 'Emergency Contacts',
        items: [
          { id: 'net-01', text: 'ICE (In Case of Emergency) contacts saved in phone', weight: 3, tips: 'Add "ICE" prefix to names. Paramedics check for this. Include at least 2 people.' },
          { id: 'net-02', text: 'Emergency contacts know your medical conditions and allergies', weight: 2, tips: 'They may need to speak for you. Share your medical info with trusted people.' },
          { id: 'net-03', text: 'Contact list exists on paper (not just in phone)', weight: 2, tips: 'Phones die, break, or get lost. Keep a laminated card in your wallet.' },
          { id: 'net-04', text: 'Have a designated out-of-area contact for family check-in', weight: 2, tips: 'Local lines jam in disasters. An out-of-state contact can relay messages between family.' },
        ],
      },
      {
        name: 'Community',
        items: [
          { id: 'net-05', text: 'Know at least 3 neighbors by name', weight: 2, tips: 'Neighbors are your first responders. A simple introduction now could save you later.' },
          { id: 'net-06', text: 'Part of a local community group (HOA, church, volunteer org, etc.)', weight: 1, tips: 'Communities recover faster. Isolated individuals are the most vulnerable.' },
          { id: 'net-07', text: 'Know location of nearest hospital, fire station, and shelter', weight: 2, tips: 'GPS may not work. Know the routes by memory, including alternatives.' },
        ],
      },
      {
        name: 'Plans & Communication',
        items: [
          { id: 'net-08', text: 'Family/household emergency plan exists and is discussed', weight: 3, tips: 'Where to meet, who grabs what, evacuation routes. Practice it twice a year.' },
          { id: 'net-09', text: 'Meeting point designated in case of evacuation', weight: 2, tips: 'Two meeting points: one near home (e.g., mailbox) and one out-of-neighborhood.' },
          { id: 'net-10', text: 'Communication plan if phone/internet is down', weight: 2, tips: 'Radio (NOAA weather radio, walkie-talkies), physical note at meeting point.' },
          { id: 'net-11', text: 'Someone outside your household has a copy of your important documents', weight: 1, tips: 'Trusted family member or attorney. If your home is destroyed, they have backups.' },
        ],
      },
    ],
  },
];

export default DOMAINS;

/** Flatten all items across all domains */
export function getAllItems(): FlatItem[] {
  const items: FlatItem[] = [];
  for (const domain of DOMAINS) {
    for (const cat of domain.categories) {
      for (const item of cat.items) {
        items.push({ ...item, domainId: domain.id, category: cat.name });
      }
    }
  }
  return items;
}

/** Calculate score for a single domain given checked item IDs */
export function calcDomainScore(domain: Domain, checkedIds: Set<string>): number {
  let earned = 0;
  let total = 0;
  for (const cat of domain.categories) {
    for (const item of cat.items) {
      total += item.weight;
      if (checkedIds.has(item.id)) earned += item.weight;
    }
  }
  return total === 0 ? 0 : Math.round((earned / total) * 100);
}

/** Calculate overall score */
export function calcOverallScore(domains: Domain[], checkedIds: Set<string>): number {
  if (domains.length === 0) return 0;
  const scores = domains.map(d => calcDomainScore(d, checkedIds));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Get prioritized action items (highest weight unchecked items from weakest domains) */
export function getActionItems(domains: Domain[], checkedIds: Set<string>, limit = 8): ActionItem[] {
  const domainScores = domains.map(d => ({
    domain: d,
    score: calcDomainScore(d, checkedIds),
  }));
  domainScores.sort((a, b) => a.score - b.score);

  const actions: ActionItem[] = [];
  for (const { domain } of domainScores) {
    for (const cat of domain.categories) {
      for (const item of cat.items) {
        if (!checkedIds.has(item.id)) {
          actions.push({
            ...item,
            domainId: domain.id,
            domainName: domain.name,
            domainColor: domain.color,
            category: cat.name,
          });
        }
      }
    }
  }
  actions.sort((a, b) => b.weight - a.weight);
  return actions.slice(0, limit);
}
