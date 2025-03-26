import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Greenify",
  description: "AI-Powered Waste Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
