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
- Run `bun run typecheck`, `bun run lint`, and the E2E suites (`bun run
  test:browser`, `bun run test:stylex`) in both the repository and
  installed-package modes described in the skill. `bun test` runs the nine
  legacy isolation guards — run it, never add to it. Report checks that were
  not run.

## Testing

- Never write unit tests after you write code.
- Highly prefer E2E tests as the sole testing mechanism. Use them to verify
  complex features work. At the end of E2E tests, produce a verifiable and
  repeatable artifact.
- If you must test a system in isolation, first write down all the ways it
  could fail, then write the code.
