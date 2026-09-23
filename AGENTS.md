# Working on novon

- The project name is always `novon`, all lowercase, even at the start of a
  sentence. Never write `Novon`.
- For any component, theme or styling work, first read and follow
  [the novon design-system skill](.agents/skills/novon-design-system/SKILL.md)
  and the [design system guide](docs/content/guide/design-system.mdx).
- Components are styled with StyleX and expose typed `xstyle` composition only.
  There is no utility-class layer; do not reintroduce Tailwind or `className`/
  `style` styling props.
- Keep public component exports, MDX integration, React Aria behavior and site theme
  overrides compatible unless the task explicitly requests an API change.
- All documentation is written in concise English.
- Do not edit generated `dist/`, `.novon/` or documentation example build output.
- Run `bun run typecheck`, `bun run lint`, `bun test`; for styling run the docs
  build, `bun run test:browser` and `bun run test:stylex` in both the repository
  and installed-package modes described in the skill. Report checks that were
  not run.
