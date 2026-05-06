import React from 'react';

export interface Column<T> {
  key:      keyof T | string;
  header:   string;
  render?:  (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns:    Column<T>[];
  data:       T[];
  loading?:   boolean;
  emptyText?: string;
  keyField?:  keyof T;
}

export default function DataTable<T extends object>({
  columns, data, loading, emptyText = 'No data found', keyField,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-eco-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-gray-400 text-sm">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowValues = row as Record<string, unknown>;
              return (
                <tr
                  key={keyField ? String(rowValues[String(keyField)]) : idx}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map(col => (
                    <td key={String(col.key)} className={`px-4 py-3 text-sm text-gray-700 ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String(rowValues[String(col.key)] ?? '—')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
