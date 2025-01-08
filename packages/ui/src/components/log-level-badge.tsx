import { Badge, BadgeProps } from './ui/badge'

export const LogLevelBadge: React.FC<{ level: string }> = (props) => {
  const map: Record<string, BadgeProps['variant']> = {
    info: 'info',
    error: 'error',
    warn: 'warning',
    debug: 'info',
  }

  return <Badge variant={map[props.level] as BadgeProps['variant']}>{props.level}</Badge>
}
