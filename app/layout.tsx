import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venture Signal",
  description: "Evidence-gated business idea evaluation for capital-conscious founders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
