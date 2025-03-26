import type { Metadata } from "next";


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
    <html lang="en" className="vsc-initialized">
      <body>
        {children}
      </body>
    </html>
  );
}
