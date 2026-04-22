import type { BlockTemplate } from "@/types/cnb";

export const blockTemplates: BlockTemplate[] = [
  /* ─── 构建 ─── */
  {
    id: "docker-build-push-cnb",
    name: "Docker 构建推送",
    description: "构建 Docker 镜像并推送到 CNB 同名制品库",
    category: "build",
    tags: ["docker", "制品库"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        services: ["docker"],
        stages: [
          {
            name: "docker build",
            script:
              "docker build -t ${CNB_DOCKER_REGISTRY}/${CNB_REPO_SLUG_LOWERCASE}:latest .",
          },
          {
            name: "docker push",
            script:
              "docker push ${CNB_DOCKER_REGISTRY}/${CNB_REPO_SLUG_LOWERCASE}:latest",
          },
        ],
      },
    },
  },
  {
    id: "docker-multiplatform",
    name: "Docker 跨平台构建",
    description: "使用 buildx 构建 amd64 + arm64 多架构镜像",
    category: "build",
    tags: ["docker", "buildx", "多架构"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        services: [
          {
            name: "docker",
            options: { rootlessBuildkitd: { enabled: true } },
          },
        ],
        env: {
          IMAGE_TAG: "${CNB_DOCKER_REGISTRY}/${CNB_REPO_SLUG_LOWERCASE}:latest",
        },
        stages: [
          {
            name: "Build and Push",
            script:
              "docker buildx build \\\n  --platform linux/amd64,linux/arm64 \\\n  --push \\\n  -t ${IMAGE_TAG} \\\n  .",
          },
        ],
      },
    },
  },
  {
    id: "go-docker-build",
    name: "Go 构建 Docker 镜像",
    description: "Go 编译 + Docker 镜像构建推送",
    category: "build",
    tags: ["go", "docker"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        docker: { image: "golang:1.24" },
        services: ["docker"],
        env: {
          IMAGE_TAG: "${CNB_DOCKER_REGISTRY}/${CNB_REPO_SLUG_LOWERCASE}:latest",
        },
        stages: [
          { name: "go build", script: "go build -o app ." },
          { name: "docker build", script: "docker build -t $IMAGE_TAG ." },
          { name: "docker push", script: "docker push $IMAGE_TAG" },
        ],
      },
    },
  },
  {
    id: "java-maven-build",
    name: "Java Maven 构建",
    description: "Maven 构建 + Docker 镜像推送",
    category: "build",
    tags: ["java", "maven"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        docker: { image: "maven:3.9-eclipse-temurin-21" },
        services: ["docker"],
        stages: [
          { name: "build", script: "mvn clean package -DskipTests" },
          {
            name: "docker build & push",
            script:
              "docker build -t ${CNB_DOCKER_REGISTRY}/${CNB_REPO_SLUG_LOWERCASE}:latest . && docker push ${CNB_DOCKER_REGISTRY}/${CNB_REPO_SLUG_LOWERCASE}:latest",
          },
        ],
      },
    },
  },
  {
    id: "docker-cache",
    name: "Docker 缓存加速",
    description: "使用 docker:cache 缓存依赖安装，加速后续构建",
    category: "build",
    tags: ["docker", "缓存"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        docker: { image: "node:22" },
        stages: [
          {
            name: "build cache",
            type: "docker:cache",
            options: {
              dockerfile: "cache.dockerfile",
              by: ["package.json", "package-lock.json"],
              versionBy: ["package-lock.json"],
            },
            exports: { name: "CACHE_IMAGE" },
          },
          {
            name: "use cache",
            image: "$CACHE_IMAGE",
            script: 'cp -r "$NODE_PATH" ./node_modules',
          },
          { name: "build", script: "npm run build" },
        ],
      },
    },
  },

  /* ─── 测试 ─── */
  {
    id: "nodejs-ci",
    name: "Node.js CI",
    description: "安装依赖、代码检查、运行测试",
    category: "test",
    tags: ["node", "npm"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        docker: { image: "node:22" },
        stages: [
          { name: "install", script: "npm install" },
          { name: "lint", script: "npm run lint" },
          { name: "test", script: "npm test" },
        ],
      },
    },
  },
  {
    id: "python-ci",
    name: "Python CI",
    description: "pip 安装依赖并运行 pytest 测试",
    category: "test",
    tags: ["python", "pytest"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        docker: { image: "python:3.12" },
        stages: [
          { name: "install", script: "pip install -r requirements.txt" },
          { name: "test", script: "pytest" },
        ],
      },
    },
  },
  {
    id: "pr-check",
    name: "PR 代码检查",
    description: "PR 时自动检查代码并运行测试",
    category: "test",
    tags: ["PR", "lint"],
    defaultBlock: {
      branch: "main",
      event: "pull_request",
      pipeline: {
        name: "pr-check",
        docker: { image: "node:22" },
        stages: [
          { name: "install", script: "npm install" },
          { name: "lint", script: "npm run lint" },
          { name: "test", script: "npm test" },
        ],
        failStages: [{ name: "notify", script: 'echo "PR check failed!"' }],
      },
    },
  },
  {
    id: "coverage-report",
    name: "单测覆盖率",
    description: "运行测试并上报代码覆盖率",
    category: "test",
    tags: ["测试", "覆盖率"],
    defaultBlock: {
      branch: "main",
      event: "push",
      pipeline: {
        docker: { image: "node:22" },
        stages: [
          {
            name: "install & test",
            script: "npm install && npm test -- --coverage",
          },
          {
            name: "coverage",
            type: "testing:coverage",
            options: { breakIfNoCoverage: false },
            exports: { lines: "COVERAGE_LINES" },
          },
          { name: "result", script: 'echo "覆盖率: ${COVERAGE_LINES}%"' },
        ],
      },
    },
  },

  /* ─── 部署 ─── */
  {
    id: "tag-release",
    name: "Tag 触发 Release",
    description: "推送 Tag 时自动创建 Release",
    category: "deploy",
    tags: ["tag", "release"],
    defaultBlock: {
      branch: "$",
      event: "tag_push",
      pipeline: {
        stages: [
          {
            name: "release",
            type: "git:release",
            options: { title: "${CNB_BRANCH}" },
          },
        ],
      },
    },
  },
  {
    id: "tag-release-changelog",
    name: "Tag Release + Changelog",
    description: "推送 Tag 时生成 Changelog 并创建 Release",
    category: "deploy",
    tags: ["tag", "changelog"],
    defaultBlock: {
      branch: "$",
      event: "tag_push",
      pipeline: {
        stages: [
          {
            name: "changelog",
            image: "cnbcool/changelog",
            settings: { latestChangeLogTarget: "LATEST_CHANGELOG.md" },
          },
          {
            name: "release",
            type: "git:release",
            options: {
              title: "${CNB_BRANCH}",
              descriptionFromFile: "LATEST_CHANGELOG.md",
            },
          },
        ],
      },
    },
  },
  {
    id: "pr-auto-merge",
    name: "PR 自动合并",
    description: "PR 通过审查后自动 squash 合并并删除源分支",
    category: "deploy",
    tags: ["PR", "自动合并"],
    defaultBlock: {
      branch: "main",
      event: "pull_request.mergeable",
      pipeline: {
        stages: [
          {
            name: "auto merge",
            type: "git:auto-merge",
            options: { mergeType: "squash", removeSourceBranch: true },
          },
        ],
      },
    },
  },
  {
    id: "npm-publish",
    name: "NPM 包发布",
    description: "构建并发布 npm 包到制品库",
    category: "deploy",
    tags: ["npm", "publish"],
    defaultBlock: {
      branch: "main",
      event: "tag_push",
      pipeline: {
        docker: { image: "node:22" },
        stages: [
          { name: "install", script: "npm install" },
          { name: "build", script: "npm run build" },
          { name: "publish", script: "npm publish" },
        ],
      },
    },
  },

  /* ─── 开发 ─── */
  {
    id: "workspaces",
    name: "云原生开发环境",
    description: "配置 Workspaces 在线开发环境",
    category: "dev",
    tags: ["vscode", "workspaces"],
    defaultBlock: {
      branch: "$",
      event: "vscode",
      pipeline: {
        services: ["vscode", "docker"],
        docker: { image: "node:22" },
        stages: [
          { name: "setup", script: "npm install" },
          { name: "ready", type: "vscode:go" },
        ],
      },
    },
  },
  {
    id: "pr-reviewer",
    name: "PR 自动添加评审人",
    description: "PR 创建时自动分配代码评审人",
    category: "dev",
    tags: ["PR", "评审"],
    defaultBlock: {
      branch: "main",
      event: "pull_request",
      pipeline: {
        stages: [
          {
            name: "add reviewer",
            type: "git:reviewer",
            options: { type: "add-reviewer", reviewers: "user1;user2" },
          },
        ],
      },
    },
  },

  /* ─── 其他 ─── */
  {
    id: "crontab-task",
    name: "定时任务",
    description: "通过 crontab 定时执行任务",
    category: "other",
    tags: ["crontab", "定时"],
    defaultBlock: {
      branch: "main",
      event: "crontab:0 2 * * *",
      pipeline: {
        docker: { image: "alpine:latest" },
        stages: [{ name: "task", script: 'echo "Running scheduled task"' }],
      },
    },
  },
  {
    id: "branch-cleanup",
    name: "分支清理通知",
    description: "分支删除时执行清理或通知",
    category: "other",
    tags: ["分支", "清理"],
    defaultBlock: {
      branch: "$",
      event: "branch.delete",
      pipeline: {
        git: { enable: false },
        stages: [
          {
            name: "notify",
            script: 'echo "Branch ${CNB_BRANCH} deleted by ${CNB_BUILD_USER}"',
          },
        ],
      },
    },
  },
];

export function getBlockTemplate(id: string): BlockTemplate | undefined {
  return blockTemplates.find((t) => t.id === id);
}
