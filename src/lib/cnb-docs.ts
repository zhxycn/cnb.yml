export const CNB_DOCS = `
# CNB 流水线 .cnb.yml 语法手册（精简版）

## 基本结构
层级：触发分支 → 触发事件 → Pipeline → Stage → Job

\`\`\`yaml
main:           # 触发分支
  push:         # 触发事件
    - name: my-pipeline
      stages:
        - name: step-1
          script: echo "hello"
\`\`\`

## 触发分支
支持精确匹配（main）、glob 通配（feature/*）、兜底匹配（$）。
多个 glob 同时匹配时并行执行。

## 触发事件
| 事件名 | 触发时机 |
|--------|----------|
| push | 代码推送到分支 |
| commit.add | 分支推送含新提交 |
| branch.create | 分支创建 |
| branch.delete | 分支删除 |
| pull_request | PR 创建/重开/源分支 push |
| pull_request.update | PR 内容更新（含 title/description 修改） |
| pull_request.target | PR 事件，代码取目标分支 |
| pull_request.mergeable | PR 满足合并条件 |
| pull_request.merged | PR 合并完成 |
| pull_request.approved | PR 评审允许合并 |
| pull_request.comment | PR 评论创建 |
| tag_push | Tag 推送 |
| auto_tag | 页面点击自动生成 Tag |
| web_trigger | 页面自定义事件触发 |
| api_trigger | API 请求触发 |
| issue.open/close/reopen/update/comment | Issue 事件 |
| issue.comment@npc / pull_request.comment@npc | NPC 事件 |

## Pipeline 配置项
| 配置项 | 类型 | 说明 |
|--------|------|------|
| name | String | 流水线名称 |
| runner | Object | 构建节点 {tags, cpus} |
| docker | Object | Docker 环境 {image, build, devcontainer, volumes} |
| git | Object | Git 配置 {enable, submodules, lfs} |
| services | Array | 构建服务（docker, vscode） |
| env | Object | 环境变量 |
| imports | Array/String | 从文件导入环境变量 |
| label | Object | 流水线标签 |
| stages | Array | 阶段任务列表（串行） |
| failStages | Array | 失败时执行的任务 |
| endStages | Array | 结束时执行的任务 |
| ifNewBranch | Boolean | 仅新分支时执行 |
| ifModify | Array/String | 文件变更时执行（glob） |
| breakIfModify | Boolean | 源分支更新时终止 |
| retry | Number | 失败重试次数 |
| allowFailure | Boolean | 允许失败 |
| lock | Object/Boolean | 流水线锁 {key, expires, timeout, cancel-in-progress, wait} |
| sandbox | Boolean | 沙箱模式（禁用 CNB_TOKEN） |

## docker 配置
### docker.image
\`\`\`yaml
docker:
  image: node:20              # 简写
  image:                      # 完整写法
    name: docker.cnb.cool/images/env:1.0
    dockerUser: $DOCKER_USER
    dockerPassword: $DOCKER_PASSWORD
\`\`\`

### docker.build（从 Dockerfile 构建环境）
\`\`\`yaml
docker:
  build:
    dockerfile: ./Dockerfile
    target: builder
    by: [package.json, package-lock.json]
    versionBy: [package-lock.json]
\`\`\`

### docker.volumes（缓存）
类型：read-write(rw), read-only(ro), copy-on-write(cow 默认), data
\`\`\`yaml
docker:
  volumes:
    - /root/.npm                        # cow 默认
    - main:/root/.gradle:copy-on-write  # 指定组和类型
\`\`\`

## services
\`\`\`yaml
services:
  - docker          # 开启 dind，自动登录 CNB Docker 制品库
  - vscode          # 云原生开发环境
\`\`\`

Docker 服务自动登录后可直接 push：
\`\`\`yaml
- services:
    - docker
  stages:
    - name: build and push
      script: |
        docker build -t \${CNB_DOCKER_REGISTRY}/\${CNB_REPO_SLUG_LOWERCASE}:latest .
        docker push \${CNB_DOCKER_REGISTRY}/\${CNB_REPO_SLUG_LOWERCASE}:latest
\`\`\`

buildx 多架构构建需开启 rootlessBuildkitd：
\`\`\`yaml
services:
  - name: docker
    options:
      rootlessBuildkitd:
        enabled: true
\`\`\`

## Stage 配置项
| 配置项 | 类型 | 说明 |
|--------|------|------|
| name | String | 阶段名称 |
| ifNewBranch | Boolean | 仅新分支执行 |
| ifModify | Array/String | 文件变更执行 |
| if | String | shell 条件脚本（退出码 0 则执行） |
| env | Object | 环境变量（优先级高于 Pipeline env） |
| imports | Array/String | 导入环境变量 |
| retry | Number | 重试次数 |
| lock | Object/Boolean | 阶段锁 |
| image | Object/String | 环境镜像 |
| jobs | Array/Object | 任务列表（数组=串行，对象=并行） |

## Job 配置项
三种类型：脚本任务(script)、插件任务(image+settings)、内置任务(type+options)

| 配置项 | 类型 | 说明 |
|--------|------|------|
| name | String | 任务名称 |
| script | Array/String | Shell 脚本 |
| image | Object/String | 运行环境/插件镜像 |
| settings | Object | 插件参数 |
| settingsFrom | Array/String | 从文件加载插件参数 |
| type | String | 内置任务类型 |
| options | Object | 内置任务参数 |
| env | Object | 环境变量（最高优先级） |
| imports | Array/String | 导入环境变量 |
| exports | Object | 导出变量给后续任务 |
| timeout | Number/String | 超时时间（默认1h，最大12h） |
| allowFailure | Boolean | 允许失败 |
| retry | Number | 重试次数 |
| if | String | 条件脚本 |
| ifModify | Array/String | 文件变更执行 |
| ifNewBranch | Boolean | 新分支执行 |
| lock | Object/Boolean | 任务锁 |

脚本简写：
\`\`\`yaml
stages:
  - echo hello    # 等同于 {name: "echo hello", script: "echo hello"}
\`\`\`

## imports 与环境变量
\`\`\`yaml
imports:
  - ./env.yml                    # 本地相对路径
  - https://cnb.cool/repo/-/blob/main/secret.yml  # 远程文件
env:
  MY_VAR: value                  # env 优先级高于 imports
\`\`\`

## exports 导出变量
\`\`\`yaml
- name: make info
  script: echo 'result-value'
  exports:
    info: RESULT          # 将任务输出 info 导出为 RESULT
- name: use result
  script: echo $RESULT
\`\`\`

## include 配置复用
\`\`\`yaml
include:
  - ./template.yml
  - https://cnb.cool/repo/-/blob/main/shared.yml
  - path: optional.yml
    ignoreError: true
  - config:           # 内联配置
      main:
        push:
          - stages:
              - echo "inline"
\`\`\`
合并规则：数组追加，对象同名键覆盖。本地 .cnb.yml 覆盖 include 的配置。

## 常用内置任务
| type | 说明 |
|------|------|
| cnb:trigger | 触发其他仓库流水线 |
| cnb:apply | 在当前构建中触发流水线 |
| cnb:read-file | 读取文件内容 |
| cnb:merge | PR 自动合并 |
| cnb:release | 创建 Release |

## YAML 锚点复用
\`\`\`yaml
.push_pipeline: &push_pipeline
  stages:
    - name: build
      script: npm run build

main:
  push:
    - *push_pipeline
feature/*:
  push:
    - *push_pipeline
\`\`\`

## 退出码
| 退出码 | 说明 |
|--------|------|
| 0 | 成功，继续后续 |
| 78 | 成功，但中断流水线 |
| 其他 | 失败，中断流水线 |

## 常用环境变量
| 变量 | 说明 |
|------|------|
| CNB_BRANCH | 当前分支名 |
| CNB_COMMIT | 当前 commit SHA |
| CNB_REPO_SLUG | 仓库 slug（如 team/project） |
| CNB_REPO_SLUG_LOWERCASE | 小写仓库 slug |
| CNB_REPO_URL_HTTPS | 仓库 HTTPS URL |
| CNB_TOKEN | 构建令牌 |
| CNB_TOKEN_USER_NAME | 令牌用户名 |
| CNB_DOCKER_REGISTRY | Docker 制品库地址 |
| CNB_IS_NEW_BRANCH | 是否新分支 |
| CNB_PR_ID | PR 编号 |
| CNB_PR_TITLE | PR 标题 |
`.trim();
