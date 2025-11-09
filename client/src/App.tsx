import React, {JSX, useState} from "react";
import { FormBuilder } from "./pages/FormBuilder";
import { FormPreview } from "./pages/FormPreview";
import { FormSchema } from "./field-types/formTypes";
import SavedForms from "./pages/SavedForms";
import ResponsesPage from "./pages/ResponsesPage";

/**
 * Notification component to display temporary messages.
 * @param {Object} props - Component props.
 * @param {string} props.message - The message to display.
 * @param {Function} props.onClose - Callback to close the notification.
 * @returns {JSX.Element} The rendered notification component.
 */
function Notification({ message, onClose }: { message: string, onClose: () => void }): JSX.Element {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 2000); // Automatically close after 2 seconds.
        return () => clearTimeout(timer); // Cleanup the timer on unmount.
    }, [onClose]);
    return (
        <div style={{
            position: "fixed", top: 24, right: 24, zIndex: 1000,
            background: "#222", color: "#fff", padding: "16px 32px", borderRadius: 8, boxShadow: "0 2px 12px #0003", fontSize: 16
        }}>{message}</div>
    );
}

/**
 * Main App component that manages the form builder application.
 * @returns {JSX.Element} The rendered App component.
 */
export default function App(): JSX.Element {
    // State to manage the current form being edited or previewed.
    const [form, setForm] = useState<FormSchema | null>(null);
    // State to manage the current mode of the application.
    const [mode, setMode] = useState<"builder" | "preview" | "saved" | "responses">("saved");
    // State to manage the form being edited.
    const [editForm, setEditForm] = useState<FormSchema | null>(null);
    // State to manage the visibility of the unsaved progress warning.
    const [showWarning, setShowWarning] = useState(false);
    // State to manage the notification message.
    const [notification, setNotification] = useState<string | null>(null);

    /**
     * Navigates to a different mode in the application.
     * @param {string} newMode - The mode to navigate to.
     * @param {FormSchema|null} [formToEdit=null] - The form to edit, if applicable.
     */
    const navigateTo = (newMode: typeof mode, formToEdit: FormSchema | null = null) => {
        setEditForm(formToEdit);
        setForm(null);
        setMode(newMode);
    };

    /**
     * Handles saving a form to the server.
     * @param {FormSchema} form - The form data to save.
     */
    const handleSave = async (form: FormSchema) => {
        try {
            const url = editForm?.id ? `/api/forms/${editForm.id}` : `/api/forms`;
            const method = editForm?.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                setNotification("Failed to save form");
                return;
            }
            const savedForm = await res.json();
            setForm(savedForm);
            setEditForm(savedForm);
            setNotification("Form saved successfully!");
        } catch (err) {
            setNotification(`Error saving form: ${(err as Error).message}`);
        }
    };

    /**
     * Confirms returning to the saved forms page, discarding unsaved progress.
     */
    const confirmReturn = () => {
        setShowWarning(false);
        navigateTo("saved");
    };

    return (
        <div style={{ fontFamily: "sans-serif", background: "#f0f1f6", minHeight: "100vh", paddingTop: 32 }}>
            {/* Display notification if there is a message */}
            {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
            {/* Render SavedForms component in "saved" mode */}
            {mode === "saved" && <SavedForms onEdit={(form) => navigateTo("builder", form)} onCreateNew={() => navigateTo("builder")} />}
            {/* Render FormBuilder component in "builder" mode */}
            {mode === "builder" && (
                <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <button onClick={() => setShowWarning(true)} style={{ background: "none", border: "none", color: "#333", fontSize: 16, cursor: "pointer" }}>← Return to Saved Forms</button>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setForm(editForm); setMode("preview"); }} style={{ background: "none", border: "none", color: "#333", fontSize: 16, cursor: "pointer" }}>Preview</button>
                            <button onClick={() => { setForm(editForm); setMode("responses"); }} style={{ background: "none", border: "none", color: "#333", fontSize: 16, cursor: "pointer" }}>Responses</button>
                        </div>
                    </div>
                    {/* Display warning if unsaved progress exists */}
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
            {/* Render FormPreview component in "preview" mode */}
            {mode === "preview" && form && (
                <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
                    <FormPreview form={form} onReturn={() => setMode("builder")} />
                </div>
            )}
            {/* Render ResponsesPage component in "responses" mode */}
            {mode === "responses" && form && (
                <div style={{ maxWidth: 700, margin: "40px auto", padding: 24 }}>
                    <ResponsesPage formId={form.id || ""} onReturn={() => setMode("builder")} />
                </div>
            )}
        </div>
    );
}
