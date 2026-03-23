import { describe, it, expect, afterEach } from "vitest";
import {
  getAddCommand,
  getInstallCommand,
  getDlxCommand,
  getCreateNextAppFlag,
  getRunCommand,
  detectPackageManager,
} from "../src/helpers/package-manager.js";

describe("getAddCommand", () => {
  it("generates npm install command", () => {
    expect(getAddCommand("npm", ["foo", "bar"])).toEqual([
      "npm",
      ["install", "foo", "bar"],
    ]);
  });

  it("generates npm install --save-dev command", () => {
    expect(getAddCommand("npm", ["foo"], true)).toEqual([
      "npm",
      ["install", "--save-dev", "foo"],
    ]);
  });

  it("generates pnpm add command", () => {
    expect(getAddCommand("pnpm", ["foo"])).toEqual(["pnpm", ["add", "foo"]]);
  });

  it("generates pnpm add -D command", () => {
    expect(getAddCommand("pnpm", ["foo"], true)).toEqual([
      "pnpm",
      ["add", "-D", "foo"],
    ]);
  });

  it("generates yarn add command", () => {
    expect(getAddCommand("yarn", ["foo"])).toEqual(["yarn", ["add", "foo"]]);
  });

  it("generates yarn add --dev command", () => {
    expect(getAddCommand("yarn", ["foo"], true)).toEqual([
      "yarn",
      ["add", "--dev", "foo"],
    ]);
  });

  it("generates bun add command", () => {
    expect(getAddCommand("bun", ["foo"])).toEqual(["bun", ["add", "foo"]]);
  });

  it("generates bun add --dev command", () => {
    expect(getAddCommand("bun", ["foo"], true)).toEqual([
      "bun",
      ["add", "--dev", "foo"],
    ]);
  });
});

describe("getInstallCommand", () => {
  it.each([
    ["npm", ["npm", ["install"]]],
    ["pnpm", ["pnpm", ["install"]]],
    ["yarn", ["yarn", ["install"]]],
    ["bun", ["bun", ["install"]]],
  ] as const)("returns correct command for %s", (pm, expected) => {
    expect(getInstallCommand(pm)).toEqual(expected);
  });
});

describe("getDlxCommand", () => {
  it("generates npx command for npm", () => {
    expect(getDlxCommand("npm", "create-next-app@latest", ["--yes"])).toEqual([
      "npx",
      ["--yes", "create-next-app@latest", "--yes"],
    ]);
  });

  it("generates pnpm dlx command", () => {
    expect(getDlxCommand("pnpm", "create-next-app@latest", ["--yes"])).toEqual([
      "pnpm",
      ["dlx", "create-next-app@latest", "--yes"],
    ]);
  });

  it("generates yarn dlx command", () => {
    expect(getDlxCommand("yarn", "create-next-app@latest", ["--yes"])).toEqual([
      "yarn",
      ["dlx", "create-next-app@latest", "--yes"],
    ]);
  });

  it("generates bunx command", () => {
    expect(getDlxCommand("bun", "create-next-app@latest", ["--yes"])).toEqual([
      "bunx",
      ["--bun", "create-next-app@latest", "--yes"],
    ]);
  });
});

describe("getCreateNextAppFlag", () => {
  it.each([
    ["npm", "--use-npm"],
    ["pnpm", "--use-pnpm"],
    ["yarn", "--use-yarn"],
    ["bun", "--use-bun"],
  ] as const)("returns %s flag for %s", (pm, expected) => {
    expect(getCreateNextAppFlag(pm)).toBe(expected);
  });
});

describe("getRunCommand", () => {
  it.each([
    ["npm", "npm run"],
    ["pnpm", "pnpm"],
    ["yarn", "yarn"],
    ["bun", "bun run"],
  ] as const)("returns correct run command for %s", (pm, expected) => {
    expect(getRunCommand(pm)).toBe(expected);
  });
});

describe("detectPackageManager", () => {
  const originalAgent = process.env.npm_config_user_agent;

  afterEach(() => {
    if (originalAgent !== undefined) {
      process.env.npm_config_user_agent = originalAgent;
    } else {
      delete process.env.npm_config_user_agent;
    }
  });

  it("returns null when no user agent", () => {
    delete process.env.npm_config_user_agent;
    expect(detectPackageManager()).toBeNull();
  });

  it("detects pnpm", () => {
    process.env.npm_config_user_agent = "pnpm/10.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("pnpm");
  });

  it("detects npm", () => {
    process.env.npm_config_user_agent = "npm/10.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("npm");
  });

  it("detects yarn", () => {
    process.env.npm_config_user_agent = "yarn/4.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("yarn");
  });

  it("detects bun", () => {
    process.env.npm_config_user_agent = "bun/1.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("bun");
  });

  it("returns null for unknown agent", () => {
    process.env.npm_config_user_agent = "unknown/1.0.0";
    expect(detectPackageManager()).toBeNull();
  });
});
