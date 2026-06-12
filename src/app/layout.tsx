import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moderation Dashboard",
  description: "Trust & Safety review queue with role-based access and an audit log.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
