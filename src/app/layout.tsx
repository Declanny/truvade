import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { DevUserSwitcher } from "@/components/kyc";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TruVade - Verified Shortlet Stays",
  description: "Book verified shortlet apartments across Africa. Trusted stays with verified hosts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}>
        <AuthProvider>{children}<DevUserSwitcher /></AuthProvider>
      </body>
    </html>
  );
}
