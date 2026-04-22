"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bug,
  CircleDot,
  Code2,
  Coffee,
  Container,
  Ellipsis,
  FileCode2,
  FlaskConical,
  GitMerge,
  GitPullRequestArrow,
  Hammer,
  HardDrive,
  Layers,
  LayoutGrid,
  MonitorSmartphone,
  Package,
  Plus,
  Rocket,
  ScrollText,
  ShieldCheck,
  Tag,
  Timer,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useConfig } from "@/contexts/ConfigContext";
import { blockTemplates } from "@/lib/blocks";
import type { BlockCategory } from "@/types/cnb";

const CATEGORIES: { value: BlockCategory | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "build", label: "构建" },
  { value: "test", label: "测试" },
  { value: "deploy", label: "部署" },
  { value: "dev", label: "开发" },
  { value: "other", label: "其他" },
];

const CATEGORY_ICON: Record<BlockCategory | "all", LucideIcon> = {
  all: LayoutGrid,
  build: Hammer,
  test: FlaskConical,
  deploy: Rocket,
  dev: Code2,
  other: Ellipsis,
};

const CATEGORY_ACCENT: Record<BlockCategory, string> = {
  build: "text-orange-500 dark:text-orange-400",
  test: "text-emerald-500 dark:text-emerald-400",
  deploy: "text-blue-500 dark:text-blue-400",
  dev: "text-violet-500 dark:text-violet-400",
  other: "text-zinc-400 dark:text-zinc-500",
};

const CATEGORY_DOT: Record<BlockCategory, string> = {
  build: "bg-orange-400",
  test: "bg-emerald-400",
  deploy: "bg-blue-400",
  dev: "bg-violet-400",
  other: "bg-zinc-400",
};

const TEMPLATE_ICON: Record<string, LucideIcon> = {
  "docker-build-push-cnb": Container,
  "docker-multiplatform": Layers,
  "go-docker-build": FileCode2,
  "java-maven-build": Coffee,
  "docker-cache": HardDrive,
  "nodejs-ci": CircleDot,
  "python-ci": Bug,
  "pr-check": GitPullRequestArrow,
  "coverage-report": ShieldCheck,
  "tag-release": Tag,
  "tag-release-changelog": ScrollText,
  "pr-auto-merge": GitMerge,
  "npm-publish": Package,
  workspaces: MonitorSmartphone,
  "pr-reviewer": UserCheck,
  "crontab-task": Timer,
  "branch-cleanup": Trash2,
};

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const { addBlock } = useConfig();
  const [filter, setFilter] = useState<BlockCategory | "all">("all");

  const filtered =
    filter === "all"
      ? blockTemplates
      : blockTemplates.filter((t) => t.category === filter);

  const handleAdd = (template: (typeof blockTemplates)[number]) => {
    addBlock(template);
    onCloseMobile?.();
  };

  return (
    <div className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            流水线片段
          </h2>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 md:hidden rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Filter pills */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON[cat.value];
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFilter(cat.value)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                  filter === cat.value
                    ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.map((template) => {
          const TemplateIcon =
            TEMPLATE_ICON[template.id] ?? CATEGORY_ICON[template.category];
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleAdd(template)}
              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-all group"
            >
              <div className="flex items-start gap-2.5">
                {/* Icon */}
                <div
                  className={`mt-0.5 shrink-0 ${CATEGORY_ACCENT[template.category]}`}
                >
                  <TemplateIcon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </span>
                    <Plus className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                    {template.description}
                  </p>
                  {/* Tags */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[template.category]}`}
                    />
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-zinc-400 dark:text-zinc-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
