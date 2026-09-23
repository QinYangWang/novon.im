/**
 * Curated lucide icons, addressable by name from frontmatter and components:
 *
 * ```yaml
 * icon: Rocket
 * ```
 *
 * A curated map (instead of `import * as icons`) keeps the bundle tree-shakeable.
 * Icons are sized with lucide's `size` prop and inherit `currentColor` from
 * their context; there is no class-based icon styling.
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

export interface IconProps {
  icon?: string | LucideIcon | React.ReactNode
  /** Rendered size in pixels. */
  size?: number
}

/** Renders a lucide icon by name, a component, or an element. */
export function Icon({ icon, size = 16 }: IconProps) {
  if (!icon) return null

  if (typeof icon === 'string') {
    const Component = icons[icon]
    if (!Component) return null
    return <Component aria-hidden="true" size={size} />
  }

  if (React.isValidElement(icon)) {
    // Element icons are normalised to the icon slot's size and hidden from
    // assistive technology; accessible naming belongs to the label beside them.
    return React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, {
      width: size,
      height: size,
      'aria-hidden': true,
    })
  }

  const Component = icon as LucideIcon
  return <Component aria-hidden="true" size={size} />
}
