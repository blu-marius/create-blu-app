import { describe, it, expect, afterAll } from 'vitest';
import { execaNode, execa } from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CLI_PATH = path.resolve('dist/index.mjs');

async function createTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'blu-test-'));
}

describe('CLI', () => {
  it('prints help with --help', async () => {
    const result = await execaNode(CLI_PATH, ['--help'], {
      env: { FORCE_COLOR: '0' },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Scaffold a new Blu Stack project');
    expect(result.stdout).toContain('--default');
    expect(result.stdout).toContain('--use-pnpm');
  });

  it('rejects invalid project names', async () => {
    const result = await execaNode(CLI_PATH, ['../../bad-name'], {
      reject: false,
      env: { FORCE_COLOR: '0' },
    });
    expect(result.exitCode).not.toBe(0);
  });
});

describe('scaffold', { timeout: 300_000 }, () => {
  let projectDir: string;
  let tempDir: string;

  afterAll(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('scaffolds a full project with --default', async () => {
    tempDir = await createTempDir();
    projectDir = path.join(tempDir, 'test-app');

    const result = await execaNode(
      CLI_PATH,
      ['test-app', '--default', '--use-pnpm'],
      {
        cwd: tempDir,
        env: { FORCE_COLOR: '0' },
        stdio: 'pipe',
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Your Blu Stack project is ready!');
  });

  it('has correct project structure', async () => {
    const exists = async (p: string) =>
      fs.access(path.join(projectDir, p)).then(
        () => true,
        () => false,
      );

    // Core Next.js files
    expect(await exists('package.json')).toBe(true);
    expect(await exists('src/app/layout.tsx')).toBe(true);
    expect(await exists('src/app/page.tsx')).toBe(true);
    expect(await exists('src/proxy.ts')).toBe(true);

    // Supabase
    expect(await exists('src/lib/supabase/client.ts')).toBe(true);
    expect(await exists('src/lib/supabase/server.ts')).toBe(true);
    expect(await exists('src/lib/supabase/proxy.ts')).toBe(true);

    // TanStack Query
    expect(await exists('src/providers/get-query-client.ts')).toBe(true);
    expect(await exists('src/providers/query-provider.tsx')).toBe(true);

    // React Email
    expect(await exists('emails/welcome.tsx')).toBe(true);
    expect(await exists('src/actions/send-email.ts')).toBe(true);

    // ESLint + Prettier
    expect(await exists('.prettierrc')).toBe(true);
    expect(await exists('eslint.config.mjs')).toBe(true);

    // Env template
    expect(await exists('.env.local.example')).toBe(true);

    // Git initialized
    expect(await exists('.git')).toBe(true);
  });

  it('has correct env template', async () => {
    const env = await fs.readFile(
      path.join(projectDir, '.env.local.example'),
      'utf-8',
    );
    expect(env).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(env).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(env).toContain('RESEND_API_KEY');
  });

  it('has Zod validation in send email action', async () => {
    const action = await fs.readFile(
      path.join(projectDir, 'src/actions/send-email.ts'),
      'utf-8',
    );
    expect(action).toContain('"use server"');
    expect(action).toContain('import * as z from "zod"');
    expect(action).toContain('z.email()');
    expect(action).toContain('sendEmailSchema.parse');
  });

  it('has QueryProvider wrapping children in layout', async () => {
    const layout = await fs.readFile(
      path.join(projectDir, 'src/app/layout.tsx'),
      'utf-8',
    );
    expect(layout).toContain('QueryProvider');
  });

  it('has getQueryClient singleton pattern', async () => {
    const client = await fs.readFile(
      path.join(projectDir, 'src/providers/get-query-client.ts'),
      'utf-8',
    );
    expect(client).toContain('isServer');
    expect(client).toContain('browserQueryClient');
    expect(client).toContain('makeQueryClient');
  });

  it('has lint script in package.json', async () => {
    const pkg = JSON.parse(
      await fs.readFile(path.join(projectDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.scripts.lint).toBe('eslint src');
    expect(pkg.scripts.format).toContain('prettier');
    expect(pkg.scripts['email:dev']).toBe('email dev');
  });

  it('uses getClaims in proxy', async () => {
    const proxy = await fs.readFile(
      path.join(projectDir, 'src/lib/supabase/proxy.ts'),
      'utf-8',
    );
    expect(proxy).toContain('getClaims()');
    expect(proxy).not.toContain('getUser()');
  });

  it('has env handling in supabase clients', async () => {
    const client = await fs.readFile(
      path.join(projectDir, 'src/lib/supabase/client.ts'),
      'utf-8',
    );
    expect(client).toContain('return null');
    expect(client).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(client).not.toContain('ANON_KEY');
  });

  it('generated project builds successfully', async () => {
    const result = await execa('npx', ['next', 'build'], {
      cwd: projectDir,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    expect(result.exitCode).toBe(0);
  });
});
