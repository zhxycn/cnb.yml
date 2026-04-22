import yaml from "js-yaml";
import type { PipelineBlock, PipelineConfig, StageConfig } from "@/types/cnb";

let idCounter = 0;
function genId(): string {
  return `block-${Date.now()}-${++idCounter}`;
}

function parseStage(raw: unknown): StageConfig {
  if (typeof raw === "string") {
    return { name: raw, script: raw };
  }
  const obj = raw as Record<string, unknown>;
  return {
    name: (obj.name as string) || "unnamed",
    script: obj.script as string | string[] | undefined,
    commands: obj.commands as string | string[] | undefined,
    type: obj.type as string | undefined,
    options: obj.options as Record<string, unknown> | undefined,
    optionsFrom: obj.optionsFrom as string | string[] | undefined,
    settings: obj.settings as Record<string, unknown> | undefined,
    settingsFrom: obj.settingsFrom as string | string[] | undefined,
    args: obj.args as string[] | undefined,
    image: obj.image as string | undefined,
    env: obj.env as Record<string, string> | undefined,
    imports: obj.imports as string | string[] | undefined,
    exports: obj.exports as Record<string, string> | undefined,
    timeout: obj.timeout as number | string | undefined,
    retry: obj.retry as number | undefined,
    allowFailure: obj.allowFailure as boolean | string | undefined,
    lock: obj.lock as StageConfig["lock"],
    ifModify: obj.ifModify as string | string[] | undefined,
    if: obj.if as string | string[] | undefined,
    ifNewBranch: obj.ifNewBranch as boolean | undefined,
    breakIfModify: obj.breakIfModify as boolean | undefined,
    skipIfModify: obj.skipIfModify as boolean | undefined,
    jobs: obj.jobs as unknown,
  };
}

function parseStages(raw: unknown): StageConfig[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseStage);
}

function parsePipeline(raw: unknown): PipelineConfig {
  const obj = raw as Record<string, unknown>;
  return {
    name: obj.name as string | undefined,
    runner: obj.runner as PipelineConfig["runner"],
    docker: obj.docker as PipelineConfig["docker"],
    git: obj.git as PipelineConfig["git"],
    services: obj.services as PipelineConfig["services"],
    env: obj.env as Record<string, string> | undefined,
    imports: obj.imports as string | string[] | undefined,
    label: obj.label as PipelineConfig["label"],
    stages: parseStages(obj.stages),
    failStages: obj.failStages ? parseStages(obj.failStages) : undefined,
    endStages: obj.endStages ? parseStages(obj.endStages) : undefined,
    ifNewBranch: obj.ifNewBranch as boolean | undefined,
    ifModify: obj.ifModify as string | string[] | undefined,
    breakIfModify: obj.breakIfModify as boolean | undefined,
    retry: obj.retry as number | undefined,
    allowFailure: obj.allowFailure as boolean | undefined,
    lock: obj.lock as PipelineConfig["lock"],
    sandbox: obj.sandbox as boolean | undefined,
  };
}

export function yamlToBlocks(yamlStr: string): PipelineBlock[] {
  const doc = yaml.load(yamlStr);
  if (!doc || typeof doc !== "object") return [];

  const blocks: PipelineBlock[] = [];
  const root = doc as Record<string, unknown>;

  for (const [branch, events] of Object.entries(root)) {
    if (branch === "include" || branch.startsWith(".")) continue;
    if (!events || typeof events !== "object") continue;

    const eventsObj = events as Record<string, unknown>;
    for (const [event, pipelines] of Object.entries(eventsObj)) {
      const pipelineList = Array.isArray(pipelines)
        ? pipelines
        : typeof pipelines === "object" && pipelines !== null
          ? Object.entries(pipelines as Record<string, unknown>).map(
              ([key, val]) => ({
                ...(val as Record<string, unknown>),
                name: (val as Record<string, unknown>).name || key,
              }),
            )
          : [];

      for (const raw of pipelineList) {
        blocks.push({
          id: genId(),
          branch,
          event,
          pipeline: parsePipeline(raw),
        });
      }
    }
  }

  return blocks;
}

export function tryParseYaml(
  yamlStr: string,
): { blocks: PipelineBlock[] } | { error: string } {
  try {
    const blocks = yamlToBlocks(yamlStr);
    return { blocks };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
