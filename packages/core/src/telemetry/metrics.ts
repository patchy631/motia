import { Attributes, metrics } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { 
  DEFAULT_METRICS_INTERVAL, 
  handleError, 
  isTelemetryEnabled, 
  getActiveHandlesCount, 
  getActiveRequestsCount,
} from './utils'
import { MetricsOptions, MotiaMetrics } from './types'



export const createMetricsProvider = (options: MetricsOptions): MeterProvider => {
  const {
    serviceName,
    serviceVersion,
    environment,
    endpoint = process.env.MOTIA_OTEL_EXPORTER_OTLP_ENDPOINT,
    headers = {},
    exportIntervalMillis = DEFAULT_METRICS_INTERVAL,
    disableDefaultMetrics = false,
    customAttributes = {},
    debug = false,
  } = options

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
    ...customAttributes
  })

  const metricExporter = new OTLPMetricExporter({
    url: `${endpoint}:4317/v1/metrics`,
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
    } catch (e) {
      handleError(e, 'initializing default metrics', debug)
    }
  }

  metrics.setGlobalMeterProvider(meterProvider)

  return meterProvider
}

export const setupSystemMetricsCollection = (metrics: MotiaMetrics, debug = false): NodeJS.Timeout => {
  return setInterval(() => {
    try {
      collectMemoryMetrics(metrics)
      collectCpuMetrics(metrics)
      collectEventLoopMetrics(metrics)
      collectResourceMetrics(metrics, debug)
    } catch (error) {
      handleError(error, 'collecting system metrics', debug)
    }
  }, DEFAULT_METRICS_INTERVAL)
}

const collectMemoryMetrics = (metrics: MotiaMetrics): void => {
  const memoryUsage = process.memoryUsage()
  metrics.recordValue('system.memory.heap.used', memoryUsage.heapUsed)
  metrics.recordValue('system.memory.heap.total', memoryUsage.heapTotal)
  metrics.recordValue('system.memory.rss', memoryUsage.rss)
  metrics.recordValue('system.memory.external', memoryUsage.external)
}

const collectCpuMetrics = (metrics: MotiaMetrics): void => {
  const cpuUsage = process.cpuUsage()
  metrics.recordValue('system.cpu.user', cpuUsage.user)
  metrics.recordValue('system.cpu.system', cpuUsage.system)
}

const collectEventLoopMetrics = (metrics: MotiaMetrics): void => {
  if (typeof process.hrtime === 'function') {
    const start = process.hrtime()
    setImmediate(() => {
      const [seconds, nanoseconds] = process.hrtime(start)
      const eventLoopLag = (seconds * 1e9 + nanoseconds) / 1e6
      metrics.recordHistogram('system.event_loop.lag_ms', eventLoopLag)
    })
  }
}

const collectResourceMetrics = (metrics: MotiaMetrics, debug = false): void => {
  try {
    const activeHandlesCount = getActiveHandlesCount()
    if (activeHandlesCount !== undefined) {
      metrics.recordValue('system.handles.active', activeHandlesCount)
    }
    
    const activeRequestsCount = getActiveRequestsCount()
    if (activeRequestsCount !== undefined) {
      metrics.recordValue('system.requests.active', activeRequestsCount)
    }
  } catch (error) {
    handleError(error, 'collecting handles/requests metrics', debug)
  }
}

export const createMetrics = (instrumentationName: string, debug = false): MotiaMetrics => {
  const meter = metrics.getMeter(instrumentationName)
  const enabled = isTelemetryEnabled()

  const incrementCounter = (name: string, value = 1, attributes?: Attributes): void => {
    if (!enabled) return
    try {
      const counter = meter.createCounter(`${name}`)
      counter.add(value, attributes)
    } catch (e) {
      handleError(e, `recording counter metric: ${name}`, debug)
    }
  }

  const recordValue = (name: string, value: number, attributes?: Attributes): void => {
    if (!enabled) return
    try {
      const gauge = meter.createObservableGauge(`${name}`)
      gauge.addCallback((observableResult) => {
        observableResult.observe(value, attributes)
      })
    } catch (e) {
      handleError(e, `recording value metric: ${name}`, debug)
    }
  }

  const startTimer = (name: string, attributes?: Attributes): (() => number) => {
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

  const recordHistogram = (name: string, value: number, attributes?: Attributes): void => {
    if (!enabled) return
    try {
      const histogram = meter.createHistogram(`${name}`)
      histogram.record(value, attributes)
    } catch (e) {
      handleError(e, `recording histogram metric: ${name}`, debug)
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
