import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 15% 0%, rgba(244,198,106,0.24), transparent 24%), radial-gradient(circle at 85% 15%, rgba(90,206,186,0.20), transparent 24%), linear-gradient(180deg, #0f1216 0%, #07090d 38%, #06070a 100%)",
          color: "#f6edd8",
          padding: "56px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            color: "#f7d58b",
          }}
        >
          <span>Today&apos;s Orders</span>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#f7d58b",
            }}
          />
          <span>OpenClaw x OKX OnchainOS</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>
            今日军令
          </div>
          <div style={{ fontSize: 42, color: "#d8c7a4" }}>Today&apos;s Orders</div>
          <div
            style={{
              maxWidth: 980,
              fontSize: 30,
              lineHeight: 1.5,
              color: "#d7c8ab",
            }}
          >
            不给你十条链上建议，只批准今天最值得执行的一条命令。
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 24,
            color: "#8de6d3",
          }}
        >
          <span>军情</span>
          <span>军令</span>
          <span>禁令</span>
          <span>推演</span>
          <span>战报</span>
        </div>
      </div>
    ),
    size,
  );
}
