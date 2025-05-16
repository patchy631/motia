import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { ExpressLayerType } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { handleError } from './utils'
import type { TracingOptions } from './types'


export const initializeTracing = (options: TracingOptions): NodeSDK => {
  const {
    serviceName,
    serviceVersion,
    environment,
    endpoint,
    debug,
    customAttributes
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
    url: `${endpoint}/v1/traces`,
  })

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: createInstrumentations(),
  })

  setupShutdownHandler(sdk, debug)

  return sdk
}

const createInstrumentations = (): any[] => {
  return [
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
    new HttpInstrumentation({
      responseHook: (span, response) => {
        if (response.statusCode && response.statusCode >= 400) {
          span.setAttribute('error.type', `HTTP ${response.statusCode}`)
        }
      },
    }),
  ]
}


const setupShutdownHandler = (sdk: NodeSDK, debug: boolean): void => {
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => debug && console.log('Tracing terminated'))
      .catch((error) => handleError(error, 'terminating tracing', debug))
      .finally(() => process.exit(0))
  })
}
