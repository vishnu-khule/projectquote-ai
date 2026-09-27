import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectQuote AI",
  description: "AI-assisted proposals and estimates for trade professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
