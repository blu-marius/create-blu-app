import fs from "node:fs/promises";
import path from "path";
import ora from "ora";
import type { ProjectConfig } from "../consts.js";
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
import { AUTH_ACTIONS_WITH_EMAIL_TEMPLATE } from "../installers/auth/templates/actions-with-email.js";
import { runCommand } from "./run-command.js";
import { getInstallCommand } from "./package-manager.js";
import type { PackageManager } from "../consts.js";

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
    spinner.succeed("Git repository initialized");
  } catch (error) {
    spinner.fail("Failed to initialize git — you can do this manually");
  }
}

export async function scaffold(config: ProjectConfig) {
  const { features, projectDir, packageManager: pm, noGit } = config;

  // Install base dependencies first
  await installDependencies(projectDir, pm);

  // Run installers — ordered by dependency, parallelized where safe
  if (features.includes("eslint-prettier")) {
    await installEslintPrettier(projectDir, pm);
  }

  if (features.includes("shadcn")) {
    await installShadcn(projectDir, pm);
  }

  // These installers write to separate files and can run in parallel
  await Promise.all([
    features.includes("supabase") ? installSupabase(projectDir, pm) : null,
    features.includes("tanstack-query") ? installTanstackQuery(projectDir, pm) : null,
    features.includes("react-hook-form") ? installReactHookForm(projectDir, pm) : null,
  ]);

  // react-email runs last: it appends to .env.local.example (created by supabase)
  // and modifies package.json
  if (features.includes("react-email")) {
    await installReactEmail(projectDir, pm);
  }

  // React Compiler modifies next.config.ts
  if (features.includes("react-compiler")) {
    await installReactCompiler(projectDir, pm);
  }

  // Generate schemas.ts when react-hook-form (with zod) is selected
  if (features.includes("react-hook-form")) {
    const libDir = path.join(projectDir, "src", "lib");
    await fs.mkdir(libDir, { recursive: true });
    await fs.writeFile(path.join(libDir, "schemas.ts"), SCHEMAS_TEMPLATE);
  }

  // Generate auth example pages when both supabase and shadcn are selected
  if (features.includes("supabase") && features.includes("shadcn")) {
    await installAuthPages(projectDir, features.includes("react-hook-form"));
  }

  // Wire welcome email into signup when supabase + react-email + shadcn are all selected
  if (features.includes("supabase") && features.includes("react-email") && features.includes("shadcn")) {
    const actionsDir = path.join(projectDir, "src", "actions");
    await fs.writeFile(path.join(actionsDir, "auth.ts"), AUTH_ACTIONS_WITH_EMAIL_TEMPLATE);
  }

  // Generate supabase hooks when both supabase and tanstack-query are selected
  if (features.includes("supabase") && features.includes("tanstack-query")) {
    const supabaseDir = path.join(projectDir, "src", "lib", "supabase");
    await fs.writeFile(path.join(supabaseDir, "hooks.ts"), SUPABASE_HOOKS_TEMPLATE);
  }

  // Update layout.tsx with providers
  await updateLayout(projectDir, features);

  // Initialize git
  if (!noGit) {
    await initGit(projectDir);
  }
}
