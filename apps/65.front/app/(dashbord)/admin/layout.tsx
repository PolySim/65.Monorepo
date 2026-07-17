import AdminNavigation from "@/components/admin/adminNavigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-muted/35 py-5 sm:py-7">
      <div className="page-container grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <AdminNavigation />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
