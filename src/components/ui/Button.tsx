import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "icon"
  | "iconDanger"
  | "iconWarning";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  title?: string;
  tone?: "default" | "danger" | "warning";
  children: ReactNode;
  variant?: Variant;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "primary-button",
  secondary: "secondary-button",
  danger: "danger-button",
  icon: "icon-button",
  iconDanger: "icon-button icon-button-danger",
  iconWarning: "icon-button icon-button-warning",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`${VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}



