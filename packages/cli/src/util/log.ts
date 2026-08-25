/* Minimal, dependency-free logger so core modules don't couple to a prompt lib. */

const sym = {
  info: "•",
  ok: "✓",
  warn: "!",
  err: "✗",
};

export const log = {
  plain(msg: string): void {
    console.log(msg);
  },
  info(msg: string): void {
    console.log(`${sym.info} ${msg}`);
  },
  success(msg: string): void {
    console.log(`${sym.ok} ${msg}`);
  },
  warn(msg: string): void {
    console.warn(`${sym.warn} ${msg}`);
  },
  error(msg: string): void {
    console.error(`${sym.err} ${msg}`);
  },
};
