export type EventType =
  | "push"
  | "commit.add"
  | "branch.create"
  | "branch.delete"
  | "tag_push"
  | "auto_tag"
  | "pull_request"
  | "pull_request.target"
  | "pull_request.update"
  | "pull_request.approved"
  | "pull_request.changes_requested"
  | "pull_request.merged"
  | "pull_request.mergeable"
  | "pull_request.comment"
  | "api_trigger"
  | "web_trigger"
  | "vscode"
  | "issue.open"
  | "issue.close"
  | "issue.comment"
  | (string & {});

export const COMMON_EVENTS: { value: EventType; label: string }[] = [
  { value: "push", label: "Push (代码推送)" },
  { value: "commit.add", label: "Commit Add (新增提交)" },
  { value: "pull_request", label: "Pull Request (创建/更新)" },
  { value: "pull_request.target", label: "PR Target (目标分支)" },
  { value: "pull_request.update", label: "PR Update (更新)" },
  { value: "pull_request.approved", label: "PR 已批准" },
  { value: "pull_request.changes_requested", label: "PR 请求修改" },
  { value: "pull_request.merged", label: "PR 合并完成" },
  { value: "pull_request.mergeable", label: "PR 可合并" },
  { value: "pull_request.comment", label: "PR 评论" },
  { value: "tag_push", label: "Tag Push (推送标签)" },
  { value: "auto_tag", label: "Auto Tag (自动标签)" },
  { value: "branch.create", label: "分支创建" },
  { value: "branch.delete", label: "分支删除" },
  { value: "vscode", label: "云原生开发 (Workspaces)" },
  { value: "api_trigger", label: "API 触发" },
  { value: "web_trigger", label: "页面按钮触发" },
  { value: "issue.open", label: "Issue 创建" },
  { value: "issue.close", label: "Issue 关闭" },
  { value: "issue.comment", label: "Issue 评论" },
  { value: "__crontab__", label: "定时任务 (crontab)" },
];

export interface DockerImageObject {
  name: string;
  dockerUser?: string;
  dockerPassword?: string;
}

export interface DockerBuildObject {
  dockerfile?: string;
  target?: string;
  by?: string | string[];
  versionBy?: string | string[];
  buildArgs?: Record<string, string>;
  ignoreBuildArgsInVersion?: boolean;
  sync?: string;
}

export interface DockerConfig {
  image?: string | DockerImageObject;
  build?: string | DockerBuildObject;
  volumes?: string | string[];
  devcontainer?: string;
}

export interface GitConfig {
  enable?: boolean;
  submodules?: boolean | { enable?: boolean; remote?: boolean };
  lfs?: boolean | { enable?: boolean };
}

export interface RunnerConfig {
  tags?: string | string[];
  cpus?: number;
}

export interface LockConfig {
  key?: string;
  expires?: number;
  timeout?: number;
  "cancel-in-progress"?: boolean;
  wait?: boolean;
  "cancel-in-wait"?: boolean;
}

export interface StageLockConfig {
  key?: string;
  expires?: number;
  wait?: boolean;
  timeout?: number;
}

export interface StageConfig {
  name: string;
  script?: string | string[];
  commands?: string | string[];
  type?: string;
  options?: Record<string, unknown>;
  optionsFrom?: string | string[];
  settings?: Record<string, unknown>;
  settingsFrom?: string | string[];
  args?: string[];
  image?: string | DockerImageObject;
  env?: Record<string, string>;
  imports?: string | string[];
  exports?: Record<string, string>;
  timeout?: number | string;
  retry?: number;
  allowFailure?: boolean | string;
  lock?: StageLockConfig | boolean;
  ifModify?: string | string[];
  if?: string | string[];
  ifNewBranch?: boolean;
  breakIfModify?: boolean;
  skipIfModify?: boolean;
  jobs?: unknown;
}

export type ServiceItem =
  | string
  | {
      name: string;
      options?: Record<string, unknown>;
    };

export interface IncludeItem {
  path?: string;
  ignoreError?: boolean;
  config?: Record<string, unknown>;
}

export interface PipelineConfig {
  name?: string;
  runner?: RunnerConfig;
  docker?: DockerConfig;
  git?: GitConfig;
  services?: ServiceItem[];
  env?: Record<string, string>;
  imports?: string | string[];
  label?: Record<string, string | string[]>;
  stages: StageConfig[];
  failStages?: StageConfig[];
  endStages?: StageConfig[];
  ifNewBranch?: boolean;
  ifModify?: string | string[];
  breakIfModify?: boolean;
  retry?: number;
  allowFailure?: boolean;
  lock?: LockConfig | boolean;
  sandbox?: boolean;
}

export interface PipelineBlock {
  id: string;
  templateId?: string;
  branch: string;
  event: EventType;
  pipeline: PipelineConfig;
}

export type BlockCategory = "build" | "test" | "deploy" | "dev" | "other";

export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  category: BlockCategory;
  tags: string[];
  defaultBlock: Omit<PipelineBlock, "id">;
}
