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

function SortableItem({ id, children }: { id: string, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <div
            ref={setNodeRef}
            {...attributes}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
                background: isDragging ? '#f3f6fa' : '#fff',
                border: isDragging ? '2px solid #1a73e8' : '1px solid #e5e7eb',
                borderRadius: 16,
                boxShadow: isDragging ? '0 6px 24px #1a73e820' : '0 2px 8px #0001',
                marginBottom: 32,
                padding: 0,
                minHeight: 72,
                display: 'flex',
                alignItems: 'stretch',
                position: 'relative',
                zIndex: isDragging ? 10 : 1,
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            <div
                {...listeners}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 72,
                    width: 72,
                    height: '100%',
                    background: '#e3f2fd',
                    borderRight: '1px solid #e5e7eb',
                    borderRadius: '16px 0 0 16px',
                    cursor: 'grab',
                    userSelect: 'none',
                    fontSize: 32,
                    color: '#1976d2',
                    fontWeight: 700,
                    transition: 'background 0.2s',
                    flexDirection: 'column',
                    padding: 0,
                }}
                title="Drag to reorder"
            >
                <span style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1}}>
                  <svg width="48" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="10" width="20" height="4" rx="2" fill="#1976d2"/>
                    <rect x="8" y="22" width="20" height="4" rx="2" fill="#1976d2"/>
                    <rect x="8" y="34" width="20" height="4" rx="2" fill="#1976d2"/>
                  </svg>
                </span>
            </div>
            <div style={{ width: '100%', boxSizing: 'border-box', padding: '32px 32px 32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
        <div className="responsive-container" style={{ maxWidth: 700, margin: "40px auto", background: "#f8f8fa", borderRadius: 16, boxShadow: "0 4px 24px #0001", padding: 32 }}>
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
                        <SortableItem key={field.id} id={field.id}>
                          <div className="dnd-box" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, position: 'relative' }}>
                            <button onClick={() => removeField(field.id)} style={{ position: 'absolute', top: 8, right: 8, background: '#f8d7da', color: '#c00', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 14, zIndex: 2 }}>Delete</button>
                            <div style={{ fontWeight: 700, fontSize: 18, color: '#1a73e8', marginBottom: 4, paddingRight: 90 }}>
                              {field.type.toUpperCase()} <span style={{ color: '#222', fontWeight: 600, fontSize: 16, marginLeft: 8 }}>{field.label}</span>
                              {jumpTargetIds.has(field.id) && (
                                <span style={{ color: '#3b82f6', fontWeight: 600, marginLeft: 12, fontSize: 13 }}>[Jump Target]</span>
                              )}
                            </div>
                            {/* Editable properties for each field type, 1 attribute per line */}
                            {field.type === "text" && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Label
                                  <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} style={{ marginTop: 4, fontSize: 15, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>Required
                                  <input type="checkbox" checked={field.validation?.required || false} onChange={e => updateField(field.id, { validation: { ...field.validation, required: e.target.checked } })} style={{ marginLeft: 10 }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Min Length
                                  <input type="number" value={field.validation?.minLength || ""} min={0} onChange={e => updateField(field.id, { validation: { ...field.validation, minLength: e.target.value ? parseInt(e.target.value) : undefined } })} style={{ marginTop: 4, fontSize: 15, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Max Length
                                  <input type="number" value={field.validation?.maxLength || ""} min={0} onChange={e => updateField(field.id, { validation: { ...field.validation, maxLength: e.target.value ? parseInt(e.target.value) : undefined } })} style={{ marginTop: 4, fontSize: 15, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                                </label>
                              </div>
                            )}
                            {field.type === "dropdown" && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 500, width: '100%' }}>Label
                                  <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} style={{ marginTop: 6, fontSize: 16, padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', width: '60%', textAlign: 'center' }} />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, width: '100%' }}>Required
                                  <input type="checkbox" checked={field.validation?.required || false} onChange={e => updateField(field.id, { validation: { ...field.validation, required: e.target.checked } })} style={{ marginLeft: 12 }} />
                                </label>
                                <div style={{ fontWeight: 500, width: '100%', textAlign: 'center' }}>Options</div>
                                {field.options.map((opt, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' }}>
                                    <input value={opt} onChange={e => {
                                      const newOptions = [...field.options];
                                      newOptions[i] = e.target.value;
                                      updateField(field.id, { options: newOptions });
                                    }} style={{ fontSize: 16, padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', width: '40%', textAlign: 'center' }} />
                                    {field.options.length > 1 && (
                                      <button onClick={() => {
                                        const newOptions = field.options.filter((_, idx) => idx !== i);
                                        updateField(field.id, { options: newOptions });
                                      }} style={{ background: '#f8d7da', color: '#c00', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 500, fontSize: 14 }}>Remove</button>
                                    )}
                                  </div>
                                ))}
                                <button onClick={() => {
                                  const nextNum = field.options.length + 1;
                                  const newLabel = `Option ${nextNum}`;
                                  updateField(field.id, { options: [...field.options, newLabel] });
                                }} style={{ background: '#e3f2fd', color: '#1a73e8', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 15, marginTop: 2 }}>Add Option</button>
                                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, marginTop: 6 }}>Enable Condition Flow
                                  <input type="checkbox"
                                    checked={!!field.condition}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        updateField(field.id, { condition: {} });
                                      } else {
                                        updateField(field.id, { condition: undefined });
                                      }
                                    }} style={{ marginLeft: 10 }} />
                                </label>
                                {field.condition && field.options.map((opt, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 14 }}>{opt} jumps to:</span>
                                    <select
                                      value={field.condition?.[opt] || ""}
                                      onChange={e => {
                                        const newCond = { ...field.condition, [opt]: e.target.value };
                                        updateField(field.id, { condition: newCond });
                                      }}
                                      style={{ fontSize: 14, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                                    >
                                      <option value="">None</option>
                                      {fields.slice(fields.findIndex(f => f.id === field.id) + 1).map(q =>
                                        <option key={q.id} value={q.id}>{q.label}</option>
                                      )}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            )}
                            {field.type === "table" && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Label
                                  <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} style={{ marginTop: 4, fontSize: 15, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                                </label>
                                <div style={{ fontWeight: 500 }}>Table Mode</div>
                                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                                  <input
                                    type="radio"
                                    checked={field.mode === "static"}
                                    onChange={() => updateField(field.id, { mode: "static", rowLabels: field.rowLabels || ["Row 1"] })}
                                    style={{ marginRight: 8 }}
                                  /> Static
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                                  <input
                                    type="radio"
                                    checked={field.mode === "dynamic"}
                                    onChange={() => updateField(field.id, { mode: "dynamic", rowLabels: undefined })}
                                    style={{ marginRight: 8 }}
                                  /> Dynamic
                                </label>
                                <div style={{ fontWeight: 500, marginTop: 6 }}>Columns</div>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleColumnDragEnd(field.id, field.columns, event)}>
                                  <SortableContext items={field.columns.map(col => col.id)} strategy={verticalListSortingStrategy}>
                                    {field.columns.map((col, colIdx) => (
                                      <SortableItem key={col.id} id={col.id}>
                                        <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                          <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Label
                                            <input value={col.label} onChange={e => {
                                              const newColumns = [...field.columns];
                                              newColumns[colIdx] = { ...col, label: e.target.value };
                                              updateField(field.id, { columns: newColumns });
                                            }} style={{ marginTop: 4, fontSize: 14, padding: '6px 8px', borderRadius: 5, border: '1px solid #e5e7eb' }} />
                                          </label>
                                          <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Type
                                            <select value={col.type} onChange={e => {
                                              const newColumns = [...field.columns];
                                              newColumns[colIdx] = { ...col, type: e.target.value as "text" | "dropdown" };
                                              updateField(field.id, { columns: newColumns });
                                            }} style={{ marginTop: 4, fontSize: 14, padding: '6px 8px', borderRadius: 5, border: '1px solid #e5e7eb' }}>
                                              <option value="text">Text</option>
                                              <option value="dropdown">Dropdown</option>
                                            </select>
                                          </label>
                                          {col.type === "dropdown" && (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                                              <div style={{ fontWeight: 500, width: '100%', textAlign: 'center' }}>Options</div>
                                              {(col.options || []).map((opt: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' }}>
                                                  <input value={opt} onChange={e => {
                                                    const newColumns = [...field.columns];
                                                    const newOptions = [...(col.options || [])];
                                                    newOptions[i] = e.target.value;
                                                    newColumns[colIdx] = { ...col, options: newOptions };
                                                    updateField(field.id, { columns: newColumns });
                                                  }} style={{ fontSize: 15, padding: '8px 12px', borderRadius: 7, border: '1px solid #e5e7eb', width: '40%', textAlign: 'center' }} />
                                                  {(col.options?.length || 0) > 1 && (
                                                    <button onClick={() => {
                                                      const newColumns = [...field.columns];
                                                      const newOptions = (col.options || []).filter((_: string, idx: number) => idx !== i);
                                                      newColumns[colIdx] = { ...col, options: newOptions };
                                                      updateField(field.id, { columns: newColumns });
                                                    }} style={{ background: '#f8d7da', color: '#c00', border: 'none', borderRadius: 7, padding: '6px 14px', fontWeight: 500, fontSize: 14 }}>Remove</button>
                                                  )}
                                                </div>
                                              ))}
                                              <button onClick={() => {
                                                const nextNum = (col.options?.length || 0) + 1;
                                                const newLabel = `Option ${nextNum}`;
                                                const newColumns = [...field.columns];
                                                newColumns[colIdx] = { ...col, options: [...(col.options || []), newLabel] };
                                                updateField(field.id, { columns: newColumns });
                                              }} style={{ background: '#e3f2fd', color: '#1a73e8', border: 'none', borderRadius: 7, padding: '8px 18px', fontWeight: 500, fontSize: 15, marginTop: 2 }}>Add Option</button>
                                            </div>
                                          )}
                                          <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>Required
                                            <input type="checkbox" checked={col.validation?.required || false} onChange={e => {
                                              const newColumns = [...field.columns];
                                              newColumns[colIdx] = { ...col, validation: { ...col.validation, required: e.target.checked } };
                                              updateField(field.id, { columns: newColumns });
                                            }} style={{ marginLeft: 8 }} />
                                          </label>
                                          {col.type === "text" && (
                                            <>
                                              <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Min Length
                                                <input type="number" value={col.validation?.minLength || ""} min={0} onChange={e => {
                                                  const newColumns = [...field.columns];
                                                  newColumns[colIdx] = { ...col, validation: { ...col.validation, minLength: e.target.value ? parseInt(e.target.value) : undefined } };
                                                  updateField(field.id, { columns: newColumns });
                                                }} style={{ marginTop: 4, fontSize: 13, padding: '6px 8px', borderRadius: 5, border: '1px solid #e5e7eb' }} />
                                              </label>
                                              <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>Max Length
                                                <input type="number" value={col.validation?.maxLength || ""} min={0} onChange={e => {
                                                  const newColumns = [...field.columns];
                                                  newColumns[colIdx] = { ...col, validation: { ...col.validation, maxLength: e.target.value ? parseInt(e.target.value) : undefined } };
                                                  updateField(field.id, { columns: newColumns });
                                                }} style={{ marginTop: 4, fontSize: 13, padding: '6px 8px', borderRadius: 5, border: '1px solid #e5e7eb' }} />
                                              </label>
                                            </>
                                          )}
                                          <button onClick={() => {
                                            const newColumns = field.columns.filter((_, idx) => idx !== colIdx);
                                            updateField(field.id, { columns: newColumns });
                                          }} style={{ background: '#f8d7da', color: '#c00', border: 'none', borderRadius: 5, padding: '4px 10px', fontWeight: 500, fontSize: 12, alignSelf: 'flex-end' }}>Remove Column</button>
                                        </div>
                                      </SortableItem>
                                    ))}
                                  </SortableContext>
                                </DndContext>
                                <button onClick={() => updateField(field.id, { columns: [...field.columns, { id: Date.now().toString(), type: "text", label: "Column", validation: {} }] })} style={{ background: '#e3f2fd', color: '#1a73e8', border: 'none', borderRadius: 5, padding: '6px 14px', fontWeight: 500, fontSize: 13, marginTop: 2, alignSelf: 'flex-start' }}>Add Column</button>
                                {field.mode === "static" && (
                                  <div style={{ marginTop: 8 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Rows:</div>
                                    {(field.rowLabels || []).map((rowLabel, idx) => (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <input
                                          value={rowLabel}
                                          onChange={e => {
                                            const newLabels = [...(field.rowLabels || [])];
                                            newLabels[idx] = e.target.value;
                                            updateField(field.id, { rowLabels: newLabels });
                                          }}
                                          placeholder={`Row ${idx + 1}`}
                                          style={{ flex: 1, fontSize: 13, padding: '6px 8px', borderRadius: 5, border: '1px solid #e5e7eb' }}
                                        />
                                        {(field.rowLabels?.length || 0) > 1 && (
                                          <button onClick={() => {
                                            const newLabels = (field.rowLabels || []).filter((_, i) => i !== idx);
                                            updateField(field.id, { rowLabels: newLabels });
                                          }} style={{ background: '#f8d7da', color: '#c00', border: 'none', borderRadius: 5, padding: '4px 10px', fontWeight: 500, fontSize: 12 }}>Remove</button>
                                        )}
                                      </div>
                                    ))}
                                    <button onClick={() => updateField(field.id, { rowLabels: [...(field.rowLabels || []), `Row ${((field.rowLabels || []).length + 1)}`] })} style={{ background: '#e3f2fd', color: '#1a73e8', border: 'none', borderRadius: 5, padding: '6px 14px', fontWeight: 500, fontSize: 13, marginTop: 2 }}>Add Row</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>
            <button style={{ marginTop: 24 }} onClick={handleSave} disabled={!isFormValid}>Save Form</button>
        </div>
    );
}
