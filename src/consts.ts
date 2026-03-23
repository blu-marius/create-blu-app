export const DEFAULT_APP_NAME = "my-blu-app";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: { value: PackageManager; label: string }[] = [
  { value: "pnpm", label: "pnpm" },
  { value: "npm", label: "npm" },
  { value: "yarn", label: "yarn" },
  { value: "bun", label: "bun" },
];

export type Feature =
  | "shadcn"
  | "supabase"
  | "tanstack-query"
  | "react-hook-form"
  | "react-email"
  | "eslint-prettier";

export interface FeatureOption {
  value: Feature;
  label: string;
  hint: string;
}

export const FEATURES: FeatureOption[] = [
  {
    value: "shadcn",
    label: "shadcn/ui (all components)",
    hint: "Beautiful, accessible components",
  },
  {
    value: "supabase",
    label: "Supabase (client + auth)",
    hint: "Database, auth, and storage",
  },
  {
    value: "tanstack-query",
    label: "TanStack Query",
    hint: "Async state management",
  },
  {
    value: "react-hook-form",
    label: "React Hook Form + Zod",
    hint: "Form validation",
  },
  {
    value: "react-email",
    label: "React Email + Resend",
    hint: "Email templates and delivery",
  },
  {
    value: "eslint-prettier",
    label: "ESLint + Prettier",
    hint: "Linting and formatting",
  },
];

export interface ProjectConfig {
  name: string;
  features: Feature[];
  packageManager: PackageManager;
  projectDir: string;
}
