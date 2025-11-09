import React, { useCallback } from "react";
import { TableColumn } from "./formTypes";

type Props = {
    col: TableColumn;
    colIndex: number;
    updateColumn: (idx: number, newCol: TableColumn) => void;
    removeColumn: (idx: number) => void;
};

/**
 * TableColumnEditor component for editing individual columns in a table field.
 * @param {TableColumn} col - The column data being edited.
 * @param {number} colIndex - The index of the column in the table.
 * @param {Function} updateColumn - Function to update the column with new data.
 * @param {Function} removeColumn - Function to remove the column from the table.
 * @returns {JSX.Element} The rendered TableColumnEditor component.
 */
export default function TableColumnEditor({ col, colIndex, updateColumn, removeColumn }: Props) {
    // Updates the label of the column.
    const setLabel = useCallback(
        (label: string) => updateColumn(colIndex, { ...col, label }),
        [col, colIndex, updateColumn]
    );

    // Updates the type of the column.
    const setType = useCallback(
        (type: TableColumn["type"]) => updateColumn(colIndex, { ...col, type }),
        [col, colIndex, updateColumn]
    );

    // Updates the validation settings of the column.
    const setValidation = useCallback(
        (changes: Partial<TableColumn["validation"]>) => updateColumn(colIndex, { ...col, validation: { ...col.validation, ...changes } }),
        [col, colIndex, updateColumn]
    );

    // Updates a specific option in the column's dropdown options.
    const setOption = (i: number, value: string) => {
        const options = [...(col.options || [])];
        options[i] = value;
        updateColumn(colIndex, { ...col, options });
    };

    // Adds a new option to the column's dropdown options.
    const addOption = () => updateColumn(colIndex, { ...col, options: [...(col.options || []), `Option ${(col.options?.length || 0) + 1}`] });

    // Removes an option from the column's dropdown options.
    const removeOption = (i: number) => {
        const options = (col.options || []).filter((_, idx) => idx !== i);
        updateColumn(colIndex, { ...col, options });
    };

    return (
        <div className="editor-block editor-nested">
            <div className="editor-header">
                <div className="editor-type">COLUMN</div>
                <button className="editor-delete" onClick={() => removeColumn(colIndex)}>Remove</button>
            </div>

            <label className="editor-field">
                <span className="editor-label">Label</span>
                <input
                    className="editor-input"
                    value={col.label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Column label"
                />
            </label>

            <label className="editor-field">
                <span className="editor-label">Type</span>
                <select className="editor-select" value={col.type} onChange={(e) => setType(e.target.value as TableColumn["type"])}>
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                </select>
            </label>

            {col.type === "dropdown" && (
                <div className="editor-section">
                    <div className="editor-section-title">Options</div>
                    {(col.options || []).map((opt, i) => (
                        <div key={i} className="editor-option-row">
                            <input
                                className="editor-input"
                                value={opt}
                                onChange={(e) => setOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                            />
                            {(col.options?.length || 0) > 1 && (
                                <button className="editor-small-button" onClick={() => removeOption(i)}>Remove</button>
                            )}
                        </div>
                    ))}
                    <button className="editor-small-button editor-add" onClick={addOption}>Add Option</button>
                </div>
            )}

            <div className="editor-section">
                <label className="editor-field-inline">
                    <input
                        type="checkbox"
                        className="editor-checkbox"
                        checked={!!col.validation?.required}
                        onChange={(e) => setValidation({ required: e.target.checked })}
                    />
                    Required
                </label>

                {col.type === "text" && (
                    <>
                        <label className="editor-field">
                            <span className="editor-label">Min Length</span>
                            <input
                                type="number"
                                className="editor-input"
                                value={col.validation?.minLength ?? ""}
                                min={0}
                                onChange={(e) => setValidation({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                            />
                        </label>

                        <label className="editor-field">
                            <span className="editor-label">Max Length</span>
                            <input
                                type="number"
                                className="editor-input"
                                value={col.validation?.maxLength ?? ""}
                                min={0}
                                onChange={(e) => setValidation({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                            />
                        </label>
                    </>
                )}
            </div>
        </div>
    );
}
