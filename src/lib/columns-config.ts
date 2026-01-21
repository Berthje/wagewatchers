export interface ColumnOption {
  key: string;
  labelKey: string; // translation key under `dashboard.table` or `dashboard.columns`
}

// Define all available columns keys and translation label keys
export const AVAILABLE_COLUMNS: ColumnOption[] = [
  { key: "location", labelKey: "table.location" },
  { key: "jobTitle", labelKey: "table.jobTitle" },
  { key: "sector", labelKey: "table.sector" },
  { key: "experience", labelKey: "table.experience" },
  { key: "age", labelKey: "table.age" },
  { key: "grossSalary", labelKey: "table.grossSalary" },
  { key: "netSalary", labelKey: "table.netSalary" },
  { key: "submittedOn", labelKey: "table.submittedOn" },
  { key: "education", labelKey: "table.education" },
  { key: "workCity", labelKey: "table.workCity" },
  { key: "netCompensation", labelKey: "table.netCompensation" },
  { key: "teleworkDays", labelKey: "table.teleworkDays" },
  { key: "stressLevel", labelKey: "table.stressLevel" },
];

// Default selected columns (match current default table)
export const DEFAULT_SELECTED_COLUMNS: string[] = [
  "location",
  "jobTitle",
  "sector",
  "experience",
  "age",
  "grossSalary",
  "netSalary",
  "submittedOn",
];

export const MAX_VISIBLE_COLUMNS = 10;
