import { ImageResponse } from "next/og";

// iOS ignores manifest icons for "Add to Home Screen" and wants a PNG
// apple-touch-icon, so this renders one from the same artwork as icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          // iOS masks the corners itself, so this is a full-bleed square.
          background: "#f1472c",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="144" height="144" viewBox="0 0 64 64">
          <g
            fill="none"
            stroke="#fff"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M28 30 L36 25" />
            <path d="M36 25 L44 30 L47 38" />
            <path d="M36 25 L34 36" />
            <path d="M34 36 L41 44 L39 52" />
            <path d="M34 36 L25 41 L18 38" />
          </g>
          <circle cx="41" cy="15" r="6" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
