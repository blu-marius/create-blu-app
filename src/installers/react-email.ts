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
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {name}!</Heading>
          <Text style={text}>
            Thanks for signing up. We&apos;re excited to have you on board.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
};

const text = {
  color: "#555",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 48px",
};
`;

const SEND_ROUTE_TEMPLATE = `import * as z from "zod";
import { Resend } from "resend";
import WelcomeEmail from "../../../../emails/welcome";

// TODO: Add authentication before production use

const sendEmailSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
});

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await request.json();
    const { name, email } = sendEmailSchema.parse(body);

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Welcome!",
      react: WelcomeEmail({ name }),
    });

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 422 });
    }
    return Response.json({ error: "Failed to send email" }, { status: 500 });
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
    const apiRouteDir = path.join(projectDir, "src", "app", "api", "send");

    await Promise.all([
      fs.mkdir(emailsDir, { recursive: true }),
      fs.mkdir(apiRouteDir, { recursive: true }),
    ]);

    await Promise.all([
      fs.writeFile(path.join(emailsDir, "welcome.tsx"), WELCOME_EMAIL_TEMPLATE),
      fs.writeFile(path.join(apiRouteDir, "route.ts"), SEND_ROUTE_TEMPLATE),
    ]);

    // Add email:dev script to package.json
    const pkgPath = path.join(projectDir, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    pkg.scripts["email:dev"] = "email dev";
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    // Append Resend key to env example
    const envPath = path.join(projectDir, ".env.local.example");
    const envExists = await fs.access(envPath).then(() => true, () => false);
    const resendEnv = "\n# Resend\nRESEND_API_KEY=your-resend-api-key\n";

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
