import ora from "ora";

export const REACT_HOOK_FORM_DEPS = [
  "react-hook-form@7.72.0",
  "@hookform/resolvers@5.2.2",
  "zod@4.3.6",
] as const;

export async function installReactHookForm(_projectDir: string) {
  const spinner = ora("Setting up React Hook Form + Zod...").start();

  try {
    // Package installation is handled by the batch install step in scaffold.
    // File generation (schemas.ts) is handled in scaffold for cross-feature wiring.
    spinner.succeed("React Hook Form + Zod configured");
  } catch (error) {
    spinner.fail("Failed to configure React Hook Form");
    throw error;
  }
}
