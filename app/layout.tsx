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
  description: "See what the gaming community says: BUY, WAIT, or SKIP.",
  icons: {
    icon: "/favicon.svg",
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
