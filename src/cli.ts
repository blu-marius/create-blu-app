import * as p from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import path from "path";
import {
  DEFAULT_APP_NAME,
  FEATURES,
  PACKAGE_MANAGERS,
  type Feature,
  type PackageManager,
  type ProjectConfig,
} from "./consts.js";
import { detectPackageManager } from "./helpers/package-manager.js";

function renderTitle() {
  console.log("");
  console.log(
    chalk.bold.cyan("  create-blu-app") + chalk.dim(" — scaffold your Blu Stack project")
  );
  console.log("");
}

export async function runCli(): Promise<ProjectConfig> {
  const program = new Command()
    .name("create-blu-app")
    .description("Scaffold a new Blu Stack project")
    .argument("[project-name]", "Name of the project")
    .option("--default", "Use all default features without prompting")
    .option("--use-npm", "Use npm as the package manager")
    .option("--use-yarn", "Use yarn as the package manager")
    .option("--use-pnpm", "Use pnpm as the package manager")
    .option("--use-bun", "Use bun as the package manager")
    .option("--dry-run", "Show what would be generated without writing files")
    .option("--no-git", "Skip git init and initial commit")
    .parse(process.argv);

  const cliArgs = program.args;
  const options = program.opts();

  renderTitle();
  p.intro(chalk.bgCyan(chalk.black(" Let's build something great ")));

  const projectNameArg = cliArgs[0];

  if (projectNameArg && !/^[a-z0-9-_]+$/i.test(projectNameArg)) {
    p.cancel("Project name can only contain letters, numbers, hyphens, and underscores.");
    process.exit(1);
  }

  // Determine package manager from flags
  const pmFromFlags: PackageManager | null = options.useNpm
    ? "npm"
    : options.useYarn
      ? "yarn"
      : options.usePnpm
        ? "pnpm"
        : options.useBun
          ? "bun"
          : null;

  const detected = detectPackageManager();

  const project = await p.group(
    {
      name: () => {
        if (projectNameArg) return Promise.resolve(projectNameArg);
        return p.text({
          message: "What will your project be called?",
          placeholder: DEFAULT_APP_NAME,
          defaultValue: DEFAULT_APP_NAME,
          validate: (value) => {
            if (value.length === 0) return "Project name is required.";
            if (!/^[a-z0-9-_]+$/i.test(value))
              return "Project name can only contain letters, numbers, hyphens, and underscores.";
          },
        });
      },
      packageManager: () => {
        if (pmFromFlags) return Promise.resolve(pmFromFlags);
        if (options.default) return Promise.resolve(detected ?? "pnpm");
        return p.select({
          message: "Which package manager do you want to use?",
          options: PACKAGE_MANAGERS.map((pm) => ({
            value: pm.value,
            label: pm.label,
            hint: pm.value === detected ? "detected" : undefined,
          })),
          initialValue: detected ?? "pnpm",
        });
      },
      features: () => {
        const defaultFeatures = FEATURES.filter((f) => f.defaultSelected !== false);
        if (options.default) {
          return Promise.resolve(defaultFeatures.map((f) => f.value));
        }
        return p.multiselect({
          message: "Which features would you like to include?",
          options: FEATURES.map((f) => ({
            value: f.value,
            label: f.label,
            hint: f.hint,
          })),
          initialValues: defaultFeatures.map((f) => f.value),
          required: false,
        });
      },
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  const projectDir = path.resolve(process.cwd(), project.name);

  return {
    name: project.name,
    features: project.features as Feature[],
    packageManager: project.packageManager as PackageManager,
    projectDir,
    dryRun: !!options.dryRun,
    noGit: !options.git,
  };
}
