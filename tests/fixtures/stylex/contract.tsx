import { useEffect, useRef, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { Badge, Kbd } from 'novon'
import { colors, space } from 'novon/runtime/design-system/tokens.stylex.ts'

const styles = stylex.create({
  stack: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: space.four, minWidth: 0 },
  override: { color: colors.text, paddingInline: space.six },
  dynamic: (padding: number) => ({ paddingInline: padding }),
  responsive: { display: { default: 'none', '@media (min-width: 40rem)': 'inline-flex' } },
})

export default function Contract() {
  const ref = useRef<HTMLSpanElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(ref.current?.tagName === 'SPAN'), [])
  return <div {...stylex.props(styles.stack)} data-testid="contract" data-ready={ready}>
    {(['default', 'secondary', 'outline', 'success', 'warning', 'danger'] as const).map(variant =>
      <Badge key={variant} variant={variant} data-testid={variant}>{variant}</Badge>)}
    <Badge ref={ref} data-testid="override" variant="success" xstyle={styles.override}>Composed</Badge>
    <Badge data-testid="dynamic" xstyle={styles.dynamic(18)}>Dynamic</Badge>
    <Badge data-testid="array" xstyle={[styles.override, styles.dynamic(22)]}>Array composition</Badge>
    <Badge data-testid="null" variant={null}>No tone</Badge>
    <div data-theme="dark"><Badge data-testid="nested" variant="success">Nested dark</Badge></div>
    <div className="site-scope"><Badge data-testid="site">Site override</Badge></div>
    <Kbd data-testid="kbd" aria-label="Command K">⌘K</Kbd>
    <Kbd data-testid="responsive" xstyle={styles.responsive}>⌘K</Kbd>
    <Badge data-testid="long">A-long-status-label-that-must-not-escape-the-narrow-reading-column-or-lose-its-content</Badge>
  </div>
}
