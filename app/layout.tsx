import type { Metadata } from "next";
import { Red_Hat_Text, Red_Hat_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const redHatText = Red_Hat_Text({
  variable: "--font-red-hat-text",
  subsets: ["latin"],
});

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wattnet Dashboard",
  description:
    "Interactive dashboard for wattnet, visualizing energy generation, CO₂ emissions, and environmental footprint metrics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${redHatText.variable} ${redHatDisplay.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
