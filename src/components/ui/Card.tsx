import type { HTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export default function Card({ className = "", ...props }: Props) {
  return <div className={`dashboard-card ${className}`.trim()} {...props} />;
}
