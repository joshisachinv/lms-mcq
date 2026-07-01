import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="form-label">
      {label}
      <input className={`form-input ${className}`} {...props} />
    </label>
  );
}
