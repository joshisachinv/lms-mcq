"use client";

import { useMemo, useState } from "react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => string | number | boolean | null | undefined;
  filter?: boolean;
  sortable?: boolean;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
};

export default function DataTable<T>({
  data,
  columns,
  getRowKey,
}: Props<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const getCellValue = (row: T, column: Column<T>) => {
    if (column.getValue) return column.getValue(row);

    return (row as Record<string, unknown>)[String(column.key)] as
      | string
      | number
      | boolean
      | null
      | undefined;
  };

  const uniqueValues = (column: Column<T>) => {
    return Array.from(
      new Set(
        data
          .map((row) => String(getCellValue(row, column) ?? ""))
          .filter(Boolean)
      )
    ).sort();
  };

  const filteredData = useMemo(() => {
    let result = data.filter((row) =>
      columns.every((column) => {
        const filterValue = filters[String(column.key)];
        if (!filterValue) return true;

        const value = String(getCellValue(row, column) ?? "");
        return value === filterValue;
      })
    );

    if (sortKey) {
      const sortColumn = columns.find((column) => String(column.key) === sortKey);

      if (sortColumn) {
        result = [...result].sort((a, b) => {
          const aValue = String(getCellValue(a, sortColumn) ?? "").toLowerCase();
          const bValue = String(getCellValue(b, sortColumn) ?? "").toLowerCase();

          if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
          if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [data, filters, sortKey, sortDirection]);

  const toggleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const key = String(column.key);

    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return (
    <div className="table-card">
      <div className="table-summary">
        Showing {filteredData.length} of {data.length}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>
                <button
                  type="button"
                  onClick={() => toggleSort(column)}
                  className="table-sort-button"
                  disabled={!column.sortable}
                >
                  {column.label}
                  {sortKey === String(column.key)
                    ? sortDirection === "asc"
                      ? " ↑"
                      : " ↓"
                    : ""}
                </button>

                {column.filter && (
                  <select
                    value={filters[String(column.key)] || ""}
                    onChange={(e) =>
                      setFilters((current) => ({
                        ...current,
                        [String(column.key)]: e.target.value,
                      }))
                    }
                    className="table-filter-select"
                  >
                    <option value="">All</option>
                    {uniqueValues(column).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredData.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {column.render
                    ? column.render(row)
                    : String(getCellValue(row, column) ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}