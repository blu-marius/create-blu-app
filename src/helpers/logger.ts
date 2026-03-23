import chalk from "chalk";

export const logger = {
  info: (...args: unknown[]) => console.log(chalk.cyan("ℹ"), ...args),
  success: (...args: unknown[]) => console.log(chalk.green("✔"), ...args),
  warn: (...args: unknown[]) => console.log(chalk.yellow("⚠"), ...args),
  error: (...args: unknown[]) => console.log(chalk.red("✖"), ...args),
  break: () => console.log(""),
};
