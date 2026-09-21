import * as React from 'react'
import type { RuntimeConfig } from '../types.ts'
import type { SiteIndex } from './content.ts'

export interface SiteContextValue {
  config: RuntimeConfig
  /** Normalized base path, always starts and ends with `/`. */
  base: string
  site: SiteIndex
  /** Current pathname, already stripped of `base`. */
  url: string
}

const SiteContext = React.createContext<SiteContextValue | null>(null)

export function SiteProvider({ value, children }: { value: SiteContextValue; children: React.ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite(): SiteContextValue {
  const value = React.useContext(SiteContext)
  if (!value) throw new Error('[novon] useSite() must be used inside a novon page')
  return value
}

export function useConfig(): RuntimeConfig {
  return useSite().config
}

export function useBase(): string {
  return useSite().base
}
