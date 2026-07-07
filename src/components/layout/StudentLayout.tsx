import PageHeader from "./PageHeader";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell" data-role="student">
      <PageHeader
        title="LMS MCQ"
        subtitle="Student"
        navItems={[
          { label: "Dashboard", href: "/student" },
          { label: "Take Exam", href: "/student/exams" },
          { label: "Results", href: "/student/results" },
        ]}
      />

      {children}
    </div>
  );
}