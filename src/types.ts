/**
 * GrayJay Dev Portal Client - Type Definitions
 */

export interface DeviceInfo {
  name?: string;
  host: string;
  syncPort?: number;
  devPort: number;
  responseTime?: number;
  available: boolean;
}

export interface DiscoveryOptions {
  timeout?: number;
  skipMDNS?: boolean;
  scanNetwork?: boolean;
}

export interface PluginConfig {
  name: string;
  description?: string;
  author?: string;
  authorUrl?: string;
  platformUrl: string;
  sourceUrl?: string;
  repositoryUrl?: string;
  scriptUrl: string;
  version: number;
  iconUrl?: string;
  id: string;
  scriptSignature?: string;
  scriptPublicKey?: string;
  packages?: string[];
  allowEval?: boolean;
  allowUrls?: string[];
  supportedClaimTypes?: number[];
  constants?: {
    baseUrl?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Note: RemoteCallOptions removed - use remoteCall(id, method, ...args) directly

export interface RemoteCallResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
}

export interface DevLog {
  id: number;
  devId: string;
  type: string;
  log: string;
}

export interface DevPortalClientOptions {
  host?: string;
  port?: number;
  discoveryTimeout?: number;
}
