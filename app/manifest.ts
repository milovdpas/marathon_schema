import type { MetadataRoute } from "next";

/**
 * Makes the tracker installable to a phone home screen, which matters for a
 * mobile-first app you open mid-training-block. `standalone` drops the browser
 * chrome so the bottom nav sits where a native tab bar would.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marathon Tracker",
    short_name: "Marathon",
    description: "Track your marathon training progress.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    // Matches --brand in globals.css and the viewport themeColor in layout.tsx.
    theme_color: "#f1472c",
    // Dark, because the app defaults to the system theme and a white flash on
    // launch is the more jarring of the two.
    background_color: "#0a0a0a",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
