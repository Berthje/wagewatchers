/**
 * Configuration Types
 * Types for application configuration and settings
 */

export interface SubredditConfig {
    country: string;
    currency: string;
    templateSections: string[];
    fieldMappings: Record<string, RegExp>;
}

export interface FormSection {
    title: string;
    description: string;
    fields: string[];
}

export interface CountryFormConfig {
    sections: FormSection[];
}

export interface FieldConfig {
    labelKey: string;
    type:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "boolean"
    | "combobox"
    | "richtext";
    placeholder?: string;
    options?: { value: string; label: string }[];
    allowCustom?: boolean;
    helpKey?: string;
    width?: "full" | "half" | "third";
}

export type FieldConfigs = Record<string, FieldConfig>;
