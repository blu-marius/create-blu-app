import ora from "ora";
import { runCommand } from "../helpers/run-command.js";
import { getAddCommand } from "../helpers/package-manager.js";
import type { PackageManager } from "../consts.js";

export async function installReactHookForm(projectDir: string, pm: PackageManager) {
  const spinner = ora("Installing React Hook Form + Zod...").start();

  try {
    const [cmd, args] = getAddCommand(pm, [
      "react-hook-form@7.72.0",
      "@hookform/resolvers@5.2.2",
      "zod@4.3.6",
    ]);
    await runCommand(cmd, args, { cwd: projectDir });

    spinner.succeed("React Hook Form + Zod installed");
  } catch (error) {
    spinner.fail("Failed to install React Hook Form");
    throw error;
  }
}
