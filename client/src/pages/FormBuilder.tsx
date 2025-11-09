import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import SortableItem from "../components/SortableItem";
import TextFieldEditor from "../field-types/TextFieldEditor";
import DropdownFieldEditor from "../field-types/DropdownFieldEditor";
import TableFieldEditor from "../field-types/TableFieldEditor";
import "../styles/FormBuilder.css";
import "../styles/EditorStyles.css";

import { FormSchema, FormField } from "../field-types/formTypes";
import { createField } from "../utils/createField";
import { updateFieldList } from "../utils/updateField";
import { reorder } from "../utils/reorder";
import { validateForm } from "../utils/validation";

type Props = {
    onSave: (form: FormSchema) => void;
    initialForm?: FormSchema;
};

/**
 * FormBuilder component for creating and editing forms.
 * @param {Function} onSave - Callback function to save the form.
 * @param {FormSchema} [initialForm] - The initial form schema to populate the builder.
 * @returns {JSX.Element} The rendered FormBuilder component.
 */
export function FormBuilder({ onSave, initialForm }: Props) {
    // State for the form title.
    const [title, setTitle] = useState(initialForm?.title || "");
    // State for the list of form fields.
    const [fields, setFields] = useState<FormField[]>(initialForm?.fields || []);

    // Updates the title and fields when the initial form changes.
    useEffect(() => {
        if (initialForm) {
            setTitle(initialForm.title || "");
            setFields(initialForm.fields || []);
        }
    }, [initialForm]);

    // Configures sensors for drag-and-drop functionality.
    const sensors = useSensors(useSensor(PointerSensor));

    /**
     * Adds a new field to the form.
     * @param {FormField["type"]} type - The type of field to add.
     */
    const addField = useCallback((type: FormField["type"]) => {
        setFields(prev => [...prev, createField(type)]);
    }, []);

    /**
     * Removes a field from the form.
     * @param {string} id - The ID of the field to remove.
     */
    const removeField = useCallback((id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
    }, []);

    /**
     * Updates a field in the form.
     * @param {string} id - The ID of the field to update.
     * @param {Partial<FormField>} changes - The changes to apply to the field.
     */
    const updateField = useCallback((id: string, changes: Partial<FormField>) => {
        setFields(prev => updateFieldList(prev, id, changes));
    }, []);

    /**
     * Handles drag-and-drop reordering of fields.
     * @param {any} event - The drag event.
     */
    const handleFieldDragEnd = useCallback((event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = fields.findIndex(f => f.id === active.id);
        const newIndex = fields.findIndex(f => f.id === over.id);
        setFields(prev => reorder(prev, oldIndex, newIndex));
    }, [fields]);

    // Validates the form and returns a list of errors.
    const errors = useMemo(() => validateForm(title, fields), [title, fields]);

    // Checks if the form is valid.
    const isFormValid = useMemo(() => fields.length > 0 && fields.every(f => f.type !== "table" || (f.type === "table" && f.columns.length > 0)), [fields]);

    // Collects IDs of fields that are jump targets.
    const jumpTargetIds = useMemo(() => {
        const ids = new Set<string>();
        fields.forEach(f => {
            if (f.type === "dropdown" && f.condition) {
                Object.values(f.condition).forEach(v => { if (v) ids.add(v); });
            }
        });
        return ids;
    }, [fields]);

    /**
     * Saves the form if there are no validation errors.
     */
    const handleSave = useCallback(() => {
        if (errors.length > 0) {
            alert("Please fix errors:\n" + errors.join("\n"));
            return;
        }
        onSave({ title, fields });
    }, [errors, onSave, title, fields]);

    return (
        <div className="fb-wrap">
            <div className="fb-card">
                <input className="fb-title" placeholder="Form title" value={title} onChange={e => setTitle(e.target.value)} />

                <div className="fb-toolbar">
                    <button className="fb-btn" onClick={() => addField("text")}>Add Text</button>
                    <button className="fb-btn" onClick={() => addField("dropdown")}>Add Dropdown</button>
                    <button className="fb-btn" onClick={() => addField("table")}>Add Table</button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
                    <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="fb-list">
                            {fields.map(field => (
                                <SortableItem key={field.id} id={field.id}>
                                    {/* Render field editors based on field type */}
                                    {field.type === "text" && (
                                        <TextFieldEditor field={field} updateField={(id, ch) => updateField(id, ch)} removeField={removeField} />
                                    )}
                                    {field.type === "dropdown" && (
                                        <DropdownFieldEditor field={field} updateField={(id, ch) => updateField(id, ch)} removeField={removeField} fields={fields} />
                                    )}
                                    {field.type === "table" && (
                                        <TableFieldEditor
                                            field={field}
                                            updateField={updateField}
                                            removeField={removeField}
                                            fields={fields}
                                        />
                                    )}
                                    {jumpTargetIds.has(field.id) && <div className="fb-jump-hint">Jump target</div>}
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="fb-footer">
                    <div className="fb-errors">
                        {errors.slice(0, 3).map((e, i) => <div key={i} className="fb-error">{e}</div>)}
                        {errors.length > 3 && <div className="fb-error">and {errors.length - 3} more...</div>}
                    </div>

                    <div>
                        <button className="fb-save" onClick={handleSave} disabled={!isFormValid || errors.length > 0}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
