import { metrics } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

export interface MetricsOptions {
  serviceName: string
  serviceVersion: string
  environment: string
  endpoint?: string
  headers?: Record<string, string>
  exportIntervalMillis?: number
  disableDefaultMetrics?: boolean
  customAttributes?: Record<string, string>
}

export interface MotiaMetrics {
  incrementCounter: (name: string, value?: number, attributes?: Record<string, string>) => void
  recordValue: (name: string, value: number, attributes?: Record<string, string>) => void
  startTimer: (name: string, attributes?: Record<string, string>) => () => number
  recordHistogram: (name: string, value: number, attributes?: Record<string, string>) => void
  isEnabled: () => boolean
}

export function createMetricsProvider(options: MetricsOptions): MeterProvider {
  const {
    serviceName,
    serviceVersion,
    environment,
    endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
    headers = {},
    exportIntervalMillis = 30000,
    disableDefaultMetrics = false,
    customAttributes = {},
  } = options

  // Combine standard attributes with custom attributes
  const resourceAttributes = {
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
    ...customAttributes
  }

  const resource = resourceFromAttributes(resourceAttributes)

  const metricExporter = new OTLPMetricExporter({
    url: endpoint,
    headers,
  })

  const reader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis,
  })

  const meterProvider = new MeterProvider({
    resource,
    readers: [reader],
  })

  if (!disableDefaultMetrics) {
    try {
      const { HostMetrics } = require('@opentelemetry/host-metrics')
      const hostMetrics = new HostMetrics({ meterProvider, name: 'motia-host-metrics' })
      hostMetrics.start()

      const { NodeSDKMetricExporter } = require('@opentelemetry/sdk-node')
      const nodeMetrics = new NodeSDKMetricExporter({
        meterProvider,
        prefix: 'nodejs',
      })
      nodeMetrics.start()
    } catch (e) {
      console.warn('Could not initialize default metrics:', e)
    }
  }

  metrics.setGlobalMeterProvider(meterProvider)

  return meterProvider
}

/**
 * Sets up collection of system metrics at regular intervals
 * Uses only public Node.js APIs to ensure compatibility
 */
export function setupSystemMetricsCollection(metrics: MotiaMetrics, debug = false): NodeJS.Timeout {
  return setInterval(() => {
    try {
      // Memory usage metrics
      const memoryUsage = process.memoryUsage()
      metrics.recordValue('system.memory.heap.used', memoryUsage.heapUsed)
      metrics.recordValue('system.memory.heap.total', memoryUsage.heapTotal)
      metrics.recordValue('system.memory.rss', memoryUsage.rss)
      metrics.recordValue('system.memory.external', memoryUsage.external)
      
      // CPU usage metrics - using process.cpuUsage()
      const cpuUsage = process.cpuUsage()
      metrics.recordValue('system.cpu.user', cpuUsage.user)
      metrics.recordValue('system.cpu.system', cpuUsage.system)
      
      // Event loop metrics
      if (typeof process.hrtime === 'function') {
        const start = process.hrtime()
        setImmediate(() => {
          const [seconds, nanoseconds] = process.hrtime(start)
          const eventLoopLag = (seconds * 1e9 + nanoseconds) / 1e6
          metrics.recordHistogram('system.event_loop.lag_ms', eventLoopLag)
        })
      }
      
      // Use safer alternatives for handlers/request tracking
      try {
        // Get active handles count safely
        const activeHandlesCount = getActiveHandlesCount()
        if (activeHandlesCount !== undefined) {
          metrics.recordValue('system.handles.active', activeHandlesCount)
        }
        
        // Get active requests count safely
        const activeRequestsCount = getActiveRequestsCount()
        if (activeRequestsCount !== undefined) {
          metrics.recordValue('system.requests.active', activeRequestsCount)
        }
      } catch (error) {
        // Ignore errors from these non-standard functions
      }
    } catch (error) {
      if (debug) {
        console.debug('Error collecting system metrics:', error)
      }
    }
  }, 15000) // Collect every 15 seconds
}

/**
 * Safely get active handles count using process global
 * Returns undefined if the method is not available
 */
function getActiveHandlesCount(): number | undefined {
  try {
    // Using type assertion to bypass TypeScript checks for undocumented API
    const processAny = process as any
    if (typeof processAny._getActiveHandles === 'function') {
      const handles = processAny._getActiveHandles()
      return Array.isArray(handles) ? handles.length : undefined
    }
    return undefined
  } catch (error) {
    return undefined
  }
}

/**
 * Safely get active requests count using process global
 * Returns undefined if the method is not available
 */
function getActiveRequestsCount(): number | undefined {
  try {
    // Using type assertion to bypass TypeScript checks for undocumented API
    const processAny = process as any
    if (typeof processAny._getActiveRequests === 'function') {
      const requests = processAny._getActiveRequests()
      return Array.isArray(requests) ? requests.length : undefined
    }
    return undefined
  } catch (error) {
    return undefined
  }
}

export function createMetrics(instrumentationName: string): MotiaMetrics {
  const meter = metrics.getMeter(instrumentationName)
  const enabled = process.env.MOTIA_TELEMETRY_ENABLED !== 'false'

  const incrementCounter = (name: string, value = 1, attributes = {}): void => {
    if (!enabled) return
    try {
      const counter = meter.createCounter(`${name}`)
      counter.add(value, attributes)
    } catch (e) {
      console.debug('Error recording counter metric:', e)
    }
  }

  const recordValue = (name: string, value: number, attributes = {}): void => {
    if (!enabled) return
    try {
      const gauge = meter.createObservableGauge(`${name}`)
      gauge.addCallback((observableResult) => {
        observableResult.observe(value, attributes)
      })
    } catch (e) {
      console.debug('Error recording value metric:', e)
    }
  }

  const startTimer = (name: string, attributes = {}): (() => number) => {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      if (enabled) {
        recordHistogram(`${name}`, duration, attributes)
      }
      return duration
    }
  }

  const recordHistogram = (name: string, value: number, attributes = {}): void => {
    if (!enabled) return
    try {
      const histogram = meter.createHistogram(`${name}`)
      histogram.record(value, attributes)
    } catch (e) {
      console.debug('Error recording histogram metric:', e)
    }
  }

  return {
    incrementCounter,
    recordValue,
    startTimer,
    recordHistogram,
    isEnabled: () => enabled,
  }
}
