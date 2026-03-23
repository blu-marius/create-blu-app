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
} from "../installers/index.js";
import { runCommand } from "./run-command.js";
import { getInstallCommand } from "./package-manager.js";
import type { PackageManager } from "../consts.js";

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
  const { features, projectDir, packageManager: pm } = config;

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

  // Update layout.tsx with providers
  await updateLayout(projectDir, features);

  // Initialize git
  await initGit(projectDir);
}
