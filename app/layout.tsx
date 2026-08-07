import "./global.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { NextAuthProvider } from "@/components/auth/NextAuthProvider";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DA Progress Tracker",
  description: "Track and manage teen group activities",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
