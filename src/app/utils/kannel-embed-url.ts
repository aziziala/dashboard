import { environment } from '../../environments/environment';

/**
 * Base URL for the Kannel / SMS UI embedded in iframes.
 * When `environment.kannelEmbedBaseUrl` is set, it wins; otherwise the host
 * is taken from `window.location` so phones and PCs hitting the same server
 * (e.g. same host as the dashboard on port 5000) load Kannel on that host, port 8081 — not device localhost.
 */
export function buildKannelEmbedBaseUrl(): string {
  const override = environment.kannelEmbedBaseUrl?.trim();
  if (override) {
    return override.replace(/\/$/, '');
  }
  if (typeof window === 'undefined' || !window.location?.hostname) {
    return 'http://localhost:8081';
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8081`;
}
