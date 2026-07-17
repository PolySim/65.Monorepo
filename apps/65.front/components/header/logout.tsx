"use client";

import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "../ui/button";

const Logout = ({ className }: { className?: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const signOut = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.replace("/auth/signIn");
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      disabled={isPending}
      onClick={signOut}
    >
      <LogOut aria-hidden="true" />
      {isPending ? "Déconnexion…" : "Déconnexion"}
    </Button>
  );
};

export default Logout;
