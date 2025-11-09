import { FormField, TableField } from "../field-types/formTypes";

export function validateForm(title: string, fields: FormField[]): string[] {
    const errors: string[] = [];
    if (!title || !title.trim()) errors.push("Form title cannot be empty.");

    fields.forEach((field, idx) => {
        if (!field.label || !field.label.trim()) {
            errors.push(`Field ${idx + 1} label cannot be empty.`);
        }

        if (field.type === "dropdown") {
            const dd = field;
            if (!dd.options || dd.options.length === 0) {
                errors.push(`Dropdown '${dd.label}' must have at least one option.`);
            } else {
                dd.options.forEach((opt, i) => {
                    if (!opt || !opt.trim()) errors.push(`Dropdown '${dd.label}' option ${i + 1} cannot be empty.`);
                });
            }
        }

        if (field.type === "table") {
            const t = field as TableField;
            if (!t.columns || t.columns.length === 0) {
                errors.push(`Table '${t.label}' must have at least one column.`);
            } else {
                t.columns.forEach((col, i) => {
                    if (!col.label || !col.label.trim()) {
                        errors.push(`Table '${t.label}' column ${i + 1} label cannot be empty.`);
                    }
                    if (col.type === "dropdown") {
                        if (!col.options || col.options.length === 0) {
                            errors.push(`Table '${t.label}' column '${col.label}' must have at least one option.`);
                        } else {
                            col.options.forEach((opt, j) => {
                                if (!opt || !opt.trim()) {
                                    errors.push(`Table '${t.label}' column '${col.label}' option ${j + 1} cannot be empty.`);
                                }
                            });
                        }
                    }
                });
            }

            if (t.mode === "static" && t.rowLabels) {
                t.rowLabels.forEach((rl, i) => {
                    if (!rl || !rl.trim()) errors.push(`Table '${t.label}' row ${i + 1} label cannot be empty.`);
                });
            }
        }
    });

    return errors;
}
