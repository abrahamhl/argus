import * as tls from 'node:tls';
import { Observation } from '@argus/schema';

export interface TlsCollectorOptions {
  port?: number;
  timeoutMs?: number;
  rejectUnauthorized?: boolean;
}

export interface TlsCertificateObservationValue {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  subjectAltNames: string[];
  protocol: string | null;
  cipher: tls.CipherNameAndProtocol | null;
  authorized: boolean;
  authorizationError: string | null;
}

export async function collectTls(
  hostname: string,
  runId: string,
  targetId: string,
  options: TlsCollectorOptions = {}
): Promise<Observation[]> {
  if (process.env.ARGUS_OFFLINE_MODE === 'true') {
    throw new Error('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
  }

  const port = options.port ?? 443;
  const timeoutMs = options.timeoutMs ?? 5000;
  const timestamp = new Date().toISOString();
  const collectorVersion = '0.1.0';

  return new Promise((resolve) => {
    let resolved = false;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = (socket?: tls.TLSSocket) => {
      if (timer) clearTimeout(timer);
      if (socket && !socket.destroyed) {
        socket.destroy();
      }
    };

    const finish = (obs: Observation[]) => {
      if (!resolved) {
        resolved = true;
        resolve(obs);
      }
    };

    try {
      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: options.rejectUnauthorized ?? false,
          timeout: timeoutMs
        },
        () => {
          try {
            const cert = socket.getPeerCertificate(true);
            const cipher = socket.getCipher();
            const protocol = socket.getProtocol();
            const authorized = socket.authorized;
            const authorizationError = socket.authorizationError ? String(socket.authorizationError) : null;

            cleanup(socket);

            if (!cert || Object.keys(cert).length === 0) {
              finish([
                {
                  id: `obs_tls_none_${hostname}_${Date.now()}`,
                  runId,
                  targetId,
                  type: 'TLS_NO_CERTIFICATE',
                  source: `tls://${hostname}:${port}`,
                  collector: 'argus-tls-collector',
                  collectorVersion,
                  observedAt: timestamp,
                  rawValue: { error: 'No certificate presented by host' }
                }
              ]);
              return;
            }

            const validToDate = new Date(cert.valid_to);
            const now = new Date();
            const msRemaining = validToDate.getTime() - now.getTime();
            const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
            const isExpired = msRemaining <= 0;

            const sans = cert.subjectaltname
              ? cert.subjectaltname.split(', ').map(s => s.replace(/^DNS:/, ''))
              : [];

            const value: TlsCertificateObservationValue = {
              subject: cert.subject as any,
              issuer: cert.issuer as any,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysRemaining,
              isExpired,
              subjectAltNames: sans,
              protocol,
              cipher,
              authorized,
              authorizationError
            };

            finish([
              {
                id: `obs_tls_${hostname}_${Date.now()}`,
                runId,
                targetId,
                type: 'TLS_CERTIFICATE',
                source: `tls://${hostname}:${port}`,
                collector: 'argus-tls-collector',
                collectorVersion,
                observedAt: timestamp,
                rawValue: value
              }
            ]);
          } catch (err: any) {
            cleanup(socket);
            finish([
              {
                id: `obs_tls_err_${hostname}_${Date.now()}`,
                runId,
                targetId,
                type: 'TLS_ERROR',
                source: `tls://${hostname}:${port}`,
                collector: 'argus-tls-collector',
                collectorVersion,
                observedAt: timestamp,
                rawValue: { error: err.message }
              }
            ]);
          }
        }
      );

      timer = setTimeout(() => {
        cleanup(socket);
        finish([
          {
            id: `obs_tls_timeout_${hostname}_${Date.now()}`,
            runId,
            targetId,
            type: 'TLS_TIMEOUT',
            source: `tls://${hostname}:${port}`,
            collector: 'argus-tls-collector',
            collectorVersion,
            observedAt: timestamp,
            rawValue: { error: `Connection timed out after ${timeoutMs}ms` }
          }
        ]);
      }, timeoutMs);

      socket.on('error', (err) => {
        cleanup(socket);
        finish([
          {
            id: `obs_tls_err_${hostname}_${Date.now()}`,
            runId,
            targetId,
            type: 'TLS_ERROR',
            source: `tls://${hostname}:${port}`,
            collector: 'argus-tls-collector',
            collectorVersion,
            observedAt: timestamp,
            rawValue: { error: err.message }
          }
        ]);
      });
    } catch (err: any) {
      cleanup();
      finish([
        {
          id: `obs_tls_err_${hostname}_${Date.now()}`,
          runId,
          targetId,
          type: 'TLS_ERROR',
          source: `tls://${hostname}:${port}`,
          collector: 'argus-tls-collector',
          collectorVersion,
          observedAt: timestamp,
          rawValue: { error: err.message }
        }
      ]);
    }
  });
}
