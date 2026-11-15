import type { MetadataRoute } from "next";

// Installable web app: opens full-screen from the home screen, like a native app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FINN — what changed for your companies",
    short_name: "FINN",
    description: "What changed for your companies, and whether management kept its word. Primary sources only.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F7FB",
    theme_color: "#0B2545",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search a company", url: "/search" },
      { name: "Calendar", url: "/calendar" },
    ],
  };
}
