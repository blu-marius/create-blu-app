import { execa, type Options, type ResultPromise } from "execa";

export function runCommand(
  command: string,
  args: string[],
  opts?: Options
): ResultPromise {
  return execa(command, args, {
    stdin: "ignore",
    stdout: "ignore",
    stderr: "pipe",
    ...opts,
  });
}
