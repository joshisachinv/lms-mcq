type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: React.ReactNode;
};

export default function Select({ label, children, className = "", ...props }: Props) {
  return (
    <label className="form-label">
      {label}
      <select className={`form-select ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}