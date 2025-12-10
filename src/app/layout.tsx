import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminLayout } from "@/components/AdminLayout";
import { ModalProvider } from "@/context/ModalContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel - Eastmy Media",
  description: "Admin dashboard for Eastmy Media",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminLayout>
          <ModalProvider>
            {children}
          </ModalProvider>
        </AdminLayout>
      </body>
    </html>
  );
}
