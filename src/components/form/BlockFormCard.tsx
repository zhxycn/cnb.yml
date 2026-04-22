"use client";

import { useCallback } from "react";
import { Collapsible } from "@/components/ui/Collapsible";
import { KeyValueEditor } from "@/components/ui/KeyValueEditor";
import { useConfig } from "@/contexts/ConfigContext";
import type {
  LockConfig,
  PipelineBlock,
  PipelineConfig,
  ServiceItem,
  StageConfig,
} from "@/types/cnb";
import { COMMON_EVENTS } from "@/types/cnb";
import { StageList } from "./StageList";

const KNOWN_SERVICES = ["docker", "vscode"] as const;

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

interface BlockFormCardProps {
  block: PipelineBlock;
}

export function BlockFormCard({ block }: BlockFormCardProps) {
  const { selectedBlockId, selectBlock, updateBlock, removeBlock } =
    useConfig();
  const isSelected = selectedBlockId === block.id;

  const update = useCallback(
    (patch: Partial<PipelineBlock>) => updateBlock(block.id, patch),
    [block.id, updateBlock],
  );

  const updatePipeline = useCallback(
    (patch: Partial<PipelineConfig>) =>
      update({ pipeline: { ...block.pipeline, ...patch } }),
    [block.pipeline, update],
  );

  const dockerImage =
    typeof block.pipeline.docker?.image === "string"
      ? block.pipeline.docker.image
      : typeof block.pipeline.docker?.image === "object"
        ? block.pipeline.docker.image.name
        : "";

  const servicesList = block.pipeline.services ?? [];
  const getServiceName = (s: ServiceItem) =>
    typeof s === "string" ? s : s.name;
  const serviceNames = servicesList.map(getServiceName);
  const dockerService = servicesList.find(
    (s) => getServiceName(s) === "docker",
  );
  const dockerOptions =
    dockerService && typeof dockerService === "object"
      ? dockerService.options
      : undefined;
  const rootlessBuildkitdEnabled = !!(
    dockerOptions as Record<string, Record<string, unknown>> | undefined
  )?.rootlessBuildkitd?.enabled;

  const vscodeSvc = servicesList.find((s) => getServiceName(s) === "vscode");
  const vscodeOptions =
    vscodeSvc && typeof vscodeSvc === "object" ? vscodeSvc.options : undefined;
  const keepAliveTimeout = (
    vscodeOptions as Record<string, unknown> | undefined
  )?.keepAliveTimeout as string | undefined;

  const toggleService = useCallback(
    (svcName: string, checked: boolean) => {
      let next: ServiceItem[];
      if (checked) {
        next = [...servicesList, svcName];
      } else {
        next = servicesList.filter((s) => getServiceName(s) !== svcName);
      }
      updatePipeline({ services: next.length > 0 ? next : undefined });
    },
    [servicesList, updatePipeline],
  );

  const toggleRootlessBuildkitd = useCallback(
    (checked: boolean) => {
      const newServices = servicesList.map((s) => {
        if (getServiceName(s) !== "docker") return s;
        if (checked) {
          return {
            name: "docker",
            options: { rootlessBuildkitd: { enabled: true } },
          };
        }
        return "docker";
      });
      updatePipeline({ services: newServices });
    },
    [servicesList, updatePipeline],
  );

  const updateVscodeKeepAlive = useCallback(
    (val: string) => {
      const newServices = servicesList.map((s) => {
        if (getServiceName(s) !== "vscode") return s;
        if (val) {
          return { name: "vscode", options: { keepAliveTimeout: val } };
        }
        return "vscode";
      });
      updatePipeline({ services: newServices });
    },
    [servicesList, updatePipeline],
  );

  const imports = toArray(block.pipeline.imports);
  const ifModifyArr = toArray(block.pipeline.ifModify);
  const dockerVolumes = toArray(block.pipeline.docker?.volumes);
  const runnerTags = toArray(block.pipeline.runner?.tags);

  const updateImports = useCallback(
    (newImports: string[]) => {
      updatePipeline({
        imports: newImports.length === 0 ? undefined : newImports,
      });
    },
    [updatePipeline],
  );

  return (
    <div
      className={`rounded-lg border transition-all ${
        isSelected
          ? "border-blue-400 dark:border-blue-500 shadow-sm shadow-blue-100 dark:shadow-blue-900/20"
          : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      {/* Card header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => selectBlock(isSelected ? null : block.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            selectBlock(isSelected ? null : block.id);
        }}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-t-lg cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3.5 h-3.5 shrink-0 text-zinc-400 transition-transform ${isSelected ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
            {block.pipeline.name || "Pipeline"}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-mono shrink-0">
            {block.branch}:{block.event}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
          className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Card body */}
      {isSelected && (
        <div className="px-3 pb-3 space-y-3 border-t border-zinc-100 dark:border-zinc-700/50 pt-3">
          {/* Branch + Event */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">
                分支
              </label>
              <input
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                value={block.branch}
                onChange={(e) => update({ branch: e.target.value })}
                placeholder="main"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">
                触发事件
              </label>
              <EventSelector
                value={block.event}
                onChange={(event) => update({ event })}
              />
            </div>
          </div>

          {/* Pipeline name */}
          <div>
            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">
              流水线名称 (可选)
            </label>
            <input
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={block.pipeline.name ?? ""}
              onChange={(e) =>
                updatePipeline({ name: e.target.value || undefined })
              }
              placeholder="pipeline"
            />
          </div>

          {/* Docker 环境 */}
          <Collapsible
            title="Docker 环境"
            defaultOpen={!!block.pipeline.docker?.image}
          >
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">
                  环境镜像 (docker.image)
                </label>
                <input
                  className="w-full px-2 py-1.5 text-sm font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={dockerImage}
                  onChange={(e) =>
                    updatePipeline({
                      docker: {
                        ...block.pipeline.docker,
                        image: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="node:22"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">
                  Dockerfile 构建 (docker.build)
                </label>
                <input
                  className="w-full px-2 py-1.5 text-sm font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={
                    typeof block.pipeline.docker?.build === "string"
                      ? block.pipeline.docker.build
                      : (block.pipeline.docker?.build?.dockerfile ?? "")
                  }
                  onChange={(e) =>
                    updatePipeline({
                      docker: {
                        ...block.pipeline.docker,
                        build: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="./Dockerfile"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">
                  Devcontainer (docker.devcontainer)
                </label>
                <input
                  className="w-full px-2 py-1.5 text-sm font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={block.pipeline.docker?.devcontainer ?? ""}
                  onChange={(e) =>
                    updatePipeline({
                      docker: {
                        ...block.pipeline.docker,
                        devcontainer: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder=".devcontainer/devcontainer.json"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">
                  数据卷 (docker.volumes) — 每行一条
                </label>
                <textarea
                  className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[40px]"
                  value={dockerVolumes.join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split("\n")
                      .filter((l) => l.trim());
                    updatePipeline({
                      docker: {
                        ...block.pipeline.docker,
                        volumes: lines.length > 0 ? lines : undefined,
                      },
                    });
                  }}
                  placeholder="/root/.npm&#10;main:/root/.gradle:copy-on-write"
                  rows={2}
                />
              </div>
            </div>
          </Collapsible>

          {/* Services */}
          <Collapsible
            title="Services (构建服务)"
            defaultOpen={serviceNames.length > 0}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                {KNOWN_SERVICES.map((svc) => (
                  <label
                    key={svc}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={serviceNames.includes(svc)}
                      onChange={(e) => toggleService(svc, e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="font-mono text-xs">{svc}</span>
                  </label>
                ))}
              </div>
              {serviceNames.includes("docker") && (
                <div className="ml-5 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={rootlessBuildkitdEnabled}
                      onChange={(e) =>
                        toggleRootlessBuildkitd(e.target.checked)
                      }
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="font-mono">
                      rootlessBuildkitd (跨平台构建 buildx)
                    </span>
                  </label>
                </div>
              )}
              {serviceNames.includes("vscode") && (
                <div className="ml-5 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div>
                    <label className="text-[11px] text-zinc-500 mb-1 block">
                      keepAliveTimeout (离线保活)
                    </label>
                    <input
                      className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      value={keepAliveTimeout ?? ""}
                      onChange={(e) => updateVscodeKeepAlive(e.target.value)}
                      placeholder="10m (默认)"
                    />
                  </div>
                </div>
              )}
            </div>
          </Collapsible>

          {/* Imports */}
          <Collapsible
            title="Imports (导入环境变量)"
            defaultOpen={imports.length > 0}
            actions={
              <button
                type="button"
                onClick={() => updateImports([...imports, ""])}
                className="px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                + 添加
              </button>
            }
          >
            <div className="space-y-2">
              {imports.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-1">
                  点击右上角「+ 添加」导入环境变量文件
                </p>
              )}
              {imports.map((imp, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <input
                    className="flex-1 px-2 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={imp}
                    onChange={(e) => {
                      const next = [...imports];
                      next[idx] = e.target.value;
                      updateImports(next);
                    }}
                    placeholder="https://cnb.cool/user/repo/-/blob/main/secret.yml"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateImports(imports.filter((_, i) => i !== idx))
                    }
                    className="px-2 py-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </Collapsible>

          {/* Stages */}
          <StageList
            stages={block.pipeline.stages}
            onChange={(stages: StageConfig[]) => updatePipeline({ stages })}
          />

          {/* failStages */}
          <Collapsible title="失败时执行 (failStages)">
            <StageList
              stages={block.pipeline.failStages ?? []}
              onChange={(failStages: StageConfig[]) =>
                updatePipeline({
                  failStages: failStages.length > 0 ? failStages : undefined,
                })
              }
              label="failStages"
            />
          </Collapsible>

          {/* endStages */}
          <Collapsible title="结束时执行 (endStages)">
            <StageList
              stages={block.pipeline.endStages ?? []}
              onChange={(endStages: StageConfig[]) =>
                updatePipeline({
                  endStages: endStages.length > 0 ? endStages : undefined,
                })
              }
              label="endStages"
            />
          </Collapsible>

          {/* env */}
          <Collapsible title="环境变量 (env)">
            <KeyValueEditor
              value={block.pipeline.env ?? {}}
              onChange={(env) =>
                updatePipeline({
                  env: Object.keys(env).length > 0 ? env : undefined,
                })
              }
            />
          </Collapsible>

          {/* label */}
          <Collapsible title="流水线标签 (label)">
            <KeyValueEditor
              value={Object.fromEntries(
                Object.entries(block.pipeline.label ?? {}).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v.join(", ") : v,
                ]),
              )}
              onChange={(label) =>
                updatePipeline({
                  label:
                    Object.keys(label).length > 0
                      ? Object.fromEntries(
                          Object.entries(label).map(([k, v]) => [
                            k,
                            v.includes(",")
                              ? v.split(",").map((s) => s.trim())
                              : v,
                          ]),
                        )
                      : undefined,
                })
              }
              keyPlaceholder="type"
              valuePlaceholder="RELEASE (逗号分隔多个值)"
            />
          </Collapsible>

          {/* 条件执行 */}
          <Collapsible title="条件执行">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={!!block.pipeline.ifNewBranch}
                    onChange={(e) =>
                      updatePipeline({
                        ifNewBranch: e.target.checked || undefined,
                      })
                    }
                    className="rounded border-zinc-300"
                  />
                  仅新分支执行 (ifNewBranch)
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={!!block.pipeline.breakIfModify}
                    onChange={(e) =>
                      updatePipeline({
                        breakIfModify: e.target.checked || undefined,
                      })
                    }
                    className="rounded border-zinc-300"
                  />
                  源分支更新时终止 (breakIfModify)
                </label>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 mb-1 block">
                  文件变更时执行 (ifModify) — 每行一个 glob 表达式
                </label>
                <textarea
                  className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[40px]"
                  value={ifModifyArr.join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split("\n")
                      .filter((l) => l.trim());
                    updatePipeline({
                      ifModify: lines.length > 0 ? lines : undefined,
                    });
                  }}
                  placeholder="**/*.js&#10;src/**"
                  rows={2}
                />
              </div>
            </div>
          </Collapsible>

          {/* 高级配置 */}
          <Collapsible title="高级配置">
            <div className="space-y-3">
              {/* Runner */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-500 mb-1 block">
                    Runner CPUs
                  </label>
                  <input
                    type="number"
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={block.pipeline.runner?.cpus ?? ""}
                    onChange={(e) =>
                      updatePipeline({
                        runner: {
                          ...block.pipeline.runner,
                          cpus: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    placeholder="默认"
                    min={1}
                    max={64}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 mb-1 block">
                    Runner Tags
                  </label>
                  <input
                    className="w-full px-2 py-1.5 text-sm font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={runnerTags.join(", ")}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      updatePipeline({
                        runner: {
                          ...block.pipeline.runner,
                          tags:
                            tags.length === 0
                              ? undefined
                              : tags.length === 1
                                ? tags[0]
                                : tags,
                        },
                      });
                    }}
                    placeholder="cnb:arch:amd64"
                  />
                </div>
              </div>
              {/* Git */}
              <div className="space-y-2">
                <span className="text-[11px] text-zinc-500 block">
                  Git 配置
                </span>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={block.pipeline.git?.enable !== false}
                      onChange={(e) =>
                        updatePipeline({
                          git: {
                            ...block.pipeline.git,
                            enable: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-zinc-300"
                    />
                    拉取代码 (git.enable)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={
                        block.pipeline.git?.submodules === true ||
                        (typeof block.pipeline.git?.submodules === "object" &&
                          block.pipeline.git.submodules.enable !== false)
                      }
                      onChange={(e) =>
                        updatePipeline({
                          git: {
                            ...block.pipeline.git,
                            submodules: e.target.checked || undefined,
                          },
                        })
                      }
                      className="rounded border-zinc-300"
                    />
                    拉取子模块 (submodules)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={
                        block.pipeline.git?.lfs === true ||
                        (typeof block.pipeline.git?.lfs === "object" &&
                          block.pipeline.git.lfs.enable !== false)
                      }
                      onChange={(e) =>
                        updatePipeline({
                          git: {
                            ...block.pipeline.git,
                            lfs: e.target.checked || undefined,
                          },
                        })
                      }
                      className="rounded border-zinc-300"
                    />
                    拉取 LFS (lfs)
                  </label>
                </div>
              </div>
              {/* Lock */}
              <div>
                <label className="flex items-center gap-1.5 text-xs mb-2">
                  <input
                    type="checkbox"
                    checked={!!block.pipeline.lock}
                    onChange={(e) =>
                      updatePipeline({
                        lock: e.target.checked ? true : undefined,
                      })
                    }
                    className="rounded border-zinc-300"
                  />
                  流水线锁 (lock)
                </label>
                {block.pipeline.lock &&
                  typeof block.pipeline.lock === "object" && (
                    <LockEditor
                      lock={block.pipeline.lock}
                      onChange={(lock) => updatePipeline({ lock })}
                    />
                  )}
                {block.pipeline.lock === true && (
                  <button
                    type="button"
                    onClick={() =>
                      updatePipeline({ lock: { key: "", wait: false } })
                    }
                    className="text-[11px] text-blue-600 hover:underline ml-5"
                  >
                    自定义锁参数
                  </button>
                )}
              </div>
              {/* Misc toggles */}
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={!!block.pipeline.allowFailure}
                    onChange={(e) =>
                      updatePipeline({
                        allowFailure: e.target.checked || undefined,
                      })
                    }
                    className="rounded border-zinc-300"
                  />
                  允许失败 (allowFailure)
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={!!block.pipeline.sandbox}
                    onChange={(e) =>
                      updatePipeline({
                        sandbox: e.target.checked || undefined,
                      })
                    }
                    className="rounded border-zinc-300"
                  />
                  沙箱模式 (sandbox)
                </label>
              </div>
              {/* Retry */}
              <div>
                <label className="text-[11px] text-zinc-500 mb-1 block">
                  失败重试次数 (retry)
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={block.pipeline.retry ?? ""}
                  onChange={(e) =>
                    updatePipeline({
                      retry: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0"
                  min={0}
                  max={5}
                />
              </div>
            </div>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

/* ---- Sub-components ---- */

function EventSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isCrontab = value.startsWith("crontab:");
  const isKnown =
    COMMON_EVENTS.some((e) => e.value === value && e.value !== "__crontab__") ||
    isCrontab;

  const selectValue = isCrontab
    ? "__crontab__"
    : isKnown
      ? value
      : "__custom__";

  return (
    <div className="space-y-1">
      <select
        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__crontab__") {
            onChange("crontab:0 2 * * *");
          } else if (v !== "__custom__") {
            onChange(v);
          }
        }}
      >
        {COMMON_EVENTS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
        {!isKnown && <option value="__custom__">{value}</option>}
      </select>
      {isCrontab && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 shrink-0">crontab:</span>
          <input
            className="flex-1 px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            value={value.replace("crontab:", "")}
            onChange={(e) => onChange(`crontab:${e.target.value}`)}
            placeholder="0 2 * * *"
          />
        </div>
      )}
      {!isKnown && !isCrontab && (
        <input
          className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="自定义事件名"
        />
      )}
    </div>
  );
}

function LockEditor({
  lock,
  onChange,
}: {
  lock: LockConfig;
  onChange: (lock: LockConfig) => void;
}) {
  return (
    <div className="ml-5 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-zinc-500 mb-1 block">
            锁名 (key)
          </label>
          <input
            className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded outline-none"
            value={lock.key ?? ""}
            onChange={(e) =>
              onChange({ ...lock, key: e.target.value || undefined })
            }
            placeholder="默认: 分支名-流水线名"
          />
        </div>
        <div>
          <label className="text-[11px] text-zinc-500 mb-1 block">
            过期时间 (expires, 秒)
          </label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded outline-none"
            value={lock.expires ?? ""}
            onChange={(e) =>
              onChange({
                ...lock,
                expires: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="3600"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-zinc-500 mb-1 block">
            等待超时 (timeout, 秒)
          </label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded outline-none"
            value={lock.timeout ?? ""}
            onChange={(e) =>
              onChange({
                ...lock,
                timeout: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="3600"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-end pb-1">
          <label className="flex items-center gap-1 text-[11px]">
            <input
              type="checkbox"
              checked={!!lock.wait}
              onChange={(e) =>
                onChange({ ...lock, wait: e.target.checked || undefined })
              }
              className="rounded border-zinc-300"
            />
            等待锁
          </label>
          <label className="flex items-center gap-1 text-[11px]">
            <input
              type="checkbox"
              checked={!!lock["cancel-in-progress"]}
              onChange={(e) =>
                onChange({
                  ...lock,
                  "cancel-in-progress": e.target.checked || undefined,
                })
              }
              className="rounded border-zinc-300"
            />
            取消进行中
          </label>
        </div>
      </div>
    </div>
  );
}
