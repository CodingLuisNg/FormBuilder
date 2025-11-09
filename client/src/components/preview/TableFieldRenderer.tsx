import React from "react";
import { TableField } from "../../field-types/formTypes";

/**
 * Renders a table field for preview, supporting both static and dynamic modes.
 * @param {Object} props - The component props.
 * @param {TableField} props.field - The table field schema.
 * @param {any[]} props.value - The current value for the table (array of rows).
 * @param {Function} props.onChange - Callback for when the table value changes.
 * @returns {JSX.Element} The rendered table field.
 */
export default function TableFieldRenderer({ field, value, onChange }: {
  field: TableField,
  value: any[],
  onChange: (val: any[]) => void
}) {
  // Helper to update a cell value
  const handleCellChange = (rowIdx: number, colId: string, cellValue: any) => {
    const table = Array.isArray(value) ? [...value] : [];
    table[rowIdx] = { ...table[rowIdx], [colId]: cellValue };
    onChange(table);
  };

  // Add a new row (dynamic mode)
  const handleAddRow = () => {
    const table = Array.isArray(value) ? value : [];
    onChange([...table, {}]);
  };

  return (
    <div className="responsive-table-wrapper" style={{ marginTop: 12 }}>
      <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={{ width: 120 }}></th>
            {field.columns.map(col => (
              <th key={col.id} style={{ padding: "12px 10px", fontWeight: 600, fontSize: 15 }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {field.mode === "static" && (field.rowLabels || []).map((rowLabel, rowIdx) => (
            <tr key={rowIdx}>
              <td style={{ fontWeight: 600, padding: "12px 10px", fontSize: 15 }}>{rowLabel}</td>
              {field.columns.map(col => (
                <td key={col.id} style={{ padding: "12px 10px" }}>
                  {col.type === "text" ? (
                    <input
                      style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }}
                      value={value?.[rowIdx]?.[col.id] || ""}
                      onChange={e => handleCellChange(rowIdx, col.id, e.target.value)}
                    />
                  ) : (
                    <select
                      style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }}
                      value={value?.[rowIdx]?.[col.id] || ""}
                      onChange={e => handleCellChange(rowIdx, col.id, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </td>
              ))}
            </tr>
          ))}
          {field.mode === "dynamic" && (Array.isArray(value) ? value : []).map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td style={{ fontWeight: 600, padding: "12px 10px", fontSize: 15 }}>{rowIdx + 1}</td>
              {field.columns.map(col => (
                <td key={col.id} style={{ padding: "12px 10px" }}>
                  {col.type === "text" ? (
                    <input
                      style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }}
                      value={row[col.id] || ""}
                      onChange={e => handleCellChange(rowIdx, col.id, e.target.value)}
                    />
                  ) : (
                    <select
                      style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }}
                      value={row[col.id] || ""}
                      onChange={e => handleCellChange(rowIdx, col.id, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {field.mode === "dynamic" && (
        <button type="button" style={{ marginTop: 8, padding: "10px 24px", fontSize: 16, borderRadius: 8, border: "1px solid #ddd", background: "#f0f0f0", fontWeight: 600 }} onClick={handleAddRow}>
          Add Row
        </button>
      )}
    </div>
  );
}

