import React, { useState, useEffect } from "react";
import { FormSchema, FormField } from "./formTypes";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, children, handle }: { id: string, children: React.ReactNode, handle: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
            <div style={{ cursor: "grab", display: "inline-block" }} {...attributes} {...listeners}>
                {handle}
            </div>
            <div>
                {children}
            </div>
        </div>
    );
}

export function FormBuilder({ onSave, initialForm }: { onSave: (form: FormSchema) => void, initialForm?: FormSchema }) {
    const [title, setTitle] = useState(initialForm?.title || "");
    const [fields, setFields] = useState<FormField[]>(initialForm?.fields || []);

    useEffect(() => {
        if (initialForm) {
            setTitle(initialForm.title || "");
            setFields(initialForm.fields || []);
        }
    }, [initialForm]);

    function addField(type: "text" | "dropdown" | "table") {
        if (type === "text") {
            setFields([...fields, { id: Date.now().toString(), type, label: "Untitled", validation: {} }]);
        } else if (type === "dropdown") {
            setFields([...fields, { id: Date.now().toString(), type, label: "Untitled", options: ["Option 1"], validation: {} }]);
        } else if (type === "table") {
            setFields([...fields, {
                id: Date.now().toString(),
                type,
                label: "Untitled Table",
                columns: [],
                mode: "dynamic",
                rowLabels: undefined
            }]);
        }
    }

    function removeField(id: string) {
        setFields(fields.filter(f => f.id !== id));
    }

    function updateField(id: string, changes: Partial<FormField>) {
        setFields(fields.map(f => {
            if (f.id !== id) return f;
            if (f.type === "text") {
                return { ...f, ...(changes as Partial<typeof f>) };
            }
            if (f.type === "dropdown") {
                const allowed: Partial<typeof f> = {};
                if (typeof changes.label === "string") allowed.label = changes.label;
                if (Array.isArray((changes as any).options)) allowed.options = (changes as any).options;
                if (typeof (changes as any).validation === "object") allowed.validation = (changes as any).validation;
                if (typeof (changes as any).condition === "object" || typeof (changes as any).condition === "undefined") allowed.condition = (changes as any).condition;
                return { ...f, ...allowed };
            }
            if (f.type === "table") {
                const allowed: Partial<typeof f> = {};
                if (typeof changes.label === "string") allowed.label = changes.label;
                if (Array.isArray((changes as any).columns)) allowed.columns = (changes as any).columns;
                if (typeof (changes as any).mode === "string") allowed.mode = (changes as any).mode;
                if (Array.isArray((changes as any).rowLabels)) allowed.rowLabels = (changes as any).rowLabels;
                return { ...f, ...allowed };
            }
            return f;
        }));
    }

    // Drag-and-drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
    );

    // Handle drag end for fields
    function handleFieldDragEnd(event: any) {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex(f => f.id === active.id);
            const newIndex = fields.findIndex(f => f.id === over.id);
            setFields(arrayMove(fields, oldIndex, newIndex));
        }
    }

    // Handle drag end for table columns
    function handleColumnDragEnd(fieldId: string, columns: any[], event: any) {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = columns.findIndex(c => c.id === active.id);
            const newIndex = columns.findIndex(c => c.id === over.id);
            const newColumns = arrayMove(columns, oldIndex, newIndex);
            updateField(fieldId, { columns: newColumns });
        }
    }

    const isFormValid = fields.length > 0 && fields.every(f => f.type !== "table" || (f.columns && f.columns.length > 0));

    // Enhanced validation for form builder
    const builderErrors: string[] = [];
    if (!title.trim()) builderErrors.push("Form title cannot be empty.");
    fields.forEach((field, idx) => {
        if (!field.label || !field.label.trim()) builderErrors.push(`Field ${idx + 1} label cannot be empty.`);
        if (field.type === "dropdown") {
            if (!field.options || field.options.length === 0) builderErrors.push(`Dropdown field '${field.label}' must have at least one option.`);
            field.options.forEach((opt: string, i: number) => {
                if (!opt || !opt.trim()) builderErrors.push(`Dropdown field '${field.label}' option ${i + 1} cannot be empty.`);
            });
        }
        if (field.type === "table") {
            if (!field.columns || field.columns.length === 0) builderErrors.push(`Table field '${field.label}' must have at least one column.`);
            field.columns.forEach((col: any, i: number) => {
                if (!col.label || !col.label.trim()) builderErrors.push(`Table field '${field.label}' column ${i + 1} label cannot be empty.`);
                if (col.type === "dropdown" && col.options) {
                    if (col.options.length === 0) builderErrors.push(`Table field '${field.label}' column '${col.label}' must have at least one option.`);
                    col.options.forEach((opt: string, j: number) => {
                        if (!opt || !opt.trim()) builderErrors.push(`Table field '${field.label}' column '${col.label}' option ${j + 1} cannot be empty.`);
                    });
                }
            });
            if (field.mode === "static" && field.rowLabels) {
                field.rowLabels.forEach((rowLabel: string, i: number) => {
                    if (!rowLabel || !rowLabel.trim()) builderErrors.push(`Table field '${field.label}' row ${i + 1} label cannot be empty.`);
                });
            }
        }
    });

    async function handleSave() {
        if (builderErrors.length > 0) {
            alert("Please fix the following errors before saving:\n" + builderErrors.join("\n"));
            return;
        }
        onSave({ title, fields });
    }

    // Mark jump targets in builder
    function getJumpTargetIds() {
        const ids = new Set<string>();
        fields.forEach(f => {
            if (f.type === "dropdown" && f.condition) {
                Object.values(f.condition).forEach(id => {
                    if (id) ids.add(id);
                });
            }
        });
        return ids;
    }
    const jumpTargetIds = getJumpTargetIds();

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", background: "#f8f8fa", borderRadius: 16, boxShadow: "0 4px 24px #0001", padding: 32 }}>
            <input
                style={{ fontSize: 24, fontWeight: 600, border: "none", background: "transparent", width: "100%", marginBottom: 24 }}
                placeholder="Form Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <button onClick={() => addField("text")}>Add Text</button>
                <button onClick={() => addField("dropdown")}>Add Dropdown</button>
                <button onClick={() => addField("table")}>Add Table</button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field) => (
                        <SortableItem key={field.id} id={field.id} handle={<span style={{marginRight:8}}>☰</span>}>
                            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 16, marginBottom: 16 }}>
                                <span>{field.type.toUpperCase()} - {field.label}
                                    {jumpTargetIds.has(field.id) && (
                                        <span style={{ color: '#3b82f6', fontWeight: 600, marginLeft: 12, fontSize: 13 }}>[Jump Target]</span>
                                    )}
                                </span>
                                <button onClick={() => removeField(field.id)} style={{ float: "right" }}>Delete</button>
                                <div style={{ marginTop: 16 }}>
                                    {/* Editable properties for each field type */}
                                    {field.type === "text" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <label>
                                                Label:
                                                <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} />
                                            </label>
                                            <label>
                                                Required:
                                                <input type="checkbox" checked={field.validation?.required || false} onChange={e => updateField(field.id, { validation: { ...field.validation, required: e.target.checked } })} />
                                            </label>
                                            <label>
                                                Min Length:
                                                <input type="number" value={field.validation?.minLength || ""} min={0} onChange={e => updateField(field.id, { validation: { ...field.validation, minLength: e.target.value ? parseInt(e.target.value) : undefined } })} />
                                            </label>
                                            <label>
                                                Max Length:
                                                <input type="number" value={field.validation?.maxLength || ""} min={0} onChange={e => updateField(field.id, { validation: { ...field.validation, maxLength: e.target.value ? parseInt(e.target.value) : undefined } })} />
                                            </label>
                                        </div>
                                    )}
                                    {field.type === "dropdown" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <label>
                                                Label:
                                                <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} />
                                            </label>
                                            <label>
                                                Required:
                                                <input type="checkbox" checked={field.validation?.required || false} onChange={e => updateField(field.id, { validation: { ...field.validation, required: e.target.checked } })} />
                                            </label>
                                            <div>
                                                Options:
                                                {field.options.map((opt, i) => (
                                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                        <input value={opt} onChange={e => {
                                                            const newOptions = [...field.options];
                                                            newOptions[i] = e.target.value;
                                                            updateField(field.id, { options: newOptions });
                                                        }} />
                                                        <button onClick={() => {
                                                            const newOptions = field.options.filter((_, idx) => idx !== i);
                                                            updateField(field.id, { options: newOptions });
                                                        }}>Remove</button>
                                                    </div>
                                                ))}
                                                <button onClick={() => updateField(field.id, { options: [...field.options, ""] })}>Add Option</button>
                                            </div>
                                            <label>
                                                Enable Condition Flow:
                                                <input type="checkbox"
                                                    checked={!!field.condition}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            updateField(field.id, { condition: {} });
                                                        } else {
                                                            updateField(field.id, { condition: undefined });
                                                        }
                                                    }} />
                                            </label>
                                            {field.condition && field.options.map((opt, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span>{opt} jumps to:</span>
                                                    <select
                                                        value={field.condition?.[opt] || ""}
                                                        onChange={e => {
                                                            const newCond = { ...field.condition, [opt]: e.target.value };
                                                            updateField(field.id, { condition: newCond });
                                                        }}>
                                                        <option value="">None</option>
                                                        {/* Only show questions after this dropdown */}
                                                        {fields.slice(fields.findIndex(f => f.id === field.id) + 1).map(q =>
                                                            <option key={q.id} value={q.id}>{q.label}</option>
                                                        )}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {field.type === "table" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <label>
                                                Label:
                                                <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} />
                                            </label>
                                            <div>
                                                Table Mode:
                                                <label style={{ marginLeft: 8 }}>
                                                    <input
                                                        type="radio"
                                                        checked={field.mode === "static"}
                                                        onChange={() => updateField(field.id, { mode: "static", rowLabels: field.rowLabels || ["Row 1"] })}
                                                    /> Static
                                                </label>
                                                <label style={{ marginLeft: 16 }}>
                                                    <input
                                                        type="radio"
                                                        checked={field.mode === "dynamic"}
                                                        onChange={() => updateField(field.id, { mode: "dynamic", rowLabels: undefined })}
                                                    /> Dynamic
                                                </label>
                                            </div>
                                            <div>
                                                Columns:
                                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleColumnDragEnd(field.id, field.columns, event)}>
                                                    <SortableContext items={field.columns.map(col => col.id)} strategy={verticalListSortingStrategy}>
                                                        {field.columns.map((col, colIdx) => (
                                                            <SortableItem key={col.id} id={col.id} handle={<span style={{marginRight:8}}>☰</span>}>
                                                                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, marginBottom: 8 }}>
                                                                    <label>
                                                                        Label:
                                                                        <input value={col.label} onChange={e => {
                                                                            const newColumns = [...field.columns];
                                                                            newColumns[colIdx] = { ...col, label: e.target.value };
                                                                            updateField(field.id, { columns: newColumns });
                                                                        }} />
                                                                    </label>
                                                                    <label>
                                                                        Type:
                                                                        <select value={col.type} onChange={e => {
                                                                            const newColumns = [...field.columns];
                                                                            newColumns[colIdx] = { ...col, type: e.target.value as "text" | "dropdown" };
                                                                            updateField(field.id, { columns: newColumns });
                                                                        }}>
                                                                            <option value="text">Text</option>
                                                                            <option value="dropdown">Dropdown</option>
                                                                        </select>
                                                                    </label>
                                                                    {col.type === "dropdown" && (
                                                                        <div>
                                                                            Options:
                                                                            {(col.options || []).map((opt: string, i: number) => (
                                                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                                    <input value={opt} onChange={e => {
                                                                                        const newColumns = [...field.columns];
                                                                                        const newOptions = [...(col.options || [])];
                                                                                        newOptions[i] = e.target.value;
                                                                                        newColumns[colIdx] = { ...col, options: newOptions };
                                                                                        updateField(field.id, { columns: newColumns });
                                                                                    }} />
                                                                                    <button onClick={() => {
                                                                                        const newColumns = [...field.columns];
                                                                                        const newOptions = (col.options || []).filter((_: string, idx: number) => idx !== i);
                                                                                        newColumns[colIdx] = { ...col, options: newOptions };
                                                                                        updateField(field.id, { columns: newColumns });
                                                                                    }}>Remove</button>
                                                                                </div>
                                                                            ))}
                                                                            <button onClick={() => {
                                                                                const newColumns = [...field.columns];
                                                                                newColumns[colIdx] = { ...col, options: [...(col.options || []), ""] };
                                                                                updateField(field.id, { columns: newColumns });
                                                                            }}>Add Option</button>
                                                                        </div>
                                                                    )}
                                                                    <label>
                                                                        Required:
                                                                        <input type="checkbox" checked={col.validation?.required || false} onChange={e => {
                                                                            const newColumns = [...field.columns];
                                                                            newColumns[colIdx] = { ...col, validation: { ...col.validation, required: e.target.checked } };
                                                                            updateField(field.id, { columns: newColumns });
                                                                        }} />
                                                                    </label>
                                                                    {col.type === "text" && (
                                                                        <>
                                                                            <label>
                                                                                Min Length:
                                                                                <input type="number" value={col.validation?.minLength || ""} min={0} onChange={e => {
                                                                                    const newColumns = [...field.columns];
                                                                                    newColumns[colIdx] = { ...col, validation: { ...col.validation, minLength: e.target.value ? parseInt(e.target.value) : undefined } };
                                                                                    updateField(field.id, { columns: newColumns });
                                                                                }} />
                                                                            </label>
                                                                            <label>
                                                                                Max Length:
                                                                                <input type="number" value={col.validation?.maxLength || ""} min={0} onChange={e => {
                                                                                    const newColumns = [...field.columns];
                                                                                    newColumns[colIdx] = { ...col, validation: { ...col.validation, maxLength: e.target.value ? parseInt(e.target.value) : undefined } };
                                                                                    updateField(field.id, { columns: newColumns });
                                                                                }} />
                                                                            </label>
                                                                        </>
                                                                    )}
                                                                    <button onClick={() => {
                                                                        const newColumns = field.columns.filter((_, idx) => idx !== colIdx);
                                                                        updateField(field.id, { columns: newColumns });
                                                                    }}>Remove Column</button>
                                                                </div>
                                                            </SortableItem>
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                                <button onClick={() => updateField(field.id, { columns: [...field.columns, { id: Date.now().toString(), type: "text", label: "Column", validation: {} }] })}>Add Column</button>
                                            </div>
                                            {/* Static table row labels */}
                                            {field.mode === "static" && (
                                                <div style={{ marginTop: 12 }}>
                                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Rows:</div>
                                                    {(field.rowLabels || []).map((rowLabel, idx) => (
                                                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                            <input
                                                                value={rowLabel}
                                                                onChange={e => {
                                                                    const newLabels = [...(field.rowLabels || [])];
                                                                    newLabels[idx] = e.target.value;
                                                                    updateField(field.id, { rowLabels: newLabels });
                                                                }}
                                                                placeholder={`Row ${idx + 1}`}
                                                                style={{ flex: 1 }}
                                                            />
                                                            <button onClick={() => {
                                                                const newLabels = (field.rowLabels || []).filter((_, i) => i !== idx);
                                                                updateField(field.id, { rowLabels: newLabels });
                                                            }}>Remove</button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => updateField(field.id, { rowLabels: [...(field.rowLabels || []), `Row ${((field.rowLabels || []).length + 1)}`] })}>Add Row</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>
            <button style={{ marginTop: 24 }} onClick={handleSave} disabled={!isFormValid}>Save Form</button>
        </div>
    );
}
