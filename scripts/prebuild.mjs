import { existsSync, renameSync } from "node:fs";

const API_DIR = "src/app/api";
const STASH_DIR = "src/__api_stash";

if (!process.env.CNB_TOKEN) {
  if (existsSync(API_DIR)) {
    renameSync(API_DIR, STASH_DIR);
    console.log("[prebuild] SSG mode: stashed src/app/api");
  }
}
