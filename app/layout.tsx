import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NSES - NUML Software Engineering Society",
  description: "Official portal of the NUML Software Engineering Society (NSES).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text-primary antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
