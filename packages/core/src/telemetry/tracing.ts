import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { ExpressInstrumentation, ExpressLayerType } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

export interface TracingOptions {
  serviceName: string
  serviceVersion: string
  environment: string
  endpoint?: string
  debug?: boolean
  headers?: Record<string, string>
  samplingRatio?: number
  customAttributes?: Record<string, string>
}

export function initializeTracing(options: TracingOptions): NodeSDK {
  const {
    serviceName,
    serviceVersion,
    environment,
    endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    debug = false,
    headers = {},
    samplingRatio = 1.0,
    customAttributes = {}
  } = options

  if (debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
    ...customAttributes,
  })

  const traceExporter = new OTLPTraceExporter({
    url: endpoint,
    headers,
  })

  const instrumentations = [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
        ignoreLayersType: ['middleware'] as ExpressLayerType[],
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          return req.url?.includes('/health') || req.url?.includes('/readiness') || false
        },
      },
    }),
    new ExpressInstrumentation({
      requestHook: (span, info) => {
        if (info.request?.route?.path) {
          span.setAttribute('http.route', info.request.route.path)
        }
      },
    }),
    new HttpInstrumentation({
      responseHook: (span, response) => {
        if (response.statusCode && response.statusCode >= 400) {
          span.setAttribute('error.type', `HTTP ${response.statusCode}`)
        }
      },
    }),
  ]

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations,
  })

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0))
  })

  return sdk
}
