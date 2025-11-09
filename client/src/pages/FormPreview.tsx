import React, { useState } from "react";
import { FormSchema } from "../field-types/formTypes";
import FieldRenderer from "../components/preview/FieldRenderer";
import { validateFormResponse } from "../components/preview/validateFormResponse";

/**
 * FormPreview component for rendering a preview of a form and handling user input.
 * @param {Object} props - The component props.
 * @param {FormSchema} props.form - The form schema to render.
 * @param {Function} props.onReturn - Callback function to return to the previous view.
 * @returns {JSX.Element} The rendered FormPreview component.
 */
export function FormPreview({ form, onReturn }: { form: FormSchema, onReturn: () => void }) {
    // State to store the values entered by the user.
    const [values, setValues] = useState<any>({});
    // State to track if the form has been submitted.
    const [submitted, setSubmitted] = useState(false);
    // State to store validation errors.
    const [errors, setErrors] = useState<string[]>([]);

    // Handles changes to form field values.
    function handleChange(id: string, value: any) {
        setValues({ ...values, [id]: value });
    }

    // Compute visible field IDs based on dropdown conditions.
    function getVisibleFieldIds() {
        const fields = form.fields;
        let visibleIds: string[] = [];
        let jumpDropdownIdx = -1;
        let jumpTargetId: string | null = null;
        const possibleJumpTargets = new Set<string>();

        // Identify possible jump targets from dropdown conditions.
        for (const field of fields) {
            if (field.type === "dropdown" && field.condition) {
                Object.values(field.condition).forEach(id => {
                    if (id) possibleJumpTargets.add(id);
                });
            }
        }

        // Find the first dropdown with a condition.
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
            visibleIds.push(fields[jumpDropdownIdx].id);
            if (jumpTargetId) {
                visibleIds.push(jumpTargetId);
            }
            let afterIdx = jumpTargetId ? fields.findIndex(f => f.id === jumpTargetId) + 1 : jumpDropdownIdx + 1;
            for (let i = afterIdx; i < fields.length; i++) {
                if (!possibleJumpTargets.has(fields[i].id) || fields[i].id === jumpTargetId) {
                    visibleIds.push(fields[i].id);
                }
            }
        } else {
            visibleIds = fields.map(f => f.id);
        }
        return visibleIds;
    }
    const visibleFieldIds = getVisibleFieldIds();

    // Validate form values using modularized validation helper.
    function validate(values: any, form: FormSchema): string[] {
        return validateFormResponse(values, form, visibleFieldIds);
    }

    // Handles form submission.
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
        <div className="responsive-container">
            <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: "40px auto", background: "#f8f8fa", borderRadius: 16, boxShadow: "0 4px 24px #0001", padding: 40 }}>
                <h2 style={{ marginBottom: 32 }}>{form.title}</h2>
                {errors.length > 0 && <div style={{ color: "red", marginBottom: 24 }}>{errors.map((err, i) => <div key={i}>{err}</div>)}</div>}
                {form.fields.map(field => (
                    visibleFieldIds.includes(field.id) && (
                        <FieldRenderer
                            key={field.id}
                            field={field}
                            value={values[field.id]}
                            onChange={val => handleChange(field.id, val)}
                        />
                    )
                ))}
                {!submitted ? (
                    <button type="submit" style={{ marginTop: 24, padding: "12px 32px", fontSize: 18, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600 }}>Submit</button>
                ) : null}
            </form>
        </div>
    );
}
