import ora from "ora";
import fs from "node:fs/promises";
import path from "path";
import { runCommand } from "../helpers/run-command.js";
import { getAddCommand } from "../helpers/package-manager.js";
import type { PackageManager } from "../consts.js";

const SUPABASE_CLIENT_TEMPLATE = `import { createBrowserClient } from "@supabase/ssr";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing environment variable: \${name}\`);
  return value;
}

export function createClient() {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}
`;

const SUPABASE_SERVER_TEMPLATE = `import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing environment variable: \${name}\`);
  return value;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The \`setAll\` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing sessions.
          }
        },
      },
    }
  );
}
`;

const PROXY_SUPABASE_TEMPLATE = `import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing environment variable: \${name}\`);
  return value;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate the session token locally (no network request)
  await supabase.auth.getClaims();

  return supabaseResponse;
}
`;

const NEXTJS_PROXY_TEMPLATE = `import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
`;

const ENV_TEMPLATE = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=TODO_REPLACE_WITH_YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TODO_REPLACE_WITH_YOUR_SUPABASE_PUBLISHABLE_KEY
`;

export async function installSupabase(projectDir: string, pm: PackageManager) {
  const spinner = ora("Installing Supabase...").start();

  try {
    const [cmd, args] = getAddCommand(pm, ["@supabase/supabase-js@2.100.0", "@supabase/ssr@0.9.0"]);
    await runCommand(cmd, args, { cwd: projectDir });

    const libDir = path.join(projectDir, "src", "lib", "supabase");
    await fs.mkdir(libDir, { recursive: true });

    await Promise.all([
      fs.writeFile(path.join(libDir, "client.ts"), SUPABASE_CLIENT_TEMPLATE),
      fs.writeFile(path.join(libDir, "server.ts"), SUPABASE_SERVER_TEMPLATE),
      fs.writeFile(path.join(libDir, "proxy.ts"), PROXY_SUPABASE_TEMPLATE),
      fs.writeFile(
        path.join(projectDir, "src", "proxy.ts"),
        NEXTJS_PROXY_TEMPLATE
      ),
      fs.writeFile(path.join(projectDir, ".env.local.example"), ENV_TEMPLATE),
    ]);

    spinner.succeed("Supabase installed with auth proxy");
  } catch (error) {
    spinner.fail("Failed to install Supabase");
    throw error;
  }
}
