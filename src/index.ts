#!/usr/bin/env node
import * as p from "@clack/prompts";
import chalk from "chalk";
import { runCli } from "./cli.js";
import { createProject } from "./helpers/create-project.js";
import { scaffold } from "./helpers/scaffold.js";
import { logger } from "./helpers/logger.js";
import { getRunCommand } from "./helpers/package-manager.js";
import {
  FEATURE_LABELS,
  FEATURE_DEPS,
  FEATURE_FILES,
  type ProjectConfig,
} from "./consts.js";

function printDryRun(config: ProjectConfig) {
  const { name, features, packageManager: pm, projectDir, noGit } = config;

  logger.break();
  p.outro(chalk.bold.yellow("Dry run — nothing will be written."));

  console.log("");
  console.log(chalk.bold("  Project:   ") + chalk.cyan(projectDir));
  console.log(chalk.bold("  Package manager: ") + pm);
  console.log("");

  // Features
  if (features.length > 0) {
    console.log(chalk.bold("  Features:"));
    for (const f of features) {
      console.log(`    ${chalk.green("✔")} ${FEATURE_LABELS[f]}`);
    }
  } else {
    console.log(chalk.dim("  No additional features selected."));
  }
  console.log("");

  // File tree
  const baseFiles = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "next.config.ts",
    "package.json",
    "tsconfig.json",
    "tailwind.config.ts",
  ];

  const allFiles = [...baseFiles];
  for (const f of features) {
    allFiles.push(...FEATURE_FILES[f]);
  }

  console.log(chalk.bold("  Files that would be created:"));
  console.log(chalk.dim(`    ${name}/`));
  for (const file of allFiles) {
    console.log(chalk.dim(`    ├── ${file}`));
  }
  console.log("");

  // Dependencies
  const deps: string[] = [];
  const devDeps: string[] = [];
  for (const f of features) {
    deps.push(...FEATURE_DEPS[f].deps);
    devDeps.push(...FEATURE_DEPS[f].devDeps);
  }

  if (deps.length > 0) {
    console.log(chalk.bold("  Dependencies:"));
    for (const d of deps) {
      console.log(`    ${chalk.cyan(d)}`);
    }
    console.log("");
  }

  if (devDeps.length > 0) {
    console.log(chalk.bold("  Dev dependencies:"));
    for (const d of devDeps) {
      console.log(`    ${chalk.cyan(d)}`);
    }
    console.log("");
  }

  // Git
  if (!noGit) {
    console.log(chalk.bold("  Git:") + " would run git init + initial commit");
  } else {
    console.log(chalk.bold("  Git:") + chalk.dim(" skipped (--no-git)"));
  }
  console.log("");

  console.log(chalk.yellow("  No files were written (dry run)."));
  console.log("");
}

function printSummary(config: ProjectConfig) {
  const { name, features, packageManager: pm, noGit } = config;
  const runCmd = getRunCommand(pm);

  logger.break();
  p.outro(chalk.bold.green("Your Blu Stack project is ready!"));

  // Feature list
  if (features.length > 0) {
    const labels = features.map((f) => FEATURE_LABELS[f]);
    console.log(`  ${chalk.green("✔")} ${labels.join(", ")}`);
  }

  // Env reminder
  const needsEnv =
    features.includes("supabase") || features.includes("react-email");
  if (needsEnv) {
    console.log(
      `  ${chalk.yellow("!")} Copy and fill in your env vars: ${chalk.cyan("cp")} .env.local.example .env.local`
    );
  }

  console.log("");
  console.log(chalk.bold("  Next steps:"));
  console.log(`  ${chalk.cyan("cd")} ${name}`);
  console.log(`  ${chalk.cyan(runCmd)} dev`);
  console.log("");
  console.log(chalk.dim(`  Using ${pm}${noGit ? "" : " · git repo initialized"}`));
  console.log("");
}

async function main() {
  const config = await runCli();

  if (config.dryRun) {
    printDryRun(config);
    return;
  }

  logger.break();
  p.log.info(
    config.features.length > 0
      ? `Creating ${chalk.bold(config.name)} with features: ${chalk.cyan(config.features.join(", "))}`
      : `Creating ${chalk.bold(config.name)} with no additional features`
  );
  logger.break();

  // Step 1: Create Next.js project
  await createProject(config);

  // Step 2: Install features and scaffold files
  await scaffold(config);

  // Done!
  printSummary(config);
}

main().catch((err) => {
  logger.error("An error occurred:");
  console.error(err);
  process.exit(1);
});
