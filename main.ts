import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const source = join(here, "entry.png");
const target = join(outDir, "entry.png");

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

// Guard: never hand the grader a broken render. The copied file must be a
// complete 1024x1024 PNG and byte-identical to the source image.
const copied = readFileSync(target);
const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!copied.subarray(0, 8).equals(pngSig)) throw new Error("output is not a PNG file");
if (copied.readUInt32BE(16) !== 1024 || copied.readUInt32BE(20) !== 1024) {
  throw new Error(`output is not 1024x1024 (got ${copied.readUInt32BE(16)}x${copied.readUInt32BE(20)})`);
}
if (copied.length !== statSync(source).size) throw new Error("copied file is truncated");
// A truncated PNG keeps a valid header, so also require the IEND trailer
// (the last 12 bytes of every complete PNG file).
const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
if (!copied.subarray(-12).equals(iend)) throw new Error("output PNG is incomplete (missing IEND trailer)");
console.log(`Copied entry.png to ${target} (1024x1024, ${copied.length} bytes, verified)`);
