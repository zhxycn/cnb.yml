import { existsSync, renameSync } from "node:fs";

const API_DIR = "src/app/api";
const STASH_DIR = "src/__api_stash";

if (existsSync(STASH_DIR)) {
  renameSync(STASH_DIR, API_DIR);
  console.log("[postbuild] Restored src/app/api");
}
