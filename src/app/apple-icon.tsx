import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

/**
 * Apple Touch Icon untuk Safari iOS (180x180).
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#142d22",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e8c77b",
            fontSize: "86px",
            fontWeight: 800,
            fontFamily: "monospace",
            letterSpacing: "-3px",
          }}
        >
          Rp
        </div>
      </div>
    ),
    { ...size },
  );
}
