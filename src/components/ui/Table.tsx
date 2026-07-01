import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Table({ children, className = "" }: Props) {
  return (
    <div className={`table-card ${className}`.trim()}>
      <table className="data-table">{children}</table>
    </div>
  );
}
