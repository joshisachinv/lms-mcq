type Props = {
  children: React.ReactNode;
  color?: "green" | "yellow" | "red" | "gray";
};

export default function Badge({ children, color = "gray" }: Props) {
  return (
    <span className={`badge ${color === "green" ? "badge-green" : "badge-gray"}`}>
      {children}
    </span>
  );
}