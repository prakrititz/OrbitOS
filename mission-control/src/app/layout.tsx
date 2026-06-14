import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AuthProvider from "@/components/SessionProvider";
import { RelayProvider } from "@/lib/RelayContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "Orbit OS - Control Room",
  description: "Autonomous DevSecOps platform dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <AuthProvider>
          <RelayProvider>
            {children}
          </RelayProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
