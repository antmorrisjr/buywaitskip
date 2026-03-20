import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BuyWaitSkip - Real Gamers. Real Verdicts. BUY, WAIT, or SKIP?",
  description: "Creator-only verdicts on every major game. Never waste $70 again.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "BuyWaitSkip - Real Gamers. Real Verdicts.",
    description: "Creator-only verdicts on every major game. Never waste $70 again.",
    url: "https://www.buywaitskip.com",
    siteName: "BuyWaitSkip",
    images: [
      {
        url: "https://www.buywaitskip.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={oswald.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
