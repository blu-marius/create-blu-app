#!/usr/bin/env node
import * as p from "@clack/prompts";
import chalk from "chalk";
import { runCli } from "./cli.js";
import { createProject } from "./helpers/create-project.js";
import { scaffold } from "./helpers/scaffold.js";
import { logger } from "./helpers/logger.js";
import { getRunCommand } from "./helpers/package-manager.js";

async function main() {
  const config = await runCli();

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
  logger.break();
  p.outro(chalk.bold.green("Your Blu Stack project is ready!"));

  console.log("");
  console.log(chalk.bold("  Next steps:"));
  console.log("");
  console.log(`  ${chalk.cyan("cd")} ${config.name}`);

  if (config.features.includes("supabase")) {
    console.log(`  ${chalk.dim("# Copy .env.local.example to .env.local and fill in your keys")}`);
    console.log(`  ${chalk.cyan("cp")} .env.local.example .env.local`);
  }

  const runCmd = getRunCommand(config.packageManager);
  console.log(`  ${chalk.cyan(runCmd)} dev`);
  console.log("");
}

main().catch((err) => {
  logger.error("An error occurred:");
  console.error(err);
  process.exit(1);
});
