import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGreen Contact Portal",
  description: "Send contact messages securely and reliably.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
