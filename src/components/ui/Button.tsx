import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  const variantClass =
    variant === "primary"
      ? "primary-button"
      : variant === "danger"
      ? "danger-button"
      : "secondary-button";

  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}