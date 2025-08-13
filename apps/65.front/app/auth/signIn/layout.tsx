import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Connection | Angeline",
  description: "",
};

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-1 w-full px-4 lg:px-12 flex flex-col items-center justify-center">
      <div className="flex rounded-lg overflow-hidden items-center justify-center w-full max-w-7xl h-[min(90vh,720px)]">
        <div className="h-[100%] my-auto hidden lg:flex flex-col flex-1 relative">
          <Image
            src="/fond_ecran.png"
            alt="Login image"
            width={1920}
            height={1440}
            className="absolute top-0 left-0 z-0 object-cover w-full h-full"
          />
          <span className="absolute top-0 left-0 z-10 object-cover w-full h-full bg-black/10" />
        </div>
        <div className="flex flex-col justify-center gap-6 px-4 lg:px-12 bg-primary/20 w-[min(500px,100%)] h-[100%] min-h-[min(90vh,500px)] rounded-xl lg:rounded-none">
          {children}
        </div>
      </div>
    </div>
  );
}
