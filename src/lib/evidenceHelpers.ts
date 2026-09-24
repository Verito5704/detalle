import { EvidenceItem } from '../types';

/**
 * Creates SVG Data URLs representing realistic captured evidence screens
 * (system down, network outage, ticket resolution).
 */
export const SAMPLE_EVIDENCE_CRM_ERROR: string =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
  <rect width="600" height="340" fill="#0f172a" rx="8"/>
  <rect width="600" height="36" fill="#1e293b" rx="8"/>
  <circle cx="20" cy="18" r="5" fill="#ef4444"/>
  <circle cx="36" cy="18" r="5" fill="#f59e0b"/>
  <circle cx="52" cy="18" r="5" fill="#10b981"/>
  <text x="75" y="22" fill="#94a3b8" font-family="monospace" font-size="12">CRM Cloud Enterprise - Error 503: Service Temporarily Unavailable</text>
  <rect x="50" y="70" width="500" height="230" fill="#1e293b" rx="6" stroke="#ef4444" stroke-width="1.5"/>
  <circle cx="300" cy="120" r="28" fill="#ef4444" fill-opacity="0.15"/>
  <path d="M290 120 L310 120 M300 108 L300 126" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
  <text x="300" y="170" fill="#f87171" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">ERROR DE CONEXIÓN CON SERVIDOR CENTRAL</text>
  <text x="300" y="195" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">No fue posible establecer conexión con el gateway de telefonía y CRM.</text>
  <text x="300" y="215" fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">Incidente: INC-88291 | Latencia: Timeout (15000ms)</text>
  <rect x="230" y="240" width="140" height="30" fill="#ef4444" rx="4"/>
  <text x="300" y="260" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="12" text-anchor="middle">Reintentar Conexión</text>
  <text x="560" y="325" fill="#475569" font-family="monospace" font-size="10" text-anchor="end">Evidencia Capturada: Apex Workspace Log</text>
</svg>
`);

export const SAMPLE_EVIDENCE_NETWORK_OUTAGE: string =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
  <rect width="600" height="340" fill="#1e1e2e" rx="8"/>
  <rect width="600" height="36" fill="#11111b" rx="8"/>
  <circle cx="20" cy="18" r="5" fill="#f38ba8"/>
  <circle cx="36" cy="18" r="5" fill="#f9e2af"/>
  <circle cx="52" cy="18" r="5" fill="#a6e3a1"/>
  <text x="75" y="22" fill="#cdd6f4" font-family="monospace" font-size="12">VPN Client &amp; Network Health Monitor</text>
  <rect x="40" y="65" width="520" height="240" fill="#181825" rx="6" stroke="#f38ba8" stroke-width="1.5"/>
  <text x="60" y="100" fill="#f38ba8" font-family="monospace" font-weight="bold" font-size="14">&gt; PING vpn.apex.internal (10.150.2.1):</text>
  <text x="60" y="125" fill="#bac2de" font-family="monospace" font-size="12">Request timeout for icmp_seq 0</text>
  <text x="60" y="145" fill="#bac2de" font-family="monospace" font-size="12">Request timeout for icmp_seq 1</text>
  <text x="60" y="165" fill="#bac2de" font-family="monospace" font-size="12">Request timeout for icmp_seq 2</text>
  <text x="60" y="185" fill="#bac2de" font-family="monospace" font-size="12">Request timeout for icmp_seq 3</text>
  <text x="60" y="215" fill="#f38ba8" font-family="monospace" font-weight="bold" font-size="13">--- Estado: Conexión Caída / 100% Packet Loss ---</text>
  <text x="60" y="240" fill="#a6adc8" font-family="monospace" font-size="11">Túnel IPSec desconectado a las 10:15 hs. Microcorte detectado.</text>
  <rect x="60" y="260" width="220" height="24" fill="#313244" rx="4"/>
  <text x="170" y="276" fill="#f9e2af" font-family="monospace" font-size="11" text-anchor="middle">Ticket IT abierto: #IT-77402</text>
</svg>
`);

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
