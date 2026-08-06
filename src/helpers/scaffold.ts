import fs from "node:fs/promises";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import type { ProjectConfig, Feature, PackageManager } from "../consts.js";
import {
  installShadcn,
  installSupabase,
  installTanstackQuery,
  installReactHookForm,
  installReactEmail,
  installEslintPrettier,
  installReactCompiler,
  installAuthPages,
} from "../installers/index.js";
import { SUPABASE_DEPS } from "../installers/supabase.js";
import { TANSTACK_QUERY_DEPS } from "../installers/tanstack-query.js";
import { REACT_HOOK_FORM_DEPS } from "../installers/react-hook-form.js";
import { REACT_EMAIL_DEPS } from "../installers/react-email.js";
import { ESLINT_PRETTIER_DEPS } from "../installers/eslint-prettier.js";
import { REACT_COMPILER_DEPS } from "../installers/react-compiler.js";
import { AUTH_ACTIONS_WITH_EMAIL_TEMPLATE } from "../installers/auth/templates/actions-with-email.js";
import { runCommand } from "./run-command.js";
import { getInstallCommand, getAddCommand } from "./package-manager.js";

const SCHEMAS_TEMPLATE = `import * as z from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
`;

const SUPABASE_HOOKS_TEMPLATE = `"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase) return null;

      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
}
`;

// ---------------------------------------------------------------------------
// Package dependency map — single source of truth for all feature packages.
// When adding a new feature, add its packages here and export them from its
// installer module.
// ---------------------------------------------------------------------------
const FEATURE_DEP_MAP: Record<Feature, { deps: readonly string[]; devDeps: readonly string[] }> = {
  shadcn: { deps: [], devDeps: [] }, // shadcn manages its own deps via npx
  supabase: { deps: SUPABASE_DEPS, devDeps: [] },
  "tanstack-query": { deps: TANSTACK_QUERY_DEPS, devDeps: [] },
  "react-hook-form": { deps: REACT_HOOK_FORM_DEPS, devDeps: [] },
  "react-email": { deps: REACT_EMAIL_DEPS, devDeps: [] },
  "eslint-prettier": { deps: [], devDeps: ESLINT_PRETTIER_DEPS },
  "react-compiler": { deps: [], devDeps: REACT_COMPILER_DEPS },
};

async function installDependencies(projectDir: string, pm: PackageManager) {
  const spinner = ora("Installing dependencies...").start();
  try {
    const [cmd, args] = getInstallCommand(pm);
    await runCommand(cmd, args, { cwd: projectDir });
    spinner.succeed("Dependencies installed");
  } catch (error) {
    spinner.fail("Failed to install dependencies");
    throw error;
  }
}

/** Collect and install all feature packages in a single batch to avoid lockfile contention. */
async function batchInstallFeatureDeps(
  projectDir: string,
  pm: PackageManager,
  features: Feature[]
) {
  const allDeps: string[] = [];
  const allDevDeps: string[] = [];

  for (const feature of features) {
    const pkgs = FEATURE_DEP_MAP[feature];
    if (pkgs) {
      allDeps.push(...pkgs.deps);
      allDevDeps.push(...pkgs.devDeps);
    }
  }

  if (allDeps.length === 0 && allDevDeps.length === 0) return;

  const spinner = ora("Installing feature dependencies...").start();
  try {
    if (allDeps.length > 0) {
      const [cmd, args] = getAddCommand(pm, allDeps, false);
      await runCommand(cmd, args, { cwd: projectDir });
    }
    if (allDevDeps.length > 0) {
      const [cmd, args] = getAddCommand(pm, allDevDeps, true);
      await runCommand(cmd, args, { cwd: projectDir });
    }
    spinner.succeed("Feature dependencies installed");
  } catch (error) {
    spinner.fail("Failed to install feature dependencies");
    throw error;
  }
}

async function updateLayout(projectDir: string, features: string[]) {
  const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");

  if (!(await fs.access(layoutPath).then(() => true, () => false))) return;

  const hasTanstack = features.includes("tanstack-query");
  if (!hasTanstack) return;

  let layout = await fs.readFile(layoutPath, "utf-8");

  // Add import for QueryProvider
  const importLine = `import { QueryProvider } from "@/providers/query-provider";\n`;
  layout = importLine + layout;

  // Wrap {children} with QueryProvider
  layout = layout.replace(
    /(\{children\})/,
    `<QueryProvider>{children}</QueryProvider>`
  );

  await fs.writeFile(layoutPath, layout);
}

async function initGit(projectDir: string) {
  const spinner = ora("Initializing git repository...").start();
  try {
    await runCommand("git", ["init"], { cwd: projectDir });
    await runCommand("git", ["add", "-A"], { cwd: projectDir });
    await runCommand("git", ["commit", "-m", "Initial commit from create-blu-app"], {
      cwd: projectDir,
    });
    spinner.succeed(
      `Git repository initialized ${chalk.dim("(git init → git add -A → git commit -m \"Initial commit from create-blu-app\")")}`
    );
  } catch (error) {
    spinner.fail("Failed to initialize git — you can do this manually");
  }
}

export async function scaffold(config: ProjectConfig) {
  const { features, projectDir, packageManager: pm, noGit } = config;

  // ── Phase 1: Base dependencies ──────────────────────────────────────────
  await installDependencies(projectDir, pm);

  // ── Phase 2: Batch install ALL feature packages ─────────────────────────
  // Collects every package from every selected feature and installs them in
  // one atomic operation. This avoids the lockfile contention that occurs
  // when multiple package manager commands run concurrently.
  await batchInstallFeatureDeps(projectDir, pm, features);

  // ── Phase 3: shadcn/ui (uses npx, handles its own dependency management) ─
  if (features.includes("shadcn")) {
    await installShadcn(projectDir, pm);
  }

  // ── Phase 4: File generation — grouped by shared resource safety ────────
  //
  // Group A — no shared resource conflicts, safe to run in parallel:
  //   - tanstack-query: writes src/providers/*
  //   - react-compiler: writes next.config.ts
  await Promise.all([
    features.includes("tanstack-query") ? installTanstackQuery(projectDir) : null,
    features.includes("react-compiler") ? installReactCompiler(projectDir) : null,
  ]);

  // Group B — creates .env.local.example (dependency for react-email below)
  if (features.includes("supabase")) {
    await installSupabase(projectDir);
  }

  // Group C — modifies eslint.config.mjs + package.json scripts
  if (features.includes("eslint-prettier")) {
    await installEslintPrettier(projectDir);
  }

  // Group D — appends to .env.local.example + modifies package.json
  // Must run after supabase (needs .env) and eslint-prettier (both touch package.json)
  if (features.includes("react-email")) {
    await installReactEmail(projectDir);
  }

  // react-hook-form has no standalone files (schemas handled below)
  if (features.includes("react-hook-form")) {
    await installReactHookForm(projectDir);
  }

  // ── Phase 5: Cross-feature wiring ───────────────────────────────────────
  if (features.includes("react-hook-form")) {
    const libDir = path.join(projectDir, "src", "lib");
    await fs.mkdir(libDir, { recursive: true });
    await fs.writeFile(path.join(libDir, "schemas.ts"), SCHEMAS_TEMPLATE);
  }

  if (features.includes("supabase") && features.includes("shadcn")) {
    await installAuthPages(projectDir, features.includes("react-hook-form"));
  }

  if (features.includes("supabase") && features.includes("react-email") && features.includes("shadcn")) {
    const actionsDir = path.join(projectDir, "src", "actions");
    await fs.writeFile(path.join(actionsDir, "auth.ts"), AUTH_ACTIONS_WITH_EMAIL_TEMPLATE);
  }

  if (features.includes("supabase") && features.includes("tanstack-query")) {
    const supabaseDir = path.join(projectDir, "src", "lib", "supabase");
    await fs.writeFile(path.join(supabaseDir, "hooks.ts"), SUPABASE_HOOKS_TEMPLATE);
  }

  // ── Phase 6: Final wiring ───────────────────────────────────────────────
  await updateLayout(projectDir, features);

  if (!noGit) {
    await initGit(projectDir);
  }
}
