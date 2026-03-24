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
  | "eslint-prettier"
  | "react-compiler";

export interface FeatureOption {
  value: Feature;
  label: string;
  hint: string;
  defaultSelected?: boolean;
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
  {
    value: "react-compiler",
    label: "React Compiler",
    hint: "Automatic memoization (experimental)",
    defaultSelected: false,
  },
];

export interface ProjectConfig {
  name: string;
  features: Feature[];
  packageManager: PackageManager;
  projectDir: string;
  dryRun: boolean;
  noGit: boolean;
}

export const FEATURE_LABELS: Record<Feature, string> = {
  shadcn: "shadcn/ui",
  supabase: "Supabase",
  "tanstack-query": "TanStack Query",
  "react-hook-form": "RHF + Zod",
  "react-email": "React Email + Resend",
  "eslint-prettier": "ESLint + Prettier",
  "react-compiler": "React Compiler",
};

export const FEATURE_DEPS: Record<Feature, { deps: string[]; devDeps: string[] }> = {
  shadcn: { deps: ["shadcn components (via npx shadcn init + add --all)"], devDeps: [] },
  supabase: { deps: ["@supabase/supabase-js", "@supabase/ssr"], devDeps: [] },
  "tanstack-query": { deps: ["@tanstack/react-query", "@tanstack/react-query-devtools"], devDeps: [] },
  "react-hook-form": { deps: ["react-hook-form", "@hookform/resolvers", "zod"], devDeps: [] },
  "react-email": { deps: ["react-email", "@react-email/components", "resend"], devDeps: [] },
  "eslint-prettier": { deps: [], devDeps: ["prettier", "eslint-config-prettier", "prettier-plugin-tailwindcss"] },
  "react-compiler": { deps: [], devDeps: ["babel-plugin-react-compiler"] },
};

export const FEATURE_FILES: Record<Feature, string[]> = {
  shadcn: ["src/components/ui/ (all components)", "components.json"],
  supabase: [
    "src/lib/supabase/client.ts",
    "src/lib/supabase/server.ts",
    "src/lib/supabase/proxy.ts",
    "src/proxy.ts",
    ".env.local.example",
    "src/app/auth/ (login, sign-up, forgot/update password)",
    "src/actions/auth.ts",
    "src/components/logout-button.tsx",
  ],
  "tanstack-query": [
    "src/providers/get-query-client.ts",
    "src/providers/query-provider.tsx",
  ],
  "react-hook-form": ["src/lib/schemas.ts"],
  "react-email": [
    "emails/welcome.tsx",
    "emails/password-reset.tsx",
    "src/actions/send-email.ts",
  ],
  "eslint-prettier": [".prettierrc", "eslint.config.mjs (modified)"],
  "react-compiler": ["next.config.ts (modified)"],
};
