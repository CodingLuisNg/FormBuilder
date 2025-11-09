import React, { useEffect, useState } from "react";
import { FormSchema } from "../field-types/formTypes";

/**
 * ResponsesPage component for displaying and managing responses to a specific form.
 * @param {Object} props - The component props.
 * @param {string} props.formId - The ID of the form whose responses are being displayed.
 * @param {Function} props.onReturn - Callback function to return to the previous view.
 * @returns {JSX.Element} The rendered ResponsesPage component.
 */
export default function ResponsesPage({ formId, onReturn }: { formId: string, onReturn: () => void }) {
    // State to store the list of responses.
    const [responses, setResponses] = useState<any[]>([]);
    // State to track if data is being loaded.
    const [loading, setLoading] = useState(true);
    // State to store any error messages.
    const [error, setError] = useState<string | null>(null);
    // State to store the form schema.
    const [formSchema, setFormSchema] = useState<FormSchema | null>(null);

    // Fetches the form schema and responses when the component mounts or formId changes.
    useEffect(() => {
        async function fetchSchemaAndResponses() {
            setLoading(true);
            setError(null);
            try {
                const schemaRes = await fetch(`/api/forms/${formId}`);
                if (!schemaRes.ok) throw new Error("Failed to fetch form schema");
                const schema = await schemaRes.json();
                setFormSchema(schema);
                const res = await fetch(`/api/forms/${formId}/responses`);
                if (!res.ok) throw new Error("Failed to fetch responses");
                setResponses(await res.json());
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        void fetchSchemaAndResponses();
    }, [formId]);

    /**
     * Clears all responses for the current form.
     * Prompts the user for confirmation before clearing.
     */
    async function handleClearResponses() {
        if (!window.confirm("Are you sure you want to clear all responses? This cannot be undone.")) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/forms/${formId}/responses`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) throw new Error("Failed to clear responses");
            setResponses([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Renders a single response.
     * @param {Object} resp - The response data.
     * @param {number} idx - The index of the response.
     * @returns {JSX.Element|null} The rendered response or null if the form schema is not available.
     */
    function renderResponse(resp: any, idx: number) {
        if (!formSchema) return null;
        return (
            <div key={idx} style={{ background: "#f8f8fa", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14, overflowX: "auto" }}>
                {formSchema.fields.map(field => {
                    if (field.type === "table") {
                        const tableData = resp[field.id] || [];
                        return (
                            <div key={field.id} style={{ marginBottom: 8 }}>
                                <div style={{ fontWeight: 600 }}>{field.label}</div>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
                                    <thead>
                                    <tr>
                                        <th style={{}}></th>
                                        {field.columns.map(col => <th key={col.id} style={{}}>{col.label}</th>)}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {field.mode === "static" && (field.rowLabels || []).map((rowLabel, rowIdx) => (
                                        <tr key={rowIdx}>
                                            <td style={{ fontWeight: 600 }}>{rowLabel}</td>
                                            {field.columns.map(col => (
                                                <td key={col.id}>{tableData[rowIdx]?.[col.id] || ""}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    {field.mode === "dynamic" && tableData.map((row: any, rowIdx: number) => (
                                        <tr key={rowIdx}>
                                            <td style={{ fontWeight: 600 }}>{rowIdx + 1}</td>
                                            {field.columns.map(col => (
                                                <td key={col.id}>{row[col.id] || ""}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    } else {
                        return (
                            <div key={field.id} style={{ marginBottom: 8 }}>
                                <span style={{ fontWeight: 600 }}>{field.label}:</span> {resp[field.id] || ""}
                            </div>
                        );
                    }
                })}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
            <button onClick={onReturn} style={{ marginBottom: 16 }}>Return to Edit Form</button>
            <h2 style={{ marginBottom: 16 }}>Responses</h2>
            <button onClick={handleClearResponses} style={{ marginBottom: 24, background: "#e74c3c", color: "white", padding: "10px 20px", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 16 }}>Clear Responses</button>
            {loading ? <div>Loading...</div> : error ? <div style={{ color: "red" }}>{error}</div> : (
                responses.length === 0 ? <div>No responses yet.</div> : (
                    <div>
                        {responses.map(renderResponse)}
                    </div>
                )
            )}
        </div>
    );
}
