import { Express } from 'express'
import { getTraces, getTrace, getTraceWithDetails, getTraceGroups, getTraceGroup, getObservabilityStats, correlateTraces, continueCorrelation } from './observability-endpoint'

export const metricsEndpoint = (app: Express) => {
    app.get('/motia/traces', getTraces)
    app.get('/motia/traces/:traceId', getTrace)
    app.get('/motia/traces/details/:traceId', getTraceWithDetails)
    app.get('/motia/trace-groups', getTraceGroups)
    app.get('/motia/trace-groups/:correlationId', getTraceGroup)
    app.get('/motia/observability/stats', getObservabilityStats)
    app.post('/motia/traces/correlate', correlateTraces)
    app.post('/motia/traces/continue-correlation', continueCorrelation)
}