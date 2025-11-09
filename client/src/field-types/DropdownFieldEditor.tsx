import React, { useCallback } from "react";
import { DropdownField, FormField } from "./formTypes";

type Props = {
    field: DropdownField;
    updateField: (id: string, changes: Partial<DropdownField>) => void;
    removeField: (id: string) => void;
    fields: FormField[];
};

/**
 * DropdownFieldEditor component for editing dropdown fields in a form.
 * @param {DropdownField} field - The dropdown field being edited.
 * @param {Function} updateField - Function to update the field with changes.
 * @param {Function} removeField - Function to remove the field.
 * @param {FormField[]} fields - List of all fields in the form.
 * @returns {JSX.Element} The rendered DropdownFieldEditor component.
 */
export default function DropdownFieldEditor({ field, updateField, removeField, fields }: Props) {
    // Updates the label of the dropdown field.
    const setLabel = useCallback(
        (label: string) => updateField(field.id, { label }),
        [field.id, updateField]
    );

    // Updates the validation settings of the dropdown field.
    const setValidation = useCallback(
        (changes: Partial<DropdownField["validation"]>) =>
            updateField(field.id, { validation: { ...field.validation, ...changes } }),
        [field.id, field.validation, updateField]
    );

    // Enables or disables conditional logic for the dropdown field.
    const setConditionEnabled = (enabled: boolean) => {
        updateField(field.id, { condition: enabled ? {} : undefined });
    };

    // Updates a specific option in the dropdown field.
    const setOption = (index: number, value: string) => {
        const options = [...field.options];
        options[index] = value;
        updateField(field.id, { options });
    };

    // Adds a new option to the dropdown field.
    const addOption = () => updateField(field.id, { options: [...field.options, `Option ${field.options.length + 1}`] });

    // Removes an option from the dropdown field.
    const removeOption = (index: number) => {
        const options = field.options.filter((_, i) => i !== index);
        updateField(field.id, { options });
    };

    // Sets the conditional logic for a specific option in the dropdown field.
    const setCondition = (option: string, targetId: string) => {
        updateField(field.id, { condition: { ...(field.condition || {}), [option]: targetId } });
    };

    return (
        <div className="editor-block">
            <div className="editor-header">
                <div className="editor-type">DROPDOWN</div>
                <button className="editor-delete" onClick={() => removeField(field.id)}>Delete</button>
            </div>

            <label className="editor-field">
                <span className="editor-label">Label</span>
                <input
                    className="editor-input"
                    value={field.label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Dropdown label"
                />
            </label>

            <div className="editor-section">
                <div className="editor-section-title">Options</div>
                {field.options.map((opt, i) => (
                    <div key={i} className="editor-option-row">
                        <input
                            className="editor-input"
                            value={opt}
                            onChange={(e) => setOption(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                        />
                        {field.options.length > 1 && (
                            <button className="editor-small-button" onClick={() => removeOption(i)}>Remove</button>
                        )}
                    </div>
                ))}
                <button className="editor-small-button editor-add" onClick={addOption}>Add Option</button>
            </div>

            <div className="editor-section">
                <div className="editor-section-title">Validation & Flow</div>
                <label className="editor-field-inline">
                    <input
                        type="checkbox"
                        className="editor-checkbox"
                        checked={!!field.validation?.required}
                        onChange={(e) => setValidation({ required: e.target.checked })}
                    />
                    Required
                </label>

                <label className="editor-field-inline">
                    <input
                        type="checkbox"
                        className="editor-checkbox"
                        checked={!!field.condition}
                        onChange={(e) => setConditionEnabled(e.target.checked)}
                    />
                    Enable Condition Flow
                </label>

                {field.condition && field.options.map((opt, i) => (
                    <div key={i} className="editor-option-row">
                        <span className="editor-label">{opt} →</span>
                        <select
                            className="editor-select"
                            value={field.condition?.[opt] || ""}
                            onChange={(e) => setCondition(opt, e.target.value)}
                        >
                            <option value="">None</option>
                            {fields.slice(fields.findIndex(f => f.id === field.id) + 1).map(f =>
                                <option key={f.id} value={f.id}>{f.label}</option>
                            )}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}
