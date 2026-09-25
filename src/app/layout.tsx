import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human–AI Dependency and Cognitive Resilience Survey",
  description: "A university research pilot questionnaire about generative AI use and independent confidence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
