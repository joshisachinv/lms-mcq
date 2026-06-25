type FormSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function FormSection({
  title,
  children,
}: FormSectionProps) {
  return (
    <section className="form-section">
      <h2 className="form-section-title">{title}</h2>
      {children}
    </section>
  );
}