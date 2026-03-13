import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADD 드론쇼 시뮬레이션",
  description: "국방과학연구소 창조관 야간 드론쇼 시뮬레이션",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
