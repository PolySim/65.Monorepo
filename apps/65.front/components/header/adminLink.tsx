"use client";

import { UserRole } from "@/model/user.model";
import { useUser } from "@/queries/user.queries";
import Link from "next/link";
import { Button } from "../ui/button";

const AdminLink = () => {
  const { data: user } = useUser();

  if (user?.data?.roleId !== UserRole.ADMIN) return null;

  return (
    <Button asChild>
      <Link href="/admin">Admin</Link>
    </Button>
  );
};

export default AdminLink;
