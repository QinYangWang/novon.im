/**
 * Curated lucide icons, addressable by name from frontmatter and components:
 *
 * ```yaml
 * icon: Rocket
 * ```
 *
 * A curated map (instead of `import * as icons`) keeps the bundle tree-shakeable.
 */
import * as React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Book,
  Box,
  Bug,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Code,
  Command,
  Compass,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  Folder,
  GitBranch,
  Globe,
  GraduationCap,
  Hash,
  Heart,
  Info as InfoIcon,
  Layers,
  Lightbulb,
  Link as LinkIcon,
  List,
  Lock,
  Mail,
  Map,
  MessageSquare,
  Monitor,
  Package,
  Palette,
  Play,
  Puzzle,
  Rocket,
  Rss,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Star,
  Tag,
  Terminal,
  Upload,
  Users,
  Wand2,
  Wrench,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from './lib.ts'

export const icons: Record<string, LucideIcon> = {
  Alert: AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Book,
  Box,
  Bug,
  Calendar,
  Check,
  CheckCircle: CheckCircle2,
  Clock,
  Cloud,
  Code,
  Command,
  Compass,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Flask: FlaskConical,
  Folder,
  GitBranch,
  Globe,
  GraduationCap,
  Hash,
  Heart,
  Info: InfoIcon,
  Layers,
  Lightbulb,
  Link: LinkIcon,
  List,
  Lock,
  Mail,
  Map,
  MessageSquare,
  Monitor,
  Package,
  Palette,
  Play,
  Puzzle,
  Rocket,
  Rss,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Star,
  Tag,
  Terminal,
  Upload,
  Users,
  Wand: Wand2,
  Wrench,
  XCircle,
  Zap,
}

export interface IconProps extends React.ComponentProps<'span'> {
  icon?: string | LucideIcon | React.ReactNode
  className?: string
}

/** Renders a lucide icon by name, a component, or an element. */
export function Icon({ icon, className, ...props }: IconProps) {
  if (!icon) return null

  if (typeof icon === 'string') {
    const Component = icons[icon]
    if (!Component) return null
    return <Component aria-hidden="true" className={cn('size-4 shrink-0', className)} />
  }

  if (React.isValidElement(icon)) {
    return (
      <span className={cn('inline-flex [&_svg]:size-4', className)} {...props}>
        {icon}
      </span>
    )
  }

  const Component = icon as LucideIcon
  return <Component aria-hidden="true" className={cn('size-4 shrink-0', className)} />
}
