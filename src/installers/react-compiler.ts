import ora from "ora";
import fs from "node:fs/promises";
import path from "path";

export const REACT_COMPILER_DEPS = [
  "babel-plugin-react-compiler@19.1.0-rc.2",
] as const;

export async function installReactCompiler(projectDir: string) {
  const spinner = ora("Setting up React Compiler...").start();

  try {
    // Add reactCompiler: true to next.config.ts
    const configPath = path.join(projectDir, "next.config.ts");
    let config = await fs.readFile(configPath, "utf-8");

    config = config.replace(
      /const nextConfig:\s*NextConfig\s*=\s*\{/,
      "const nextConfig: NextConfig = {\n  reactCompiler: true,"
    );

    await fs.writeFile(configPath, config);

    spinner.succeed("React Compiler configured");
  } catch (error) {
    spinner.fail("Failed to configure React Compiler");
    throw error;
  }
}
