# create-blu-app

[![npm version](https://img.shields.io/npm/v/create-blu-app)](https://www.npmjs.com/package/create-blu-app)
[![npm downloads](https://img.shields.io/npm/dm/create-blu-app)](https://www.npmjs.com/package/create-blu-app)
[![license](https://img.shields.io/npm/l/create-blu-app)](https://github.com/blu-marius/create-blu-app/blob/main/LICENSE)

Scaffold a new project with the **Blu Stack** — a curated, opinionated set of tools for building modern full-stack apps with Next.js.

## Quickstart

```bash
# npm
npx create-blu-app@latest

# pnpm
pnpm create blu-app

# yarn
yarn create blu-app

# bun
bunx create-blu-app
```

Or pass a project name directly:

```bash
npx create-blu-app@latest my-app
```

Use `--default` to skip prompts and include all features:

```bash
npx create-blu-app@latest my-app --default
```

## What's Included

Every project starts with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Turbopack**. On top of that, you choose which features to add:

- **shadcn/ui** — All components installed and ready to use. Beautiful, accessible, and fully customizable.
- **Supabase** — Pre-configured client, server, and proxy helpers for auth with automatic session refresh.
- **TanStack Query** — Async state management with a provider, singleton QueryClient, and devtools.
- **React Hook Form + Zod** — Type-safe form validation with Zod v4 schema integration.
- **React Email + Resend** — A starter email template and server action for sending transactional emails.
- **ESLint + Prettier** — Linting with `eslint-config-prettier` and formatting with `prettier-plugin-tailwindcss`.
- **React Compiler** — Automatic memoization via `babel-plugin-react-compiler` (off by default, experimental).

All features except React Compiler are selected by default in the interactive prompt. Deselect any you don't need.

## Options

| Flag | Description |
|------|-------------|
| `--default` | Use all default features without prompting |
| `--use-npm` | Use npm as the package manager |
| `--use-yarn` | Use yarn as the package manager |
| `--use-pnpm` | Use pnpm as the package manager |
| `--use-bun` | Use bun as the package manager |
| `--dry-run` | Show what would be generated without writing any files |
| `--no-git` | Skip git init and initial commit |

When no package manager flag is passed, the CLI auto-detects which one you used to run the command.

## Generated Project Structure

> Structure shown with all features selected. Files are only generated for the features you choose.

```
my-app/
├── src/
│   ├── actions/
│   │   └── send-email.ts           # Server action for sending emails
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   └── page.tsx
│   ├── components/ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── schemas.ts               # Zod schemas (login, signup)
│   │   └── supabase/
│   │       ├── client.ts            # Browser client
│   │       ├── server.ts            # Server client
│   │       ├── proxy.ts             # Session refresh helper
│   │       └── hooks.ts             # TanStack Query hooks (useUser)
│   ├── providers/
│   │   ├── get-query-client.ts     # QueryClient singleton
│   │   └── query-provider.tsx      # TanStack Query provider
│   └── proxy.ts                    # Next.js proxy (middleware)
├── emails/
│   └── welcome.tsx                 # Starter email template
├── .env.local.example              # Environment variables template
├── .prettierrc
└── eslint.config.mjs
```

## Requirements

- Node.js **20.9** or later

## License

MIT
