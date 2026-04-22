import type { PipelineBlock, PipelineConfig, StageConfig } from "@/types/cnb";

function cleanStage(stage: StageConfig): Record<string, unknown> {
  const out: Record<string, unknown> = { name: stage.name };

  if (stage.type) out.type = stage.type;
  if (stage.image) out.image = stage.image;
  if (stage.script !== undefined) {
    out.script =
      Array.isArray(stage.script) && stage.script.length === 1
        ? stage.script[0]
        : stage.script;
  }
  if (stage.commands !== undefined) out.commands = stage.commands;
  if (stage.options) out.options = stage.options;
  if (stage.optionsFrom) out.optionsFrom = stage.optionsFrom;
  if (stage.settings) out.settings = stage.settings;
  if (stage.settingsFrom) out.settingsFrom = stage.settingsFrom;
  if (stage.args?.length) out.args = stage.args;
  if (stage.env && Object.keys(stage.env).length > 0) out.env = stage.env;
  if (stage.imports) out.imports = stage.imports;
  if (stage.exports && Object.keys(stage.exports).length > 0)
    out.exports = stage.exports;
  if (stage.timeout !== undefined) out.timeout = stage.timeout;
  if (stage.retry !== undefined && stage.retry > 0) out.retry = stage.retry;
  if (stage.allowFailure) out.allowFailure = stage.allowFailure;
  if (stage.lock !== undefined) out.lock = stage.lock;
  if (stage.ifModify) out.ifModify = stage.ifModify;
  if (stage.if) out.if = stage.if;
  if (stage.ifNewBranch) out.ifNewBranch = stage.ifNewBranch;
  if (stage.breakIfModify) out.breakIfModify = stage.breakIfModify;
  if (stage.skipIfModify) out.skipIfModify = stage.skipIfModify;
  if (stage.jobs !== undefined) out.jobs = stage.jobs;

  return out;
}

function cleanPipeline(pipeline: PipelineConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (pipeline.name) out.name = pipeline.name;
  if (pipeline.runner) {
    const r: Record<string, unknown> = {};
    if (pipeline.runner.tags) r.tags = pipeline.runner.tags;
    if (pipeline.runner.cpus) r.cpus = pipeline.runner.cpus;
    if (Object.keys(r).length > 0) out.runner = r;
  }
  if (pipeline.docker) {
    const d: Record<string, unknown> = {};
    if (pipeline.docker.image) d.image = pipeline.docker.image;
    if (pipeline.docker.build) d.build = pipeline.docker.build;
    if (pipeline.docker.devcontainer)
      d.devcontainer = pipeline.docker.devcontainer;
    if (pipeline.docker.volumes) {
      const v = pipeline.docker.volumes;
      d.volumes = Array.isArray(v) ? (v.length === 1 ? v[0] : v) : v;
    }
    if (Object.keys(d).length > 0) out.docker = d;
  }
  if (pipeline.git) {
    const g: Record<string, unknown> = {};
    if (pipeline.git.enable === false) g.enable = false;
    if (pipeline.git.submodules !== undefined)
      g.submodules = pipeline.git.submodules;
    if (pipeline.git.lfs !== undefined) g.lfs = pipeline.git.lfs;
    if (Object.keys(g).length > 0) out.git = g;
  }
  if (pipeline.services?.length) {
    out.services = pipeline.services.map((s) => {
      if (typeof s === "string") return s;
      if (!s.options || Object.keys(s.options).length === 0) return s.name;
      return s;
    });
  }
  if (pipeline.env && Object.keys(pipeline.env).length > 0)
    out.env = pipeline.env;
  if (pipeline.imports) {
    const imp = Array.isArray(pipeline.imports)
      ? pipeline.imports.filter((s) => s.trim() !== "")
      : pipeline.imports.trim()
        ? pipeline.imports
        : undefined;
    if (imp && (typeof imp === "string" || imp.length > 0)) {
      out.imports = Array.isArray(imp) && imp.length === 1 ? imp[0] : imp;
    }
  }
  if (pipeline.label && Object.keys(pipeline.label).length > 0)
    out.label = pipeline.label;

  if (pipeline.stages.length > 0) out.stages = pipeline.stages.map(cleanStage);
  if (pipeline.failStages?.length)
    out.failStages = pipeline.failStages.map(cleanStage);
  if (pipeline.endStages?.length)
    out.endStages = pipeline.endStages.map(cleanStage);

  if (pipeline.ifNewBranch) out.ifNewBranch = pipeline.ifNewBranch;
  if (pipeline.ifModify) out.ifModify = pipeline.ifModify;
  if (pipeline.breakIfModify) out.breakIfModify = pipeline.breakIfModify;
  if (pipeline.retry !== undefined && pipeline.retry > 0)
    out.retry = pipeline.retry;
  if (pipeline.allowFailure) out.allowFailure = pipeline.allowFailure;
  if (pipeline.lock !== undefined) out.lock = pipeline.lock;
  if (pipeline.sandbox) out.sandbox = pipeline.sandbox;

  return out;
}

export function mergeBlocks(blocks: PipelineBlock[]): Record<string, unknown> {
  const result: Record<string, Record<string, unknown[]>> = {};

  for (const block of blocks) {
    const branch = block.branch || "main";
    const event = block.event || "push";

    if (!result[branch]) result[branch] = {};
    if (!result[branch][event]) result[branch][event] = [];

    result[branch][event].push(cleanPipeline(block.pipeline));
  }

  return result as unknown as Record<string, unknown>;
}
