type Props = {
  title: string;
  subtitle?: string;
};

export default function PageTitle({ title, subtitle }: Props) {
  return (
    <>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </>
  );
}