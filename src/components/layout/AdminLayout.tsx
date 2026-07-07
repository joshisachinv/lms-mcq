import PageHeader from "./PageHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell" data-role="admin">
      <PageHeader
        title="LMS MCQ"
        subtitle="Administrator"
        navItems={[
          { label: "Dashboard", href: "/admin" },
          { label: "Questions", href: "/admin/questions" },
          { label: "Upload", href: "/admin/questions/upload" },
          { label: "Exams", href: "/admin/exams" },
          { label: "Results", href: "/admin/results" },
        ]}
      />

      {children}
    </div>
  );
}