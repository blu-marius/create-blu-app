import ora from "ora";
import fs from "node:fs/promises";
import path from "path";
import { runCommand } from "../helpers/run-command.js";
import { getAddCommand } from "../helpers/package-manager.js";
import type { PackageManager } from "../consts.js";

export async function installReactCompiler(projectDir: string, pm: PackageManager) {
  const spinner = ora("Installing React Compiler...").start();

  try {
    const [cmd, args] = getAddCommand(pm, ["babel-plugin-react-compiler@19.1.0-rc.2"], true);
    await runCommand(cmd, args, { cwd: projectDir });

    // Add reactCompiler: true to next.config.ts
    const configPath = path.join(projectDir, "next.config.ts");
    let config = await fs.readFile(configPath, "utf-8");

    config = config.replace(
      /const nextConfig:\s*NextConfig\s*=\s*\{/,
      "const nextConfig: NextConfig = {\n  reactCompiler: true,"
    );

    await fs.writeFile(configPath, config);

    spinner.succeed("React Compiler installed");
  } catch (error) {
    spinner.fail("Failed to install React Compiler");
    throw error;
  }
}
