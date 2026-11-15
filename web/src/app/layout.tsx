import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

// IBM Plex: institutional, legible on small screens, and not the default AI-app font (04 doc §3).
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plexmono" });

export const metadata: Metadata = {
  title: "FINN",
  description: "What changed for your companies, and whether management kept its word. Primary sources only.",
  appleWebApp: { capable: true, title: "FINN", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F3EF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1012" },
  ],
};

// Apply the saved theme before first paint (no light flash for dark-mode users).
const themeScript = `try{var t=JSON.parse(localStorage.getItem('finn.settings')||'{}').theme;if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
