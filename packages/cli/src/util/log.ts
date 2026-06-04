/* Minimal, dependency-free logger so core modules don't couple to a prompt lib. */

let quiet = false;
export function setQuiet(v: boolean): void {
  quiet = v;
}

const sym = {
  info: "•",
  ok: "✓",
  warn: "!",
  err: "✗",
};

export const log = {
  plain(msg: string): void {
    if (!quiet) console.log(msg);
  },
  info(msg: string): void {
    if (!quiet) console.log(`${sym.info} ${msg}`);
  },
  success(msg: string): void {
    if (!quiet) console.log(`${sym.ok} ${msg}`);
  },
  warn(msg: string): void {
    if (!quiet) console.warn(`${sym.warn} ${msg}`);
  },
  error(msg: string): void {
    console.error(`${sym.err} ${msg}`);
  },
};
