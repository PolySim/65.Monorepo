"use client";

import { UserRole } from "@/model/user.model";
import { useUser } from "@/queries/user.queries";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

const AdminLink = () => {
  const { data: user } = useUser();

  if (user?.data?.roleId !== UserRole.ADMIN) return null;

  return (
    <Button variant="secondary" asChild>
      <Link href="/admin">
        <Settings aria-hidden="true" />
        Administration
      </Link>
    </Button>
  );
};

export default AdminLink;
