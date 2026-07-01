import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function FormSection({
  title,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <section className={`form-section ${className}`.trim()}>
      <h2 className="form-section-title">{title}</h2>
      {children}
    </section>
  );
}
