import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpendMapr",
  description: "Personal finance dashboard for tracking spending, debt, and savings goals."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
