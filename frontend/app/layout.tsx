import type { Metadata, Viewport } from "next";
import "@genlayer/transaction-kit-react/styles.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Intelligent Airdrop — evidence-based eligibility",
  description:
    "Submit evidence of a completed task. A consensus of independent AI validators judges whether it genuinely satisfies the campaign's requirements — no single company decides.",
};

export const viewport: Viewport = {
  themeColor: "#b8752e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
