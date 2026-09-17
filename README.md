# novon

novon 是一个面向文档与静态内容站点的 CLI 工具。它计划提供从本地内容初始化、预览到静态构建和发布的统一入口，并以 Astro 作为后续站点渲染能力的集成方向。

当前版本已交付公共 CLI 契约、最小的 `init` 初始化闭环、`novon dev` 本地预览闭环和不依赖运行时框架的静态构建闭环：预览读取项目配置和 Markdown/MDX 内容，并在每次请求时重新读取文件；`build` 读取本地配置和页面并生成可直接打开或托管的 HTML。`studio`、`publish` 的其他业务能力会在后续版本提供。

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

## 快速开始：init → dev → build

下面的步骤在一个全新的目标目录中验证完整的本地闭环。文档仓库和要编写的站点目录可以分开：

```bash
# 在 novon 仓库根目录执行
npm ci
npm link

mkdir ../my-novon-site
cd ../my-novon-site
novon init
```

`novon init` 会生成 `novon.config.json` 和 `content/index.mdx`。启动预览（该命令会持续运行）：

```bash
novon dev
```

在浏览器打开命令输出的地址（默认是 `http://127.0.0.1:3000`）。在另一个终端编辑并保存 `content/index.mdx`，刷新页面即可看到变更；最后生成静态产物：

```bash
cd ../my-novon-site
novon build
```

构建完成后，`dist/index.html` 是可直接打开或交给任意静态文件托管服务的页面。使用 `Ctrl+C` 停止开发服务器。

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

`novon init` 会创建项目配置和示例内容，`novon dev` 会启动本地 HTTP 预览服务，`novon build` 会生成静态页面；`studio`、`publish` 的其他业务能力仍按后续 issue 逐步实现。所有命令都必须继续支持 `novon <command> --help`。

## 本地预览

在包含 `novon.config.json` 的项目目录中运行：

```bash
novon dev
```

配置文件使用 JSON，最小格式如下；`contentDir` 下的 `.mdx` 或 `.md` 文件会成为可访问页面，`content/index.mdx` 对应首页：

```json
{
  "contentDir": "content",
  "outputDir": "dist"
}
```

启动成功后，终端会打印类似 `http://127.0.0.1:3000` 的访问地址。可使用以下选项覆盖默认监听设置：

```bash
novon dev --port 4321
novon dev --host 0.0.0.0 --port 4321
```

预览不会缓存页面：保存 MDX 文件后刷新浏览器即可看到最新内容，无需重新初始化项目。常见启动错误及处理方式：

- 找不到配置文件或 `contentDir` 时，在目标项目目录执行 `novon init`，或检查 `novon.config.json` 的路径。
- 端口已被占用时，使用 `--port` 选择其他端口。
- 端口必须是 `0` 到 `65535` 的整数；`0` 表示让操作系统分配空闲端口。

当前预览是无运行时依赖的轻量 Markdown/MDX 阅读器，不会执行 MDX 中的 React/JSX 组件；复杂组件渲染属于后续 Astro 集成范围。

## 常见失败处理

- `novon` 找不到：确认已在仓库根目录执行 `npm link`；也可以直接使用 `node ./src/cli.js <command>`。
- `init` 报文件冲突：命令不会覆盖已有的 `novon.config.json` 或 `content/index.mdx`。先备份、移走冲突文件，或在新的目标目录重试。
- `dev` 找不到配置或内容目录：在目标项目目录执行 `novon init`，或检查 `novon.config.json` 中的 `contentDir`；配置和内容必须位于项目目录内。
- `dev` 端口被占用：使用 `novon dev --port 4321` 选择其他端口；端口必须是 `0` 到 `65535` 的整数。
- `build` 报配置、内容或页面解析错误：检查 JSON、front matter 和 Markdown/MDX 文件。失败构建返回非零状态，并保留上一次完整的 `dist` 产物。

## 默认阅读主题

`novon dev` 与 `novon build` 默认使用同一套极简阅读主题：内容栏保持窄而舒适的行长，页头只包含站点名称和紧凑的页面导航，页面以留白和排版层级组织内容，不使用后台式侧栏或卡片布局。标题、段落、链接、列表、引用、分隔线、图片、行内代码和代码块都包含统一的基础样式。

主题使用系统字体和内联 CSS，不加载外部字体、脚本或网络资源，并根据系统的浅色/深色偏好切换配色。移动端会收窄间距、折行导航，并让图片和代码块适应视口；代码块自身可以横向滚动，不造成页面级横向滚动。页脚保留小写 `novon` 与 `ฅ^•ﻌ•^ฅ` 标识。

当前定制边界是：主题作为内置默认视觉基线，不读取颜色、字体、布局等主题配置，也不提供用户主题 API。作者仍可通过现有 Markdown/MDX 和 frontmatter 编写内容、设置页面标题与描述；主题市场、完整主题 API 以及 studio 中的布局编辑不属于当前版本。

## 静态构建

当前 `build` 会在当前目录（或传入的项目目录）读取 `novon.config.json`，将 `contentDir` 中的 `.mdx` / `.md` 页面输出到 `outputDir`，默认值分别为 `content` 和 `dist`：

```bash
novon build
# 或：novon build ./my-docs --output ./my-docs/site
```

最小项目格式如下：

```text
my-docs/
├── novon.config.json
└── content/
    └── index.mdx
```

构建会为每个页面生成完整的 `index.html` 或对应的 `.html` 文件，并以临时目录准备所有页面后一次性替换输出目录。因此配置、内容缺失或页面无法解析时会返回非零状态，不会用不完整产物覆盖上一次成功的构建。代码围栏、标题、段落、列表、链接、图片和常用行内格式均可在无运行时依赖的最小 Markdown/MDX 渲染器中使用。

## 当前限制

- 当前版本只覆盖单一本地站点的 `init`、`dev` 和 `build` 闭环；`studio` 与 `publish` 仍是公共命令占位，不会执行编辑或部署。
- `dev` 和 `build` 使用无运行时依赖的最小 Markdown/MDX 渲染器，不执行 React/JSX 组件和任意 MDX JavaScript；复杂组件需要后续 Astro 集成。
- 构建输出是静态 HTML，不包含文件监听或自动部署；修改内容后需刷新预览，并再次运行 `novon build` 更新产物。

## 工程结构

```text
src/cli.js          CLI 入口和公共命令注册
src/build.js        静态构建、MDX 渲染和输出事务
 test/cli.test.js   CLI 契约测试
 test/build.test.js 构建闭环和失败安全测试
.github/workflows/  持续集成质量检查
```

项目选择无运行时依赖的 Node.js CLI 作为第一阶段入口：这样安装后即可运行，且不会在业务功能尚未落地时绑定命令框架。后续 Astro 集成可以在不改变命令名称的前提下按命令增加依赖和实现。Node.js 内置测试运行器用于保持干净环境中的最小验证闭环。

## 质量检查

- `npm test`：运行自动化测试，其中 `test/e2e.test.js` 会在临时目录通过实际 CLI 进程验证 `init → dev → 修改内容 → build` 旅程。
- `npm run lint`：执行 Node.js 语法检查。
- `npm run check`：统一入口，依次执行语法检查和测试；提交前必须通过。

GitHub Actions 会在 push 和 pull request 中执行 `npm ci` 与 `npm run check`。

## 贡献

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，了解分支、测试、文档和 PR 约定。对外文案统一使用小写 `novon`；可在日志或底部标识使用 `ฅ^•ﻌ^•ฅ`。

## 许可

本项目使用 Apache License 2.0，详见 [LICENSE](LICENSE)。
