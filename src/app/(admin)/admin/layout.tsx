import { redirect } from "next/navigation";
import { checkAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkAdmin();
  if (!user) {
    redirect("/exams");
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
