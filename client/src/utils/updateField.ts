import { FormField } from "../field-types/formTypes";

export function updateFieldList(
    fields: FormField[],
    id: string,
    changes: Partial<FormField>
): FormField[] {
    return fields.map((f) =>
        f.id === id ? ({ ...f, ...changes } as FormField) : f
    );
}
