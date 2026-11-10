type LogLevel = 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

const LOG_LEVELS = ['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const

interface LoggerOptions {
  module?: string
  prefix?: string
  enabled?: boolean
  debug?: boolean
  icons?: boolean
  level?: LogLevel
}

interface LoggerInstance {
  log: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
  debug: (message: string, ...args: unknown[]) => void
  success: (message: string, ...args: unknown[]) => void
  trace: (message: string, ...args: unknown[]) => void
  fatal: (message: string, ...args: unknown[]) => void
}

const formatPrefix = (value?: string) => {
  if (!value) return ''
  return `[${value.toUpperCase()}]`
}

const parseLogLevel = (value: unknown, fallback: LogLevel): LogLevel => {
  if (typeof value !== 'string') return fallback

  const normalizedValue = value.toLowerCase()

  return LOG_LEVELS.includes(normalizedValue as LogLevel) ? (normalizedValue as LogLevel) : fallback
}

export const useLogger = (options: LoggerOptions = {}): LoggerInstance => {
  let config: ReturnType<typeof useRuntimeConfig> | null = null

  try {
    config = useRuntimeConfig()
  } catch {
    config = { public: {} } as ReturnType<typeof useRuntimeConfig>
  }

  const appEnv = (config.public.appEnv ?? '').toString().toLowerCase()
  const isProd = appEnv === 'prod' || import.meta.env.PROD
  const isDev = appEnv === 'dev' || (!isProd && import.meta.env.DEV)

  const enabled = options.enabled ?? isDev
  const debugEnabled = options.debug ?? isDev
  const icons = options.icons ?? true
  const level = options.level ?? parseLogLevel(undefined, isDev ? 'debug' : 'info')

  const modulePrefix = formatPrefix(options.module)
  const servicePrefix = formatPrefix(options.prefix)

  const formatMessage = (message: string): string => {
    return [servicePrefix, modulePrefix, message].filter(Boolean).join(' ')
  }

  const levelWeight: Record<LogLevel, number> = {
    silent: 0,
    fatal: 1,
    error: 2,
    warn: 3,
    info: 4,
    debug: 5,
    trace: 6,
  }

  const shouldLog = (required: LogLevel) => {
    // error et fatal restent émis même quand le logger est désactivé (production) :
    // sans eux, les incidents seraient totalement invisibles, côté client comme SSR.
    // Un `enabled: false` explicite passé en option garde la priorité et coupe tout.
    const isCriticalLevel = required === 'fatal' || required === 'error'
    if (options.enabled === false) return false
    if (!enabled && !isCriticalLevel) return false
    if ((required === 'debug' || required === 'trace') && !debugEnabled) return false
    return levelWeight[required] <= levelWeight[level]
  }

  const withIcon = (icon: string, message: string) => (icons ? `${icon} ${message}` : message)

  const consoleSink = globalThis.console

  const infoOutput = (message: string, ...args: unknown[]) => {
    consoleSink?.info(message, ...args)
  }

  const warnOutput = (message: string, ...args: unknown[]) => {
    consoleSink?.warn(message, ...args)
  }

  const errorOutput = (message: string, ...args: unknown[]) => {
    consoleSink?.error(message, ...args)
  }

  return {
    log: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        infoOutput(formatMessage(message), ...args)
      }
    },

    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        infoOutput(withIcon('ℹ️', formatMessage(message)), ...args)
      }
    },

    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        warnOutput(withIcon('⚠️', formatMessage(message)), ...args)
      }
    },

    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        errorOutput(withIcon('❌', formatMessage(message)), ...args)
      }
    },

    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        infoOutput(withIcon('🔍', formatMessage(message)), ...args)
      }
    },

    success: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        infoOutput(withIcon('✅', formatMessage(message)), ...args)
      }
    },

    trace: (message: string, ...args: unknown[]) => {
      if (shouldLog('trace')) {
        infoOutput(withIcon('🔍', formatMessage(message)), ...args)
      }
    },

    fatal: (message: string, ...args: unknown[]) => {
      if (shouldLog('fatal')) {
        errorOutput(withIcon('💀', formatMessage(message)), ...args)
      }
    },
  }
}
