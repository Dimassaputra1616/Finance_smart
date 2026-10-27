import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};
export const contentType = "image/png";

/**
 * PWA Icon generator dinamis beresolusi tinggi (192x192).
 *
 * Mengusung estetika perbendaharaan: Latar Pinus Imperial `#142d22`
 * dengan tipografi "Rp" emas sampanye `#e8c77b`.
 */
export default function Icon() {
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
          borderRadius: "44px",
          border: "4px solid #c49a45",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e8c77b",
            fontSize: "92px",
            fontWeight: 800,
            fontFamily: "monospace",
            letterSpacing: "-4px",
          }}
        >
          Rp
        </div>
      </div>
    ),
    { ...size },
  );
}
