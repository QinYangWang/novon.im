# novon

novon 是一个面向文档与静态内容站点的 CLI 工具。它计划提供从本地内容初始化、预览到静态构建和发布的统一入口，并以 Astro 作为后续站点渲染能力的集成方向。

当前版本已交付公共 CLI 契约和最小的 `init` 初始化闭环。`dev`、`studio`、`build`、`publish` 已注册并可显示帮助，其他业务能力会在后续版本提供。

## 系统要求

- Node.js 18.18 或更高版本
- npm 9 或更高版本

## 安装与快速检查

```bash
# 获取代码后进入仓库根目录
npm ci

# 运行全部本地质量检查
npm run check

# 直接运行尚未安装为全局命令的 CLI
node ./src/cli.js --help
```

需要在 shell 中使用 `novon` 命令时，可以执行 `npm link` 将当前 checkout 链接到本机：

```bash
npm link
novon --help
```

## 初始化项目

在准备好的空目录，或已有且不包含冲突目标文件的目录中运行：

```bash
novon init
```

命令会创建以下最小项目结构：

```text
novon.config.json
content/
└── index.mdx
```

`novon.config.json` 是后续 `dev` 和 `build` 共用的项目配置，当前最小格式为：

```json
{
  "contentDir": "content",
  "outputDir": "dist"
}
```

初始化示例页包含 `title` frontmatter 和可直接编辑的 Markdown 内容。命令只在当前工作目录操作，并且遵循以下安全策略：

- 已有的无关文件会保留，不会被覆盖。
- 如果 `novon.config.json` 或 `content/index.mdx` 已存在但内容不同，命令返回失败并拒绝覆盖。
- 重复执行且两个生成文件仍是默认内容时返回成功，并明确提示没有修改文件。
- 初始化失败时返回非零退出码，并说明冲突或文件系统错误。

## 命令契约

```text
novon init       初始化文档目录
novon dev        启动本地开发预览
novon studio     打开编辑工作台
novon build      构建静态站点文件
novon publish    发布静态站点
```

目前只有 `init` 会执行实际文件操作；`dev`、`studio`、`build` 和 `publish` 会明确提示功能尚未实现。每个命令都支持 `novon <command> --help`。

## 工程结构

```text
src/cli.js          CLI 入口和公共命令注册
 test/cli.test.js   CLI 契约测试
.github/workflows/  持续集成质量检查
```

项目选择无运行时依赖的 Node.js CLI 作为第一阶段入口：这样安装后即可运行，且不会在业务功能尚未落地时绑定命令框架。后续 Astro 集成可以在不改变命令名称的前提下按命令增加依赖和实现。Node.js 内置测试运行器用于保持干净环境中的最小验证闭环。

## 质量检查

- `npm test`：运行自动化测试。
- `npm run lint`：执行 Node.js 语法检查。
- `npm run check`：统一入口，依次执行语法检查和测试；提交前必须通过。

GitHub Actions 会在 push 和 pull request 中执行 `npm ci` 与 `npm run check`。

## 贡献

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，了解分支、测试、文档和 PR 约定。对外文案统一使用小写 `novon`；可在日志或底部标识使用 `ฅ^•ﻌ^•ฅ`。

## 许可

本项目使用 Apache License 2.0，详见 [LICENSE](LICENSE)。
