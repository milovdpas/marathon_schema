import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// The social preview card. Next reuses this for Twitter too, so there is no
// separate twitter-image.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;

/**
 * Rendered with Satori, which supports a deliberate subset of CSS: no external
 * fonts or images (the CSP would block them anyway), and every element with
 * more than one child needs an explicit `display: flex`.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#f1472c",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 64 64">
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
          <div style={{ fontSize: 40, fontWeight: 600 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Two rows rather than a <br>: Satori counts the break as a second
              child and refuses any element with more than one that isn't
              explicitly a flex container. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            <div>Plan your race.</div>
            <div>Track every kilometre.</div>
          </div>
          <div style={{ fontSize: 32, color: "#a1a1aa" }}>
            Marathon · Ultra · Backyard · Trail. Free, no account.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
