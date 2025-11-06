export type TextField = {
    id: string;
    type: "text";
    label: string;
    validation?: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
    };
};

export type DropdownField = {
    id: string;
    type: "dropdown";
    label: string;
    options: string[];
    validation?: {
        required?: boolean;
    };
    condition?: { [option: string]: string }; // option -> questionId
};

export type TableColumn = {
    id: string;
    type: "text" | "dropdown";
    label: string;
    options?: string[];
    validation?: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
    };
};

export type TableField = {
    id: string;
    type: "table";
    label: string;
    columns: TableColumn[];
    mode: "static" | "dynamic";
    rowLabels?: string[]; // Only for static tables
};

export type FormField =
    | TextField
    | DropdownField
    | TableField;

export type FormSchema = {
    id?: string;
    title: string;
    fields: FormField[];
};
