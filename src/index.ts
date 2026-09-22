/**
 * Node-facing public API of novon, for `novon.config.ts` and build tooling.
 *
 * The runtime half is re-exported so `import { Button } from 'novon'` works in
 * custom components. Config files should prefer `novon/config`, which avoids
 * pulling React in while the config is being loaded.
 *
 * Content that runs in the browser resolves `novon` to `src/runtime/index.ts`
 * through the Vite alias, which keeps Node builtins out of the client bundle.
 */
export { defineConfig, loadConfig, resolveConfig, normalizeBase, NovonError } from './config.ts'
export type { ResolvedConfig } from './config.ts'
export { definePlugin, BUILTIN_PLUGINS } from './plugins/api.ts'
export type { NovonPlugin, PluginContext, BuildContext, BuiltPage } from './plugins/api.ts'
export type { NovonConfig } from './types.ts'

export * from './runtime/index.ts'
