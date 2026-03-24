import ora from "ora";
import fs from "node:fs/promises";
import path from "path";
import { runCommand } from "../helpers/run-command.js";
import { getAddCommand } from "../helpers/package-manager.js";
import type { PackageManager } from "../consts.js";

const WELCOME_EMAIL_TEMPLATE = `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform</Preview>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto mb-16 bg-white pb-12 pt-5">
            <Heading className="mx-12 my-10 text-2xl font-bold text-gray-800">
              Welcome, {name}!
            </Heading>
            <Text className="mx-12 text-base leading-6 text-gray-600">
              Thanks for signing up. We&apos;re excited to have you on board.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
`;

const PASSWORD_RESET_EMAIL_TEMPLATE = `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "@react-email/components";

interface PasswordResetEmailProps {
  resetLink: string;
}

export default function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto mb-16 bg-white pb-12 pt-5">
            <Heading className="mx-12 my-10 text-2xl font-bold text-gray-800">
              Reset your password
            </Heading>
            <Text className="mx-12 text-base leading-6 text-gray-600">
              We received a request to reset your password. Click the link below
              to choose a new one.
            </Text>
            <Link
              href={resetLink}
              className="mx-12 mb-4 block text-base text-blue-600"
            >
              Reset password
            </Link>
            <Text className="mx-12 text-base leading-6 text-gray-600">
              If you didn&apos;t request this, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
`;

const SEND_ACTION_TEMPLATE = `"use server";

import * as z from "zod";
import { Resend } from "resend";
import WelcomeEmail from "../../emails/welcome";

const sendEmailSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
});

export async function sendWelcomeEmail(data: { name: string; email: string }) {
  const { name, email } = sendEmailSchema.parse(data);
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Welcome!",
    react: WelcomeEmail({ name }),
  });

  if (error) {
    throw new Error("Failed to send email");
  }
}
`;

export async function installReactEmail(projectDir: string, pm: PackageManager) {
  const spinner = ora("Installing React Email + Resend...").start();

  try {
    const [cmd, args] = getAddCommand(pm, [
      "react-email@5.2.10",
      "@react-email/components@1.0.10",
      "resend@6.9.4",
    ]);
    await runCommand(cmd, args, { cwd: projectDir });

    const emailsDir = path.join(projectDir, "emails");
    const actionsDir = path.join(projectDir, "src", "actions");

    await Promise.all([
      fs.mkdir(emailsDir, { recursive: true }),
      fs.mkdir(actionsDir, { recursive: true }),
    ]);

    await Promise.all([
      fs.writeFile(path.join(emailsDir, "welcome.tsx"), WELCOME_EMAIL_TEMPLATE),
      fs.writeFile(path.join(emailsDir, "password-reset.tsx"), PASSWORD_RESET_EMAIL_TEMPLATE),
      fs.writeFile(path.join(actionsDir, "send-email.ts"), SEND_ACTION_TEMPLATE),
    ]);

    // Add email:dev script to package.json
    const pkgPath = path.join(projectDir, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    pkg.scripts["email:dev"] = "email dev";
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    // Append Resend key to env example
    const envPath = path.join(projectDir, ".env.local.example");
    const envExists = await fs.access(envPath).then(() => true, () => false);
    const resendEnv = "\n# Resend\nRESEND_API_KEY=TODO_REPLACE_WITH_YOUR_RESEND_API_KEY\n";

    if (envExists) {
      await fs.appendFile(envPath, resendEnv);
    } else {
      await fs.writeFile(envPath, resendEnv.trimStart());
    }

    spinner.succeed("React Email + Resend installed");
  } catch (error) {
    spinner.fail("Failed to install React Email + Resend");
    throw error;
  }
}
