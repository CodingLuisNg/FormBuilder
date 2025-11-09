export const validateResponse = (form: any, data: any) => {
    const errors: string[] = [];
    form.fields.forEach((field: any) => {
        const value = data[field.id];
        if (!field.label?.trim()) errors.push(`Field label missing for ${field.id}`);
        if (field.type === "text") {
            if (field.validation?.required && !value?.trim()) errors.push(`${field.label} is required.`);
            if (field.validation?.minLength && value?.length < field.validation.minLength) errors.push(`${field.label} must be at least ${field.validation.minLength} characters.`);
            if (field.validation?.maxLength && value?.length > field.validation.maxLength) errors.push(`${field.label} must be at most ${field.validation.maxLength} characters.`);
        }
        if (field.type === "dropdown") {
            if (field.validation?.required && !value) errors.push(`${field.label} is required.`);
            if (value && field.options && !field.options.includes(value)) errors.push(`${field.label} value is not valid.`);
        }
        if (field.type === "table" && Array.isArray(value)) {
            value.forEach((row: any) => {
                field.columns.forEach((col: any) => {
                    const cell = row[col.id];
                    if (col.type === "text" && col.validation?.required && !cell?.trim()) errors.push(`${col.label} in ${field.label} is required.`);
                    if (col.type === "dropdown" && col.validation?.required && !cell) errors.push(`${col.label} in ${field.label} is required.`);
                    if (cell && col.options && !col.options.includes(cell)) errors.push(`${col.label} in ${field.label} value is not valid.`);
                });
            });
        }
    });
    return errors;
};
