import { FormField } from "../field-types/formTypes";

export function createField(type: FormField["type"]): FormField {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    if (type === "text") {
        return {
            id,
            type,
            label: "Untitled",
            validation: {},
        };
    }
    if (type === "dropdown") {
        return {
            id,
            type,
            label: "Untitled",
            options: ["Option 1"],
            validation: {},
        };
    }
    // table:
    return {
        id,
        type,
        label: "Untitled Table",
        columns: [],
        mode: "dynamic",
        rowLabels: undefined
    };
}
