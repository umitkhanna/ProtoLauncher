import { ImageResponse } from "next/og";

export const alt = "ProtoLauncher — AI-native startup studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(145deg, #09090b 0%, #18181b 45%, #2e1064 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#c4b5fd",
            }}
          >
            PL
          </div>
          <span style={{ fontSize: 28, fontWeight: 600 }}>ProtoLauncher</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 600,
              lineHeight: 1.1,
              maxWidth: 900,
              letterSpacing: -0.02,
            }}
          >
            Launch AI-powered products faster.
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 24,
              color: "rgba(244,244,245,0.72)",
              maxWidth: 820,
              lineHeight: 1.4,
            }}
          >
            AI-native startup studio helping founders build and launch MVPs
            quickly.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
