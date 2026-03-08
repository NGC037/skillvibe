import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkillVibe",
  description: "Skill-based participation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-100 text-neutral-900 min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}