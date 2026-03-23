import ora from "ora";
import { runCommand } from "./run-command.js";
import { getCreateNextAppFlag, getDlxCommand } from "./package-manager.js";
import type { ProjectConfig } from "../consts.js";

export async function createProject(config: ProjectConfig) {
  const spinner = ora("Creating Next.js project...").start();

  try {
    const pmFlag = getCreateNextAppFlag(config.packageManager);
    const [cmd, args] = getDlxCommand(config.packageManager, "create-next-app@16.2.1", [
      config.projectDir,
      "--src-dir",
      "--skip-install",
      "--disable-git",
      "--yes",
      pmFlag,
    ]);

    await runCommand(cmd, args);

    spinner.succeed("Next.js project created");
  } catch (error) {
    spinner.fail("Failed to create Next.js project");
    throw error;
  }
}
