import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Railtracker | Indian Railways Multi-Hop Pathfinding & 3D Station Visualizer",
  description: "Production-grade Indian Railways Multi-Hop Pathfinding, Live Train Tracking, and 3D Station Platform Visualization.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
