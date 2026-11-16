// Copies the worker of MapLibre GL into public/maplibre-gl/, which Next.js serves as /maplibre-gl/.
//
// From version 6 the worker is a file of its own, and MapLibre finds it from import.meta.url of its module. Inside a bundle
// of webpack that URL is a file: URL and not an http one, so MapLibre gets an empty URL and `new Worker("")` loads the page
// itself (the console says "Loading Worker ... was blocked because of a disallowed MIME type (text/html)") and the map
// does not draw. MapContainer sets the URL by hand (setWorkerUrl) to the copy that this script makes.
//
// The worker imports maplibre-gl-shared.mjs by a relative path, so both files go in the same folder. They are copied from the
// installed package every time (the folder is not in git) so that they are always the ones of the version that is installed.
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "maplibre-gl", "dist");
const to = join(root, "public", "maplibre-gl");
const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

mkdirSync(to, { recursive: true });
for (const file of files) {
  const source = join(from, file);
  if (!existsSync(source)) {
    console.error(`${source} not found: is maplibre-gl installed, and is it version 6 or later?`);
    process.exit(1);
  }
  copyFileSync(source, join(to, file));
}
console.log(`copied the worker of maplibre-gl to ${to}`);
