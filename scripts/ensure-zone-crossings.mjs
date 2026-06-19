import { existsSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src/features/map/data/zoneCrossings.json",
);

if (!existsSync(OUT)) {
  console.log("zoneCrossings.json not found — generating...");
  execSync("node scripts/compute-zone-crossings.mjs", { stdio: "inherit" });
}
