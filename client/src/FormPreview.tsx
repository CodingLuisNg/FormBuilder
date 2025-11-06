import React, { useState } from "react";
import { FormSchema } from "./formTypes";

export function FormPreview({ form, onReturn }: { form: FormSchema, onReturn: () => void }) {
    const [values, setValues] = useState<any>({});
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    function handleChange(id: string, value: any) {
        setValues({ ...values, [id]: value });
    }
    // Compute which questions should be visible based on dropdown conditions
    function getVisibleFieldIds() {
        const fields = form.fields;
        let visibleIds: string[] = [];
        let jumpDropdownIdx = -1;
        let jumpTargetId: string | null = null;
        // Find all possible jump targets
        const possibleJumpTargets = new Set<string>();
        for (const field of fields) {
            if (field.type === "dropdown" && field.condition) {
                Object.values(field.condition).forEach(id => {
                    if (id) possibleJumpTargets.add(id);
                });
            }
        }
        // Find first dropdown with condition
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (field.type === "dropdown" && field.condition) {
                jumpDropdownIdx = i;
                if (values[field.id]) {
                    const targetId = field.condition[values[field.id]];
                    if (targetId) {
                        jumpTargetId = targetId;
                    }
                }
                break;
            }
        }
        if (jumpDropdownIdx !== -1) {
            // Only show the dropdown itself
            visibleIds.push(fields[jumpDropdownIdx].id);
            // If a jump is selected, show only the jump target from the conditional list
            if (jumpTargetId) {
                visibleIds.push(jumpTargetId);
            }
            // Show all after the jump target
            let afterIdx = jumpTargetId ? fields.findIndex(f => f.id === jumpTargetId) + 1 : jumpDropdownIdx + 1;
            for (let i = afterIdx; i < fields.length; i++) {
                // Only show if not a possible jump target or is the selected jump target
                if (!possibleJumpTargets.has(fields[i].id) || fields[i].id === jumpTargetId) {
                    visibleIds.push(fields[i].id);
                }
            }
        } else {
            // No conditional dropdown, show all
            visibleIds = fields.map(f => f.id);
        }
        return visibleIds;
    }
    const visibleFieldIds = getVisibleFieldIds();

    // Enhanced validation: ignore required for hidden questions
    function validate(values: any, form: FormSchema): string[] {
        const errors: string[] = [];
        const visibleIdsSet = new Set(visibleFieldIds);
        // Find the selected jump target for the first conditional dropdown
        let jumpTargetId: string | null = null;
        for (let i = 0; i < form.fields.length; i++) {
            const field = form.fields[i];
            if (field.type === "dropdown" && field.condition) {
                if (values[field.id]) {
                    const targetId = field.condition[values[field.id]];
                    if (targetId) jumpTargetId = targetId;
                }
                break;
            }
        }
        form.fields.forEach(field => {
            if (!visibleIdsSet.has(field.id)) return;
            const value = values[field.id];
            // Only validate required for visible fields, and for jump targets only if they are the selected one
            if (field.type === "text") {
                let required = field.validation?.required;
                if (jumpTargetId && field.id !== jumpTargetId && visibleIdsSet.has(jumpTargetId)) required = false;
                if (required && !value?.trim()) errors.push(`${field.label} is required.`);
                if (field.validation?.minLength && value?.length < field.validation.minLength) errors.push(`${field.label} must be at least ${field.validation.minLength} characters.`);
                if (field.validation?.maxLength && value?.length > field.validation.maxLength) errors.push(`${field.label} must be at most ${field.validation.maxLength} characters.`);
            }
            if (field.type === "dropdown") {
                let required = field.validation?.required;
                if (jumpTargetId && field.id !== jumpTargetId && visibleIdsSet.has(jumpTargetId)) required = false;
                if (required && !value) errors.push(`${field.label} is required.`);
                if (value && field.options && !field.options.includes(value)) errors.push(`${field.label} value is not valid.`);
            }
            if (field.type === "table" && Array.isArray(value)) {
                value.forEach((row: any, rowIdx: number) => {
                    field.columns.forEach(col => {
                        let colRequired = col.validation?.required;
                        if (jumpTargetId && field.id !== jumpTargetId && visibleIdsSet.has(jumpTargetId)) colRequired = false;
                        const cell = row[col.id];
                        if (col.type === "text" && colRequired && !cell?.trim()) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} is required.`);
                        if (col.type === "text" && col.validation?.minLength && cell?.length < col.validation.minLength) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} must be at least ${col.validation.minLength} characters.`);
                        if (col.type === "text" && col.validation?.maxLength && cell?.length > col.validation.maxLength) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} must be at most ${col.validation.maxLength} characters.`);
                        if (col.type === "dropdown" && colRequired && !cell) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} is required.`);
                        if (cell && col.options && !col.options.includes(cell)) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} value is not valid.`);
                    });
                });
            }
        });
        return errors;
    }
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitted(false);
        setErrors([]);
        const validationErrors = validate(values, form);
        if (validationErrors.length) {
            setErrors(validationErrors);
            return;
        }
        try {
            const res = await fetch(`/api/forms/${form.id}/responses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
            });
            const result = await res.json();
            if (!res.ok) {
                setErrors(result.errors || [result.error || "Submission failed"]);
                setSubmitted(false);
            } else {
                window.alert("Response submitted!");
                onReturn();
            }
        } catch (err: any) {
            setErrors([err.message]);
            setSubmitted(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: "40px auto", background: "#f8f8fa", borderRadius: 16, boxShadow: "0 4px 24px #0001", padding: 40 }}>
            <h2 style={{ marginBottom: 32 }}>{form.title}</h2>
            {errors.length > 0 && <div style={{ color: "red", marginBottom: 24 }}>{errors.map((err, i) => <div key={i}>{err}</div>)}</div>}
            {form.fields.map(field => (
                visibleFieldIds.includes(field.id) && (
                    <div key={field.id} style={{ marginBottom: 36 }}>
                        <label style={{ display: "block", fontWeight: 600, fontSize: 18, marginBottom: 12 }}>{field.label}</label>
                        {field.type === "text" && (
                            <input style={{ width: "100%", fontSize: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 8 }} value={values[field.id] || ""} onChange={e => handleChange(field.id, e.target.value)} />
                        )}
                        {field.type === "dropdown" && (
                            <select style={{ width: "100%", fontSize: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 8 }} value={values[field.id] || ""} onChange={e => handleChange(field.id, e.target.value)}>
                                <option value="">Select...</option>
                                {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        )}
                        {field.type === "table" && (
                            <div style={{ marginTop: 12 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
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
                                                            <input style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }} value={values[field.id]?.[rowIdx]?.[col.id] || ""} onChange={e => {
                                                                const table = values[field.id] || Array(field.rowLabels?.length).fill({});
                                                                table[rowIdx] = { ...table[rowIdx], [col.id]: e.target.value };
                                                                handleChange(field.id, table);
                                                            }} />
                                                        ) : (
                                                            <select style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }} value={values[field.id]?.[rowIdx]?.[col.id] || ""} onChange={e => {
                                                                const table = values[field.id] || Array(field.rowLabels?.length).fill({});
                                                                table[rowIdx] = { ...table[rowIdx], [col.id]: e.target.value };
                                                                handleChange(field.id, table);
                                                            }}>
                                                                <option value="">Select...</option>
                                                                {col.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        {field.mode === "dynamic" && ((Array.isArray(values[field.id]) ? values[field.id] : [])).map((row: any, rowIdx: number) => (
                                            <tr key={rowIdx}>
                                                <td style={{ fontWeight: 600, padding: "12px 10px", fontSize: 15 }}>{rowIdx + 1}</td>
                                                {field.columns.map(col => (
                                                    <td key={col.id} style={{ padding: "12px 10px" }}>
                                                        {col.type === "text" ? (
                                                            <input style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }} value={row[col.id] || ""} onChange={e => {
                                                                const table = Array.isArray(values[field.id]) ? values[field.id] : [];
                                                                table[rowIdx] = { ...table[rowIdx], [col.id]: e.target.value };
                                                                handleChange(field.id, table);
                                                            }} />
                                                        ) : (
                                                            <select style={{ width: "100%", fontSize: 15, padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" }} value={row[col.id] || ""} onChange={e => {
                                                                const table = Array.isArray(values[field.id]) ? values[field.id] : [];
                                                                table[rowIdx] = { ...table[rowIdx], [col.id]: e.target.value };
                                                                handleChange(field.id, table);
                                                            }}>
                                                                <option value="">Select...</option>
                                                                {col.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {field.mode === "dynamic" && (
                                    <button type="button" style={{ marginTop: 8, padding: "10px 24px", fontSize: 16, borderRadius: 8, border: "1px solid #ddd", background: "#f0f0f0", fontWeight: 600 }} onClick={() => {
                                        const table = Array.isArray(values[field.id]) ? values[field.id] : [];
                                        handleChange(field.id, [...table, {}]);
                                    }}>Add Row</button>
                                )}
                            </div>
                        )}
                    </div>
                )
            ))}
            {!submitted ? (
                <button type="submit" style={{ marginTop: 24, padding: "12px 32px", fontSize: 18, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600 }}>Submit</button>
            ) : null}
        </form>
    );
}
