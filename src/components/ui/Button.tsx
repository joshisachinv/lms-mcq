import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "primary-button",
  secondary: "secondary-button",
  danger: "danger-button",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button className={`${VARIANT_CLASSES[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
