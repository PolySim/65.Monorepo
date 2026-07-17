import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="contenu-principal" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
