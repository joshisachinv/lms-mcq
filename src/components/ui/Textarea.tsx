import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export default function Textarea({ label, className = "", ...props }: Props) {
  return (
    <label className="form-label">
      {label}
      <textarea className={`form-textarea ${className}`} {...props} />
    </label>
  );
}
