import ora from "ora";
import fs from "node:fs/promises";
import path from "path";

import { AUTH_ACTIONS_TEMPLATE } from "./templates/actions.js";
import { LOGIN_PAGE_TEMPLATE } from "./templates/login.js";
import { SIGNUP_PAGE_TEMPLATE } from "./templates/sign-up.js";
import { SIGNUP_SUCCESS_PAGE_TEMPLATE } from "./templates/sign-up-success.js";
import { FORGOT_PASSWORD_PAGE_TEMPLATE } from "./templates/forgot-password.js";
import { UPDATE_PASSWORD_PAGE_TEMPLATE } from "./templates/update-password.js";
import { CONFIRM_ROUTE_TEMPLATE } from "./templates/confirm.js";
import { ERROR_PAGE_TEMPLATE } from "./templates/error.js";
import { LOGOUT_BUTTON_TEMPLATE } from "./templates/logout-button.js";

export async function installAuthPages(projectDir: string) {
  const spinner = ora("Scaffolding auth pages...").start();

  try {
    const authDir = path.join(projectDir, "src", "app", "auth");
    const actionsDir = path.join(projectDir, "src", "actions");
    const componentsDir = path.join(projectDir, "src", "components");

    await Promise.all([
      fs.mkdir(path.join(authDir, "login"), { recursive: true }),
      fs.mkdir(path.join(authDir, "sign-up"), { recursive: true }),
      fs.mkdir(path.join(authDir, "sign-up-success"), { recursive: true }),
      fs.mkdir(path.join(authDir, "forgot-password"), { recursive: true }),
      fs.mkdir(path.join(authDir, "update-password"), { recursive: true }),
      fs.mkdir(path.join(authDir, "confirm"), { recursive: true }),
      fs.mkdir(path.join(authDir, "error"), { recursive: true }),
      fs.mkdir(actionsDir, { recursive: true }),
      fs.mkdir(componentsDir, { recursive: true }),
    ]);

    await Promise.all([
      fs.writeFile(path.join(actionsDir, "auth.ts"), AUTH_ACTIONS_TEMPLATE),
      fs.writeFile(path.join(authDir, "login", "page.tsx"), LOGIN_PAGE_TEMPLATE),
      fs.writeFile(path.join(authDir, "sign-up", "page.tsx"), SIGNUP_PAGE_TEMPLATE),
      fs.writeFile(path.join(authDir, "sign-up-success", "page.tsx"), SIGNUP_SUCCESS_PAGE_TEMPLATE),
      fs.writeFile(path.join(authDir, "forgot-password", "page.tsx"), FORGOT_PASSWORD_PAGE_TEMPLATE),
      fs.writeFile(path.join(authDir, "update-password", "page.tsx"), UPDATE_PASSWORD_PAGE_TEMPLATE),
      fs.writeFile(path.join(authDir, "confirm", "route.ts"), CONFIRM_ROUTE_TEMPLATE),
      fs.writeFile(path.join(authDir, "error", "page.tsx"), ERROR_PAGE_TEMPLATE),
      fs.writeFile(path.join(componentsDir, "logout-button.tsx"), LOGOUT_BUTTON_TEMPLATE),
    ]);

    spinner.succeed("Auth pages scaffolded (login, sign-up, forgot/update password)");
  } catch (error) {
    spinner.fail("Failed to scaffold auth pages");
    throw error;
  }
}
