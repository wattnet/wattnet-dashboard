import type { Metadata } from "next";
import { Red_Hat_Text, Red_Hat_Display } from "next/font/google";
import { Providers } from "../core/providers/providers";
import "./globals.css";

const redHatText = Red_Hat_Text({
  variable: "--font-red-hat-text",
  subsets: ["latin"],
});

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard - wattnet.eu",
  description:
    "Interactive dashboard to explore electricity-related CO₂ emissions, water footprint, and sustainability metrics across Europe.",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${redHatText.variable} ${redHatDisplay.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var params = new URLSearchParams(window.location.search);
                  var urlTheme = params.get('theme');
                  var valid = ['dark', 'light', 'colorblind'];
                  var theme = (urlTheme && valid.indexOf(urlTheme) !== -1)
                    ? urlTheme
                    : (localStorage.getItem('app-theme') || 'dark');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
