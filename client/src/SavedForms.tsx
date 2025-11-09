import React, { useState, useEffect } from "react";
import { FormSchema } from "./formTypes";

export default function SavedForms({ onEdit, onCreateNew }: {
    onEdit: (form: FormSchema) => void,
    onCreateNew: () => void
}) {
    const [forms, setForms] = useState<FormSchema[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchForms() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/forms");
                if (!res.ok) throw new Error("Failed to fetch forms");
                const data = await res.json();
                setForms(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        void fetchForms();
    }, []);

    async function handleDelete(id: string) {
        if (!window.confirm("Are you sure you want to delete this form? This cannot be undone and all responses will be lost.")) return;
        try {
            const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete form");
            setForms(forms.filter(f => f.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function handleEdit(id: string) {
        setError(null);
        try {
            const res = await fetch(`/api/forms/${id}`);
            if (!res.ok) throw new Error("Failed to load form");
            const form = await res.json();
            onEdit(form);
        } catch (err: any) {
            setError(err.message);
        }
    }

    return (
        <div className="responsive-container"
            style={{
                maxWidth: 700,
                margin: "40px auto",
                background: "#f8f8fa",
                borderRadius: 16,
                boxShadow: "0 4px 24px #0001",
                padding: 32,
                boxSizing: "border-box",
                minHeight: "calc(100vh - 80px)",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <h1
                style={{
                    fontSize: 36,
                    fontWeight: 700,
                    textAlign: "center",
                    margin: "0 0 32px 0",
                    letterSpacing: 1
                }}
            >
                Easy Form Builder
            </h1>
            <button
                onClick={onCreateNew}
                style={{
                    width: "100%",
                    fontSize: 20,
                    padding: "18px 0",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: "#fff",
                    cursor: "pointer",
                    marginBottom: 32,
                    fontWeight: 600,
                    letterSpacing: 0.5
                }}
            >
                + Create New Form
            </button>
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}
            {forms.length === 0 && !loading && <div>No saved forms.</div>}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                {forms.map(form => (
                    <li
                        key={form.id}
                        style={{
                            background: "#fff",
                            borderRadius: 12,
                            boxShadow: "0 2px 8px #0001",
                            padding: 0,
                            marginBottom: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            minHeight: 72
                        }}
                    >
                        <button
                            onClick={() => handleEdit(form.id!)}
                            style={{
                                flex: 1,
                                textAlign: "left",
                                background: "none",
                                border: "none",
                                padding: "28px 24px",
                                fontSize: 20,
                                cursor: "pointer",
                                borderRadius: 12,
                                outline: "none",
                                fontWeight: 500
                            }}
                        >
                            {form.title || "Untitled"}
                        </button>
                        <div style={{ display: "flex", gap: 12, paddingRight: 24 }}>
                            <button
                                onClick={() => handleDelete(form.id!)}
                                style={{
                                    fontSize: 16,
                                    border: "1px solid #eee",
                                    background: "#fff0f0",
                                    borderRadius: 8,
                                    padding: "10px 18px",
                                    color: "#c00",
                                    cursor: "pointer",
                                    fontWeight: 500
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
