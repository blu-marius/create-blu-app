import ora from "ora";
import fs from "node:fs/promises";
import path from "path";

export const TANSTACK_QUERY_DEPS = [
  "@tanstack/react-query@5.95.0",
  "@tanstack/react-query-devtools@5.95.0",
] as const;

const GET_QUERY_CLIENT_TEMPLATE = `import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
`;

const QUERY_PROVIDER_TEMPLATE = `"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { getQueryClient } from "./get-query-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
`;

export async function installTanstackQuery(projectDir: string) {
  const spinner = ora("Setting up TanStack Query...").start();

  try {
    const providersDir = path.join(projectDir, "src", "providers");
    await fs.mkdir(providersDir, { recursive: true });

    await Promise.all([
      fs.writeFile(path.join(providersDir, "get-query-client.ts"), GET_QUERY_CLIENT_TEMPLATE),
      fs.writeFile(path.join(providersDir, "query-provider.tsx"), QUERY_PROVIDER_TEMPLATE),
    ]);

    spinner.succeed("TanStack Query configured");
  } catch (error) {
    spinner.fail("Failed to configure TanStack Query");
    throw error;
  }
}
