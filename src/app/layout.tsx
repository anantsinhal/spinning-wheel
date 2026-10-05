import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spin & Win | Value Plus",
  description: "Spin the Value Plus wheel for exciting rewards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
