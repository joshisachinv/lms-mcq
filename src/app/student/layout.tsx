import RequireAuth from "@/components/auth/RequireAuth";
import StudentLayout from "@/components/layout/StudentLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <StudentLayout>{children}</StudentLayout>
    </RequireAuth>
  );
}