import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "dist");
const sources = ["index.html", "styles.css", "app.js"];

async function build() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  await Promise.all(
    sources.map((source) => cp(resolve(here, source), resolve(dist, source)))
  );

  await cp(
    resolve(here, "../extensions/thox-hermes/assets/thox-mark.svg"),
    resolve(dist, "thox-mark.svg")
  );

  console.log(`THOX Hermes Device Launcher built at ${dist}`);
}

build().catch((error) => {
  console.error("THOX Hermes Device Launcher build failed", error);
  process.exitCode = 1;
});
