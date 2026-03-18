import './tracing';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const exporter = new OTLPTraceExporter({
  url: process.env.TEMPO_ENDPOINT, // Grafana Cloud OLTP endpoint
  headers: {
    Authorization: `Bearer ${process.env.TEMPO_TOKEN ?? ''}`,
  },
});

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'livith-server',
  }),
  traceExporter: exporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-mysql2': { enabled: true },
      '@opentelemetry/instrumentation-fs': { enabled: false }, // 노이즈 방지
    }),
  ],
});

sdk.start();
