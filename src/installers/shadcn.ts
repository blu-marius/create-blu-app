import ora from "ora";
import { runCommand } from "../helpers/run-command.js";
import type { PackageManager } from "../consts.js";

export async function installShadcn(projectDir: string, _pm: PackageManager) {
  const spinner = ora("Installing shadcn/ui...").start();

  try {
    // Always use npx to run shadcn CLI — it auto-detects the project's
    // package manager from the lockfile when installing dependencies.
    // Using yarn dlx or bunx can cause PnP/resolution conflicts.
    await runCommand("npx", ["--yes", "shadcn@4.1.0", "init", "--defaults"], {
      cwd: projectDir,
    });

    spinner.text = "Adding all shadcn components...";

    await runCommand("npx", ["--yes", "shadcn@4.1.0", "add", "--all", "--yes"], {
      cwd: projectDir,
    });

    spinner.succeed("shadcn/ui installed with all components");
  } catch (error) {
    spinner.fail("Failed to install shadcn/ui");
    throw error;
  }
}
