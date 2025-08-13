"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "../ui/button";

const Logout = () => {
  return (
    <Button variant="outline" asChild>
      <SignOutButton>Déconnexion</SignOutButton>
    </Button>
  );
};

export default Logout;
