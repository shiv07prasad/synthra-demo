import {
  ChartColumn,
  Grid3x3,
  MessageSquareText,
  ScanFace,
  SearchCheck,
  Shapes,
  Sparkles,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { AgentId } from "../../theatre/timeline";

export const AGENTS: Record<AgentId, { name: string; short: string; role: string; icon: LucideIcon; color: string }> = {
  orchestrator: { name: "Orchestrator", short: "orchestr", role: "plans & dispatches", icon: Workflow, color: "#a3a3a3" },
  numeric: { name: "Numeric Agent", short: "numeric", role: "4 numeric columns", icon: ChartColumn, color: "#60a5fa" },
  categorical: { name: "Categorical Agent", short: "category", role: "4 categorical columns", icon: Shapes, color: "#a78bfa" },
  correlation: { name: "Correlation Agent", short: "correl", role: "cross-column links", icon: Grid3x3, color: "#2dd4bf" },
  text: { name: "Text Agent", short: "text", role: "scam_message_snippet", icon: MessageSquareText, color: "#fbbf24" },
  pii: { name: "PII Guard", short: "pii", role: "name · phone", icon: ScanFace, color: "#fb7185" },
  cohort: { name: "Cohort Agent", short: "cohort", role: "fairness · rare groups", icon: UsersRound, color: "#4ade80" },
  synth: { name: "Synthesizer", short: "synth", role: "profiles → rows", icon: Sparkles, color: "#818cf8" },
  critic: { name: "Critic", short: "critic", role: "audits the twin", icon: SearchCheck, color: "#fb923c" },
};

export const DISPATCH_ORDER: AgentId[] = ["pii", "numeric", "categorical", "correlation", "text", "cohort", "synth", "critic"];
