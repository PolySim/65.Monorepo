import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/lib/react-query";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "65 Passion Montagne",
    template: "%s | 65 Passion Montagne",
  },
  description: "65 Passion Montagne",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ReactQueryProvider>
        <html lang="fr">
          <body className="antialiased min-h-screen w-screen flex flex-col">
            {children}
          </body>
        </html>
        <Toaster richColors closeButton />
      </ReactQueryProvider>
    </ClerkProvider>
  );
}
