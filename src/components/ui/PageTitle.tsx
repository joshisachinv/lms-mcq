type Props = {
  title: string;
  subtitle?: string;
};

export default function PageTitle({ title, subtitle }: Props) {
  return (
    <div className="page-title">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
