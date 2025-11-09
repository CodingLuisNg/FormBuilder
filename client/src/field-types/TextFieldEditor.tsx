import React, { useCallback } from "react";
import { TextField } from "./formTypes";

type Props = {
    field: TextField;
    updateField: (id: string, changes: Partial<TextField>) => void;
    removeField: (id: string) => void;
};

/**
 * TextFieldEditor component for editing text fields in a form.
 * @param {TextField} field - The text field being edited.
 * @param {Function} updateField - Function to update the text field with changes.
 * @param {Function} removeField - Function to remove the text field.
 * @returns {JSX.Element} The rendered TextFieldEditor component.
 */
export default function TextFieldEditor({ field, updateField, removeField }: Props) {
    /**
     * Updates the label of the text field.
     * @param {string} label - The new label for the text field.
     */
    const setLabel = useCallback(
        (label: string) => updateField(field.id, { label }),
        [field.id, updateField]
    );

    /**
     * Updates the validation settings of the text field.
     * @param {Partial<TextField["validation"]>} changes - The changes to apply to the validation settings.
     */
    const setValidation = useCallback(
        (changes: Partial<TextField["validation"]>) =>
            updateField(field.id, { validation: { ...field.validation, ...changes } }),
        [field.id, field.validation, updateField]
    );

    return (
        <div className="editor-block">
            <div className="editor-header">
                <div className="editor-type">TEXT FIELD</div>
                <button className="editor-delete" onClick={() => removeField(field.id)}>Delete</button>
            </div>

            <label className="editor-field">
                <span className="editor-label">Label</span>
                <input
                    className="editor-input"
                    value={field.label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Field label"
                />
            </label>

            <div className="editor-section">
                <div className="editor-section-title">Validation</div>
                <label className="editor-field-inline">
                    <input
                        type="checkbox"
                        className="editor-checkbox"
                        checked={field.validation?.required || false}
                        onChange={(e) => setValidation({ required: e.target.checked })}
                    />
                    Required
                </label>

                <label className="editor-field">
                    <span className="editor-label">Min Length</span>
                    <input
                        type="number"
                        className="editor-input"
                        value={field.validation?.minLength ?? ""}
                        min={0}
                        onChange={(e) =>
                            setValidation({
                                minLength: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                        }
                        placeholder="0"
                    />
                </label>

                <label className="editor-field">
                    <span className="editor-label">Max Length</span>
                    <input
                        type="number"
                        className="editor-input"
                        value={field.validation?.maxLength ?? ""}
                        min={0}
                        onChange={(e) =>
                            setValidation({
                                maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                        }
                        placeholder="0"
                    />
                </label>
            </div>
        </div>
    );
}
