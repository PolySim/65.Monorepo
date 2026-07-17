"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { Button } from "../ui/button";

const Logout = () => {
  return (
    <SignOutButton>
      <Button variant="ghost">
        <LogOut aria-hidden="true" />
        Déconnexion
      </Button>
    </SignOutButton>
  );
};

export default Logout;
