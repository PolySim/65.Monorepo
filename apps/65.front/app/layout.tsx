import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/lib/react-query";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "65 Passion Montagne",
    template: "%s | 65 Passion Montagne",
  },
  description:
    "Explorez les randonnées, refuges et activités des Hautes-Pyrénées.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <ReactQueryProvider>
          <a href="#contenu-principal" className="skip-link">
            Aller au contenu
          </a>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
