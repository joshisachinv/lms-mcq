type Props = {
  children: React.ReactNode;
};

export default function Table({ children }: Props) {
  return (
    <div className="table-card">
      <table className="data-table">
        {children}
      </table>
    </div>
  );
}