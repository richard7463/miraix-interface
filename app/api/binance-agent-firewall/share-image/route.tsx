import { ImageResponse } from "next/og";
import {
  getBinanceFirewallShareScene,
  parseBinanceFirewallSharePayload,
} from "@/lib/binanceFirewallShare";

export const runtime = "nodejs";

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = parseBinanceFirewallSharePayload(
    url.searchParams.get("payload"),
  );

  if (!payload) {
    return new Response("payload is required", { status: 400 });
  }

  const scene = getBinanceFirewallShareScene(
    payload.status,
    payload.safetyScore,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: scene.gradient,
          color: "#fff8eb",
          padding: "52px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 72,
            right: 80,
            width: 260,
            height: 260,
            borderRadius: 999,
            background: `${scene.accent}18`,
            border: `1px solid ${scene.accent}36`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 180,
            left: 42,
            width: 340,
            height: 340,
            borderRadius: 999,
            background: `${scene.accent}10`,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            borderRadius: 52,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            padding: 34,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  borderRadius: 18,
                  background: "#fcd34d",
                  color: "#111111",
                  padding: "8px 14px",
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  fontSize: 18,
                }}
              >
                MIRAIX
              </div>
              <div
                style={{
                  display: "flex",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.08)",
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#fef3c7",
                }}
              >
                Binance Agent Firewall
              </div>
            </div>

            <div
              style={{
                display: "flex",
                borderRadius: 999,
                border: `1px solid ${scene.accent}55`,
                background: scene.accentSoft,
                color: scene.accentText,
                padding: "8px 14px",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {scene.label}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: 650,
              }}
            >
              <div style={{ display: "flex", fontSize: 18, color: "#fde68a" }}>
                Prompt probation report
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  fontSize: 54,
                  fontWeight: 800,
                }}
              >
                {payload.verdict}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 12,
                  fontSize: 22,
                  color: "#f4e4b9",
                  lineHeight: 1.4,
                }}
              >
                {payload.summary}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                width: 180,
                height: 180,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(180deg, ${scene.accent} 0%, #fff 180%)`,
                color: "#111111",
                fontWeight: 900,
                fontSize: 88,
              }}
            >
              {Math.round(payload.safetyScore)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              marginTop: 24,
              borderRadius: 999,
              border: `1px solid ${scene.accent}66`,
              background: scene.accentSoft,
              color: scene.accentText,
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {scene.title}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 20,
              color: "#f5deb3",
            }}
          >
            {scene.caption}
          </div>

          <div style={{ display: "flex", gap: 18, marginTop: 26 }}>
            {payload.dimensions.map((dimension) => (
              <div
                key={dimension.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 216,
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.06)",
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 15,
                    color: "#f5deb3",
                    fontWeight: 700,
                  }}
                >
                  {dimension.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 10,
                    fontSize: 30,
                    fontWeight: 800,
                  }}
                >
                  {Math.round(dimension.score)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 24,
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(10,10,12,0.48)",
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#fff7ed",
                fontWeight: 700,
              }}
            >
              Why the firewall reacted
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 22,
                color: "#fecaca",
                lineHeight: 1.4,
              }}
            >
              {payload.primaryFinding}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 18,
                color: "#fff7ed",
                fontWeight: 700,
              }}
            >
              First guardrail to apply
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 22,
                color: "#bbf7d0",
                lineHeight: 1.4,
              }}
            >
              {payload.primaryGuardrail}
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, marginTop: 24 }}>
            {payload.symbols.map((signal) => (
              <div
                key={signal.symbol}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 286,
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.06)",
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", fontSize: 28, fontWeight: 800 }}>
                  {signal.symbol}
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 10,
                    fontSize: 18,
                    color: "#fde68a",
                  }}
                >
                  24h {signal.change24hPct >= 0 ? "+" : ""}
                  {percentFormatter.format(signal.change24hPct)}%
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 8,
                    fontSize: 16,
                    color: "#f5deb3",
                  }}
                >
                  Spread {percentFormatter.format(signal.spreadBps)} bps
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 6,
                    fontSize: 16,
                    color: "#f5deb3",
                  }}
                >
                  Intraday range{" "}
                  {percentFormatter.format(signal.intradayRangePct)}%
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 18,
              color: "#f5deb3",
              fontSize: 18,
            }}
          >
            <div style={{ display: "flex" }}>
              app.miraix.fun/binance-agent-firewall
            </div>
            <div style={{ display: "flex" }}>
              {payload.generatedAt.slice(0, 10)}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1600,
    },
  );
}
