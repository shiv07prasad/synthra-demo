import { clamp, mulberry32, normal, pick, weighted, type Rng } from "../lib/random.ts";
import { REAL_TEMPLATES, SLOT_AMOUNTS } from "./templates.ts";
import { REGIONAL_LANGUAGE, type Channel, type Language, type ScamRecord, type ScamType, type State } from "./schema.ts";

// Fictional records. Distributions are shaped so the agents have real structure to find:
// a bimodal age, a heavy-tailed loss amount, a rare channel, a state→language dependency,
// an age→call-duration link, and a "golden hour" effect on recovery.

export const FIRST_NAMES = [
  "Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Lakshmi", "Arjun", "Meera", "Suresh", "Kavya",
  "Rahul", "Divya", "Manoj", "Sneha", "Ganesh", "Pooja", "Ravi", "Shalini", "Imran", "Fatima",
  "Harish", "Nandini", "Kiran", "Bhavna", "Sanjay", "Revathi", "Amit", "Deepa", "Mohan", "Sunita",
  "Prakash", "Geeta", "Vijay", "Asha", "Rajesh", "Usha", "Naveen", "Swati", "Gopal", "Kamala",
];
export const LAST_NAMES = [
  "Sharma", "Iyer", "Patil", "Reddy", "Nair", "Banerjee", "Gupta", "Kulkarni", "Menon", "Das",
  "Verma", "Pillai", "Shah", "Rao", "Joshi", "Chatterjee", "Khan", "Desai", "Naidu", "Mishra",
  "Krishnan", "Ghosh", "Yadav", "Hegde", "Mehta", "Bose", "Pandey", "Shetty", "Mukherjee", "Singh",
];

export const STATE_WEIGHTS: Record<State, number> = {
  Maharashtra: 16, "Uttar Pradesh": 15, Karnataka: 13, Delhi: 12, "Tamil Nadu": 11,
  Telangana: 10, "West Bengal": 9, Gujarat: 8, Kerala: 6,
};

export const SCAM_WEIGHTS: Record<ScamType, number> = {
  "UPI Collect": 24, "KYC Update": 20, "Task Job": 18, Investment: 14, "Digital Arrest": 12, Lottery: 12,
};

const CHANNEL_GIVEN_SCAM: Record<ScamType, Partial<Record<Channel, number>>> = {
  "Digital Arrest": { "Phone Call": 55, WhatsApp: 43, Telegram: 2 },
  "KYC Update": { SMS: 62, "Phone Call": 25, WhatsApp: 13 },
  "UPI Collect": { "Phone Call": 50, WhatsApp: 38, SMS: 12 },
  "Task Job": { WhatsApp: 78, Telegram: 14, SMS: 8 },
  Investment: { WhatsApp: 80, Telegram: 10, "Phone Call": 10 },
  Lottery: { SMS: 50, WhatsApp: 38, "Phone Call": 12 },
};

// Median loss and log-spread per scam type.
const AMOUNT_GIVEN_SCAM: Record<ScamType, [median: number, sigma: number]> = {
  "Digital Arrest": [320000, 1.15],
  Investment: [180000, 1.2],
  "Task Job": [45000, 0.9],
  "KYC Update": [28000, 0.85],
  "UPI Collect": [9000, 0.8],
  Lottery: [22000, 0.8],
};

const CALL_BASE: Record<ScamType, number> = {
  "Digital Arrest": 45, Investment: 20, "Task Job": 14, "KYC Update": 8, "UPI Collect": 6, Lottery: 5,
};

export function languageForState(rng: Rng, state: State): Language {
  const regional = REGIONAL_LANGUAGE[state];
  if (!regional) return rng() < 0.65 ? "Hindi" : "English";
  return weighted<Language>(rng, { [regional]: 45, Hindi: 30, English: 25 });
}

export function fakePhone(rng: Rng): string {
  const d = () => Math.floor(rng() * 10);
  const first = pick(rng, [6, 7, 8, 9]);
  return `+91 ${first}${d()}${d()}${d()}${d()} ${d()}${d()}${d()}${d()}${d()}`;
}

export function fillTemplate(rng: Rng, text: string): string {
  return text.replace("{amt}", pick(rng, SLOT_AMOUNTS));
}

export const recoveryProbability = (hours: number) => 1 / (1 + Math.exp(-(0.4 - 0.85 * Math.log(hours))));

export function generateRealDataset(n = 240, seed = 20261005): ScamRecord[] {
  const rng = mulberry32(seed);
  const rows: ScamRecord[] = [];

  for (let i = 0; i < n; i++) {
    const scam = weighted(rng, SCAM_WEIGHTS);
    const state = weighted(rng, STATE_WEIGHTS);
    const age = Math.round(clamp(rng() < 0.82 ? normal(rng, 29, 7) : normal(rng, 67, 6), 18, 88));
    const [median, sigma] = AMOUNT_GIVEN_SCAM[scam];
    const amount = Math.max(500, Math.round(Math.exp(normal(rng, Math.log(median), sigma)) / 100) * 100);
    const hours = Math.round(clamp(Math.exp(normal(rng, Math.log(14), 1.3)), 0.3, 720) * 10) / 10;
    const call = Math.max(1, Math.round(CALL_BASE[scam] + 0.6 * age + normal(rng, 0, 6)));
    const template = pick(rng, REAL_TEMPLATES[scam]);

    rows.push({
      victim_name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      phone_number: fakePhone(rng),
      victim_age: age,
      state,
      language: languageForState(rng, state),
      scam_type: scam,
      channel: weighted(rng, CHANNEL_GIVEN_SCAM[scam]),
      amount_lost_inr: amount,
      call_duration_min: call,
      hours_to_report: hours,
      funds_recovered: rng() < recoveryProbability(hours),
      scam_message_snippet: fillTemplate(rng, template.text),
    });
  }
  return rows;
}
