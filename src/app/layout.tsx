import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Cokethorpe Energy Dashboard",
  description: "Campus energy monitoring dashboard",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}