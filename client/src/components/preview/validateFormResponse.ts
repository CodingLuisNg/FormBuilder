import { FormSchema } from "../../field-types/formTypes";

/**
 * Validates form response values against the form schema and visible field IDs.
 * @param {any} values - The current form values.
 * @param {FormSchema} form - The form schema.
 * @param {string[]} visibleFieldIds - The IDs of fields currently visible.
 * @returns {string[]} An array of validation error messages.
 */
export function validateFormResponse(values: any, form: FormSchema, visibleFieldIds: string[]): string[] {
  const errors: string[] = [];
  const visibleIdsSet = new Set(visibleFieldIds);
  let jumpTargetId: string | null = null;

  for (let i = 0; i < form.fields.length; i++) {
    const field = form.fields[i];
    if (field.type === "dropdown" && field.condition) {
      if (values[field.id]) {
        const targetId = field.condition[values[field.id]];
        if (targetId) jumpTargetId = targetId;
      }
      break;
    }
  }

  form.fields.forEach(field => {
    if (!visibleIdsSet.has(field.id)) return;
    const value = values[field.id];
    if (field.type === "text") {
      let required = field.validation?.required;
      if (jumpTargetId && field.id !== jumpTargetId && visibleIdsSet.has(jumpTargetId)) required = false;
      if (required && !value?.trim()) errors.push(`${field.label} is required.`);
      if (field.validation?.minLength && value?.length < field.validation.minLength) errors.push(`${field.label} must be at least ${field.validation.minLength} characters.`);
      if (field.validation?.maxLength && value?.length > field.validation.maxLength) errors.push(`${field.label} must be at most ${field.validation.maxLength} characters.`);
    }
    if (field.type === "dropdown") {
      let required = field.validation?.required;
      if (jumpTargetId && field.id !== jumpTargetId && visibleIdsSet.has(jumpTargetId)) required = false;
      if (required && !value) errors.push(`${field.label} is required.`);
      if (value && field.options && !field.options.includes(value)) errors.push(`${field.label} value is not valid.`);
    }
    if (field.type === "table" && Array.isArray(value)) {
      value.forEach((row: any, rowIdx: number) => {
        field.columns.forEach(col => {
          let colRequired = col.validation?.required;
          if (jumpTargetId && field.id !== jumpTargetId && visibleIdsSet.has(jumpTargetId)) colRequired = false;
          const cell = row[col.id];
          if (col.type === "text" && colRequired && !cell?.trim()) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} is required.`);
          if (col.type === "text" && col.validation?.minLength && cell?.length < col.validation.minLength) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} must be at least ${col.validation.minLength} characters.`);
          if (col.type === "text" && col.validation?.maxLength && cell?.length > col.validation.maxLength) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} must be at most ${col.validation.maxLength} characters.`);
          if (col.type === "dropdown" && colRequired && !cell) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} is required.`);
          if (cell && col.options && !col.options.includes(cell)) errors.push(`${col.label} in ${field.label} row ${rowIdx + 1} value is not valid.`);
        });
      });
    }
  });
  return errors;
}

