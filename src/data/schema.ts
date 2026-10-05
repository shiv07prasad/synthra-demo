export const SCAM_TYPES = ["UPI Collect", "KYC Update", "Task Job", "Investment", "Digital Arrest", "Lottery"] as const;
export const CHANNELS = ["Phone Call", "WhatsApp", "SMS", "Telegram"] as const;
export const STATES = [
  "Maharashtra",
  "Uttar Pradesh",
  "Karnataka",
  "Delhi",
  "Tamil Nadu",
  "Telangana",
  "West Bengal",
  "Gujarat",
  "Kerala",
] as const;
export const LANGUAGES = [
  "Hindi",
  "English",
  "Marathi",
  "Tamil",
  "Kannada",
  "Bengali",
  "Telugu",
  "Malayalam",
  "Gujarati",
] as const;

export type ScamType = (typeof SCAM_TYPES)[number];
export type Channel = (typeof CHANNELS)[number];
export type State = (typeof STATES)[number];
export type Language = (typeof LANGUAGES)[number];

export const REGIONAL_LANGUAGE: Partial<Record<State, Language>> = {
  Maharashtra: "Marathi",
  "Tamil Nadu": "Tamil",
  Karnataka: "Kannada",
  "West Bengal": "Bengali",
  Telangana: "Telugu",
  Kerala: "Malayalam",
  Gujarat: "Gujarati",
};

export interface ScamRecord {
  victim_name: string;
  phone_number: string;
  victim_age: number;
  state: State;
  language: Language;
  scam_type: ScamType;
  channel: Channel;
  amount_lost_inr: number;
  call_duration_min: number;
  hours_to_report: number;
  funds_recovered: boolean;
  scam_message_snippet: string;
}

export type ColumnKind = "PII" | "NUM" | "CAT" | "BOOL" | "TEXT";

export const NUMERIC_COLS = ["victim_age", "amount_lost_inr", "hours_to_report", "call_duration_min"] as const;
export const CATEGORICAL_COLS = ["scam_type", "channel", "state", "language"] as const;
export type NumericCol = (typeof NUMERIC_COLS)[number];
export type CategoricalCol = (typeof CATEGORICAL_COLS)[number];

export const COLUMNS: { key: keyof ScamRecord; kind: ColumnKind }[] = [
  { key: "victim_name", kind: "PII" },
  { key: "phone_number", kind: "PII" },
  { key: "victim_age", kind: "NUM" },
  { key: "state", kind: "CAT" },
  { key: "language", kind: "CAT" },
  { key: "scam_type", kind: "CAT" },
  { key: "channel", kind: "CAT" },
  { key: "amount_lost_inr", kind: "NUM" },
  { key: "call_duration_min", kind: "NUM" },
  { key: "hours_to_report", kind: "NUM" },
  { key: "funds_recovered", kind: "BOOL" },
  { key: "scam_message_snippet", kind: "TEXT" },
];

export const isCohort = (r: Pick<ScamRecord, "victim_age" | "language">) =>
  r.victim_age >= 65 && r.language !== "Hindi" && r.language !== "English";

export function formatInr(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(v >= 1000000 ? 1 : 2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
}
