/**
 * @grayjay-sources/dev-portal-client
 * 
 * GrayJay Dev Portal API Client
 * Provides device discovery and API interaction for plugin testing
 */

export { DevPortalClient } from './client';
export { discoverDevices, discoverViaMDNS, scanNetwork, checkHost, getLocalIPs } from './discovery';
export * from './types';

// Convenience function to create a client with auto-discovery
export async function createClient(options: { timeout?: number; skipMDNS?: boolean } = {}) {
  const { discoverDevices } = require('./discovery');
  const { DevPortalClient } = require('./client');
  
  const devices = await discoverDevices({ timeout: options.timeout, skipMDNS: options.skipMDNS });
  
  if (devices.length === 0) {
    throw new Error('No GrayJay dev servers found on the network');
  }
  
  return new DevPortalClient(devices[0].host, devices[0].devPort);
}
