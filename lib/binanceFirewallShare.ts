import { FirewallStatus } from "@/lib/binanceFirewall";

export interface BinanceFirewallShareSignal {
  symbol: string;
  change24hPct: number;
  spreadBps: number;
  intradayRangePct: number;
}

export interface BinanceFirewallShareDimension {
  label: string;
  score: number;
}

export interface BinanceFirewallSharePayload {
  status: FirewallStatus;
  safetyScore: number;
  verdict: string;
  summary: string;
  primaryFinding: string;
  primaryGuardrail: string;
  symbols: BinanceFirewallShareSignal[];
  dimensions: BinanceFirewallShareDimension[];
  generatedAt: string;
}

export function serializeBinanceFirewallSharePayload(
  payload: BinanceFirewallSharePayload,
) {
  return JSON.stringify(payload);
}

export function parseBinanceFirewallSharePayload(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as BinanceFirewallSharePayload;
  } catch {
    return null;
  }
}

export function getBinanceFirewallShareScene(
  status: FirewallStatus,
  score: number,
) {
  if (status === "PASS" && score >= 82) {
    return {
      label: "Cleared For Probation",
      title: "Guardrails Intact",
      caption: "This agent can touch Binance only with the fences still on.",
      accent: "#6ee7b7",
      accentSoft: "rgba(110, 231, 183, 0.14)",
      accentText: "#d1fae5",
      gradient:
        "linear-gradient(180deg, #0a1714 0%, #0b1112 48%, #09090b 100%)",
    };
  }

  if (status === "WARN") {
    return {
      label: "Needs Supervision",
      title: "Do Not Hand Over The Keys",
      caption: "Useful strategy. Unsafe operator. Tighten the fence first.",
      accent: "#fbbf24",
      accentSoft: "rgba(251, 191, 36, 0.14)",
      accentText: "#fde68a",
      gradient:
        "linear-gradient(180deg, #241806 0%, #12100b 52%, #09090b 100%)",
    };
  }

  return {
    label: "Blocked By Firewall",
    title: "This Was An Incident Waiting To Happen",
    caption:
      "A trading agent is not allowed to improvise with real account power.",
    accent: "#fb7185",
    accentSoft: "rgba(251, 113, 133, 0.14)",
    accentText: "#fecdd3",
    gradient: "linear-gradient(180deg, #25060b 0%, #130d10 52%, #09090b 100%)",
  };
}
