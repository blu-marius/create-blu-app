import type { PackageManager } from "../consts.js";

export function getAddCommand(pm: PackageManager, packages: string[], dev = false): [string, string[]] {
  switch (pm) {
    case "npm":
      return ["npm", ["install", ...(dev ? ["--save-dev"] : []), ...packages]];
    case "yarn":
      return ["yarn", ["add", ...(dev ? ["--dev"] : []), ...packages]];
    case "bun":
      return ["bun", ["add", ...(dev ? ["--dev"] : []), ...packages]];
    case "pnpm":
      return ["pnpm", ["add", ...(dev ? ["-D"] : []), ...packages]];
  }
}

export function getInstallCommand(pm: PackageManager): [string, string[]] {
  return [pm, ["install"]];
}

export function getDlxCommand(pm: PackageManager, pkg: string, args: string[]): [string, string[]] {
  switch (pm) {
    case "npm":
      return ["npx", ["--yes", pkg, ...args]];
    case "yarn":
      return ["yarn", ["dlx", pkg, ...args]];
    case "bun":
      return ["bunx", ["--bun", pkg, ...args]];
    case "pnpm":
      return ["pnpm", ["dlx", pkg, ...args]];
  }
}

export function getCreateNextAppFlag(pm: PackageManager): string {
  switch (pm) {
    case "npm":
      return "--use-npm";
    case "yarn":
      return "--use-yarn";
    case "bun":
      return "--use-bun";
    case "pnpm":
      return "--use-pnpm";
  }
}

export function getRunCommand(pm: PackageManager): string {
  switch (pm) {
    case "npm":
      return "npm run";
    case "yarn":
      return "yarn";
    case "bun":
      return "bun run";
    case "pnpm":
      return "pnpm";
  }
}

export function detectPackageManager(): PackageManager | null {
  const agent = process.env.npm_config_user_agent;
  if (!agent) return null;
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("bun")) return "bun";
  if (agent.startsWith("npm")) return "npm";
  return null;
}
