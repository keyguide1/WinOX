import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WinOX",
    short_name: "WinOX",
    description: "Competitive gaming, reimagined.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a0f",
    theme_color: "#080a0f",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
