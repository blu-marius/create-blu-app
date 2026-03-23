import ora from "ora";
import fs from "node:fs/promises";
import path from "path";
import { runCommand } from "../helpers/run-command.js";
import { getAddCommand } from "../helpers/package-manager.js";
import type { PackageManager } from "../consts.js";

const PRETTIER_CONFIG = `{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
`;

export async function installEslintPrettier(projectDir: string, pm: PackageManager) {
  const spinner = ora("Installing ESLint + Prettier...").start();

  try {
    const [cmd, args] = getAddCommand(
      pm,
      ["prettier@3.8.1", "eslint-config-prettier@10.1.8", "prettier-plugin-tailwindcss@0.7.2"],
      true
    );
    await runCommand(cmd, args, { cwd: projectDir });

    await fs.writeFile(
      path.join(projectDir, ".prettierrc"),
      PRETTIER_CONFIG
    );

    // Update eslint config to extend prettier
    const eslintConfigPath = path.join(projectDir, "eslint.config.mjs");
    const eslintConfigExists = await fs.access(eslintConfigPath).then(() => true, () => false);

    if (eslintConfigExists) {
      let eslintConfig = await fs.readFile(eslintConfigPath, "utf-8");

      // Add prettier config import and extend
      if (!eslintConfig.includes("eslint-config-prettier")) {
        eslintConfig =
          `import prettierConfig from "eslint-config-prettier";\n` + eslintConfig;
        eslintConfig = eslintConfig.replace(
          /export default \[/,
          "export default [\n  prettierConfig,"
        );
        await fs.writeFile(eslintConfigPath, eslintConfig);
      }
    }

    // Add format script to package.json
    const pkgPath = path.join(projectDir, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    pkg.scripts["lint"] = "eslint src";
    pkg.scripts["format"] = 'prettier --write "src/**/*.{ts,tsx,css}"';
    pkg.scripts["format:check"] = 'prettier --check "src/**/*.{ts,tsx,css}"';
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    spinner.succeed("ESLint + Prettier configured");
  } catch (error) {
    spinner.fail("Failed to install ESLint + Prettier");
    throw error;
  }
}
