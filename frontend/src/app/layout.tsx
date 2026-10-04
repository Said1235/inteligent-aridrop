import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Allocyn — evidence judged by independent validators",
  description:
    "Submit evidence that you completed a task. Independent AI validators on GenLayer decide whether it satisfies every published requirement, and the verdict is recorded on chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
