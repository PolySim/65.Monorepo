import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import { AUTH_ACCOUNT_HEADER } from "@/config/config";
import { ReactQueryProvider } from "@/lib/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accountId = (await headers()).get(AUTH_ACCOUNT_HEADER);
  if (!accountId) redirect("/auth/signIn");

  // Leaving the dashboard (sign-out) or changing accounts replaces the client.
  // Late query/mutation results can only write to the previous client's cache.
  return (
    <ReactQueryProvider key={accountId}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="contenu-principal" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
      </div>
    </ReactQueryProvider>
  );
}
