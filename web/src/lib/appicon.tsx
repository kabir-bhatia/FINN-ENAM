// FINN app icon, drawn in code so there are no binary assets to keep in sync with the design:
// navy square (full bleed, safe for "maskable" crops), teal ring, white F.
import { ImageResponse } from "next/og";

export function appIcon(px: number) {
  const ring = Math.round(px * 0.62);
  const stroke = Math.max(3, Math.round(px * 0.075));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0B2545", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: ring,
            height: ring,
            borderRadius: ring,
            border: `${stroke}px solid #3DD6C6`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: Math.round(px * 0.34),
            fontWeight: 700,
          }}
        >
          F
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
