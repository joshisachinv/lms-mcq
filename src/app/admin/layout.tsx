import RequireAdmin from "@/components/auth/RequireAdmin";
import AdminLayout from "@/components/layout/AdminLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdmin>
  );
}