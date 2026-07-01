import type { ReactNode } from "react";

type Color = "green" | "yellow" | "red" | "gray";

type Props = {
  children: ReactNode;
  color?: Color;
  className?: string;
};

const COLOR_CLASSES: Record<Color, string> = {
  green: "badge-green",
  yellow: "badge-yellow",
  red: "badge-red",
  gray: "badge-gray",
};

export default function Badge({ children, color = "gray", className = "" }: Props) {
  return (
    <span className={`badge ${COLOR_CLASSES[color]} ${className}`.trim()}>
      {children}
    </span>
  );
}
