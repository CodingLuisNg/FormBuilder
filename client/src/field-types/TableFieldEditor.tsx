import React, { useCallback } from "react";
import { TableField, FormField, TableColumn } from "./formTypes";
import TableColumnEditor from "./TableColumnEditor";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { reorder } from "../utils/reorder";

type Props = {
    field: TableField;
    updateField: (id: string, changes: Partial<TableField>) => void;
    removeField: (id: string) => void;
    fields: FormField[];
};

/**
 * TableFieldEditor component for editing table fields in a form.
 * @param {TableField} field - The table field being edited.
 * @param {Function} updateField - Function to update the table field with changes.
 * @param {Function} removeField - Function to remove the table field.
 * @param {FormField[]} fields - List of all fields in the form.
 * @returns {JSX.Element} The rendered TableFieldEditor component.
 */
export default function TableFieldEditor({ field, updateField, removeField}: Props) {
    // Updates the label of the table field.
    const setLabel = useCallback(
        (label: string) => updateField(field.id, { label }),
        [field.id, updateField]
    );

    // Updates the mode of the table field (static or dynamic).
    const setMode = useCallback(
        (mode: TableField["mode"]) =>
            updateField(field.id, {
                mode,
                rowLabels: mode === "static" ? field.rowLabels ?? ["Row 1"] : undefined,
            }),
        [field, updateField]
    );

    // Adds a new column to the table field.
    const addColumn = () => {
        const col: TableColumn = {
            id: Date.now().toString(),
            type: "text",
            label: "Column",
            validation: {},
        };
        updateField(field.id, { columns: [...field.columns, col] });
    };

    // Updates a specific column in the table field.
    const updateColumn = (idx: number, newCol: any) => {
        const cols = [...field.columns];
        cols[idx] = newCol;
        updateField(field.id, { columns: cols });
    };

    // Removes a specific column from the table field.
    const removeColumn = (idx: number) => {
        const cols = field.columns.filter((_, i) => i !== idx);
        updateField(field.id, { columns: cols });
    };

    // Handles the drag-and-drop reordering of columns.
    const handleColumnDragEnd = (event: any) => {
        if (!event.over) return;
        const oldIndex = field.columns.findIndex(c => c.id === event.active.id);
        const newIndex = field.columns.findIndex(c => c.id === event.over.id);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
        updateField(field.id, { columns: reorder(field.columns, oldIndex, newIndex) });
    };

    // Adds a new row label to the table field (static mode only).
    const addRowLabel = () =>
        updateField(field.id, { rowLabels: [...(field.rowLabels || []), `Row ${(field.rowLabels?.length || 0) + 1}`] });

    // Updates a specific row label in the table field (static mode only).
    const updateRowLabel = (idx: number, value: string) => {
        const labels = [...(field.rowLabels || [])];
        labels[idx] = value;
        updateField(field.id, { rowLabels: labels });
    };

    // Removes a specific row label from the table field (static mode only).
    const removeRowLabel = (idx: number) =>
        updateField(field.id, { rowLabels: (field.rowLabels || []).filter((_, i) => i !== idx) });

    // Configures sensors for drag-and-drop functionality.
    const sensors = useSensors(useSensor(PointerSensor));

    return (
        <div className="editor-block">
            <div className="editor-header">
                <div className="editor-type">TABLE</div>
                <button className="editor-delete" onClick={() => removeField(field.id)}>Delete</button>
            </div>

            <label className="editor-field">
                <span className="editor-label">Label</span>
                <input className="editor-input" value={field.label} onChange={(e) => setLabel(e.target.value)} />
            </label>

            <div className="editor-section">
                <div className="editor-section-title">Mode</div>
                <label className="editor-field-inline">
                    <input type="radio" checked={field.mode === "static"} onChange={() => setMode("static")} />
                    Static
                </label>
                <label className="editor-field-inline">
                    <input type="radio" checked={field.mode === "dynamic"} onChange={() => setMode("dynamic")} />
                    Dynamic
                </label>
            </div>

            <div className="editor-section">
                <div className="editor-section-title">Columns</div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                    <SortableContext items={field.columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="editor-columns">
                            {field.columns.map((col, i) => (
                                <div key={col.id} className="editor-column-wrap">
                                    <TableColumnEditor col={col} colIndex={i} updateColumn={updateColumn} removeColumn={removeColumn} />
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <button className="editor-small-button editor-add" onClick={addColumn}>Add Column</button>
            </div>

            {field.mode === "static" && (
                <div className="editor-section">
                    <div className="editor-section-title">Rows</div>
                    {(field.rowLabels || []).map((rl, i) => (
                        <div key={i} className="editor-option-row">
                            <input
                                className="editor-input"
                                value={rl}
                                onChange={(e) => updateRowLabel(i, e.target.value)}
                                placeholder={`Row ${i + 1}`}
                            />
                            {(field.rowLabels?.length || 0) > 1 && (
                                <button className="editor-small-button" onClick={() => removeRowLabel(i)}>Remove</button>
                            )}
                        </div>
                    ))}
                    <button className="editor-small-button editor-add" onClick={addRowLabel}>Add Row</button>
                </div>
            )}
        </div>
    );
}
