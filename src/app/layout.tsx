import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Greenify - Zero-to-Hero Waste Management",
  description: "Join our community in making waste management more efficient and rewarding!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <div className="mt-16">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
