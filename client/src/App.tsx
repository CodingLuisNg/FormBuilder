import React, { useState } from "react";
import { FormBuilder } from "./FormBuilder";
import { FormPreview } from "./FormPreview";
import { FormSchema } from "./formTypes";
import SavedForms from "./SavedForms";
import ResponsesPage from "./ResponsesPage";

// Notification component
function Notification({ message, onClose }: { message: string, onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 1000,
      background: "#222", color: "#fff", padding: "16px 32px", borderRadius: 8, boxShadow: "0 2px 12px #0003", fontSize: 16
    }}>{message}</div>
  );
}

export default function App() {
    const [form, setForm] = useState<FormSchema | null>(null);
    const [mode, setMode] = useState<"builder" | "preview" | "saved" | "responses">("saved");
    const [editForm, setEditForm] = useState<FormSchema | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    const navigateTo = (newMode: typeof mode, formToEdit: FormSchema | null = null) => {
        setEditForm(formToEdit);
        setForm(null);
        setMode(newMode);
    };

    const handleSave = async (form: FormSchema) => {
        try {
            const url = editForm?.id ? `/api/forms/${editForm.id}` : `/api/forms`;
            const method = editForm?.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) { setNotification("Failed to save form"); return; }
            const savedForm = await res.json();
            setForm(savedForm);
            setEditForm(savedForm);
            setNotification("Form saved successfully!");
        } catch (err) {
            setNotification(`Error saving form: ${(err as Error).message}`);
        }
    };

    const confirmReturn = () => {
        setShowWarning(false);
        navigateTo("saved");
    };

    return (
        <div style={{ fontFamily: "sans-serif", background: "#f0f1f6", minHeight: "100vh", paddingTop: 32 }}>
            {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
            {mode === "saved" && <SavedForms onEdit={(form) => navigateTo("builder", form)} onCreateNew={() => navigateTo("builder")} />}
            {mode === "builder" && (
                <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <button onClick={() => setShowWarning(true)} style={{ background: "none", border: "none", color: "#333", fontSize: 16, cursor: "pointer" }}>← Return to Saved Forms</button>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setForm(editForm); setMode("preview"); }} style={{ background: "none", border: "none", color: "#333", fontSize: 16, cursor: "pointer" }}>Preview</button>
                            <button onClick={() => { setForm(editForm); setMode("responses"); }} style={{ background: "none", border: "none", color: "#333", fontSize: 16, cursor: "pointer" }}>Responses</button>
                        </div>
                    </div>
                    {showWarning && (
                        <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                            <div style={{ marginBottom: 8 }}>You will lose all unsaved progress. Continue?</div>
                            <button onClick={confirmReturn} style={{ marginRight: 8 }}>Yes</button>
                            <button onClick={() => setShowWarning(false)}>No</button>
                        </div>
                    )}
                    <FormBuilder onSave={handleSave} initialForm={editForm || undefined} />
                </div>
            )}
            {mode === "preview" && form && (
                <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
                    <FormPreview form={form} onReturn={() => setMode("builder")} />
                </div>
            )}
            {mode === "responses" && form && (
                <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
                    <ResponsesPage formId={form.id || ""} onReturn={() => setMode("builder")} />
                </div>
            )}
        </div>
    );
}
