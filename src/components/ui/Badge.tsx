import type { ReactNode } from "react";

type Color =
  | "green"
  | "yellow"
  | "blue"
  | "gray"
  | "red"
  | "orange"
  | "purple";

type Props = {
  children: ReactNode;
  color?: Color;
  className?: string;
};

const COLOR_CLASSES: Record<Color, string> = {
  green: "badge-green",
  yellow: "badge-yellow",
  blue: "badge-blue",
  gray: "badge-gray",
  red: "badge-red",
  orange: "badge-orange",
  purple: "badge-purple",
};

export default function Badge({ children, color = "gray", className = "" }: Props) {
  return (
    <span className={`badge ${COLOR_CLASSES[color]} ${className}`.trim()}>
      {children}
    </span>
  );
}
