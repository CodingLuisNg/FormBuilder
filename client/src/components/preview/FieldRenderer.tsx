import React from "react";
import { FormField } from "../../field-types/formTypes";
import TableFieldRenderer from "./TableFieldRenderer";

/**
 * Renders a single form field for preview, dispatching to the correct field type renderer.
 * @param {Object} props - The component props.
 * @param {FormField} props.field - The field schema.
 * @param {any} props.value - The current value for the field.
 * @param {Function} props.onChange - Callback for when the field value changes.
 * @returns {JSX.Element} The rendered field.
 */
export default function FieldRenderer({ field, value, onChange }: {
  field: FormField,
  value: any,
  onChange: (val: any) => void
}) {
  if (field.type === "text") {
    return (
      <div style={{ marginBottom: 36 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 18, marginBottom: 12 }}>{field.label}</label>
        <input
          style={{ width: "100%", fontSize: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 8 }}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    );
  }
  if (field.type === "dropdown") {
    return (
      <div style={{ marginBottom: 36 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 18, marginBottom: 12 }}>{field.label}</label>
        <select
          style={{ width: "100%", fontSize: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 8 }}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select...</option>
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === "table") {
    return <TableFieldRenderer field={field} value={value} onChange={onChange} />;
  }
  return null;
}
