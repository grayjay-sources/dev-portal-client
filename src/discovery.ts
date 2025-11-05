/**
 * GrayJay Device Discovery
 * Supports mDNS (via bonjour/mdns) and network scanning
 */

import * as http from 'http';
import * as os from 'os';
import { DeviceInfo, DiscoveryOptions } from './types';

const DEV_SERVER_PORT = 11337;
const SYNC_SERVICE_NAME = '_gsync._tcp.local';

/**
 * Discover GrayJay devices using mDNS
 */
export async function discoverViaMDNS(timeout: number = 3000): Promise<DeviceInfo[]> {
  try {
    // Try bonjour first (required dependency)
    const Bonjour = require('bonjour');
    const bonjour = Bonjour();

    return new Promise((resolve) => {
      const devices: DeviceInfo[] = [];

      const browser = bonjour.find({ type: 'gsync' }, (service: any) => {
        const addresses = service.addresses || [];
        // Filter IPv4 addresses only for now (IPv6 support can be added later)
        const ipv4Address = addresses.find((addr: string) => addr && /^[0-9.]+$/.test(addr));
        const mainAddress = ipv4Address || service.referer?.address || service.host;

        if (mainAddress && typeof mainAddress === 'string' && mainAddress.length > 0) {
          devices.push({
            name: service.name,
            host: mainAddress,
            syncPort: service.port,
            devPort: DEV_SERVER_PORT,
            available: false, // Will be verified later
          });
        }
      });

      setTimeout(() => {
        browser.stop();
        bonjour.destroy();
        resolve(devices);
      }, timeout);
    });
  } catch (bonjourError) {
    // Try mdns as fallback (optional dependency)
    try {
      const mdns = require('mdns');

      return new Promise((resolve) => {
        const devices: DeviceInfo[] = [];
        const browser = mdns.createBrowser(mdns.tcp('gsync'));

        const timeout_timer = setTimeout(() => {
          browser.stop();
          resolve(devices);
        }, timeout);

        browser.on('serviceUp', (service: any) => {
          const addresses = service.addresses || [];
          // Filter IPv4 addresses only for now
          const ipv4Address = addresses.find((addr: string) => addr && /^[0-9.]+$/.test(addr));
          const mainAddress = ipv4Address || service.host;

          if (mainAddress && typeof mainAddress === 'string' && mainAddress.length > 0) {
            devices.push({
              name: service.name,
              host: mainAddress,
              syncPort: service.port,
              devPort: DEV_SERVER_PORT,
              available: false,
            });
          }
        });

        browser.on('error', () => {
          clearTimeout(timeout_timer);
          browser.stop();
          resolve(devices);
        });

        browser.start();
      });
    } catch (mdnsError) {
      // Both failed, return empty
      return [];
    }
  }
}

/**
 * Get local network IP addresses
 */
export function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (!ifaces) continue;

    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  return ips;
}

/**
 * Check if a host has GrayJay dev server running
 */
export async function checkHost(
  host: string,
  port: number = DEV_SERVER_PORT,
  timeout: number = 1000
): Promise<DeviceInfo> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = http.get(`http://${host}:${port}/dev`, { timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      req.destroy();

      if (res.statusCode === 200 || res.statusCode === 302) {
        resolve({ host, devPort: port, responseTime, available: true });
      } else {
        resolve({ host, devPort: port, available: false });
      }
    });

    req.on('error', () => {
      resolve({ host, devPort: port, available: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ host, devPort: port, available: false });
    });
  });
}

/**
 * Scan network for GrayJay dev servers
 */
export async function scanNetwork(options: DiscoveryOptions = {}): Promise<DeviceInfo[]> {
  const { timeout = 500 } = options;
  const localIPs = getLocalIPs();

  if (localIPs.length === 0) {
    return [];
  }

  // Check priority hosts first
  const priorityHosts = [
    'localhost',
    '127.0.0.1',
    '100.100.1.57', // Common GrayJay dev server IP
    ...localIPs,
  ];

  const priorityResults = await Promise.all(
    priorityHosts.map((host) => checkHost(host, DEV_SERVER_PORT, timeout))
  );

  const foundServers = priorityResults.filter((r) => r.available);

  if (foundServers.length > 0) {
    return foundServers;
  }

  // Scan entire subnet if priority hosts failed
  const subnet = localIPs[0].split('.').slice(0, 3).join('.');
  const hosts: string[] = [];

  for (let i = 1; i < 255; i++) {
    hosts.push(`${subnet}.${i}`);
  }

  const results: DeviceInfo[] = [];
  const chunkSize = 25;

  for (let i = 0; i < hosts.length; i += chunkSize) {
    const chunk = hosts.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((host) => checkHost(host, DEV_SERVER_PORT, timeout))
    );

    results.push(...chunkResults.filter((r) => r.available));
  }

  return results;
}

/**
 * Discover GrayJay devices (tries all methods)
 */
export async function discoverDevices(options: DiscoveryOptions = {}): Promise<DeviceInfo[]> {
  const { skipMDNS = false, scanNetwork: forceScan = false } = options;

  // Try mDNS first unless skipped
  if (!skipMDNS && !forceScan) {
    const mdnsDevices = await discoverViaMDNS(options.timeout || 3000);

    if (mdnsDevices.length > 0) {
      // Verify dev servers are running
      const verifiedDevices = await Promise.all(
        mdnsDevices.map((device) => checkHost(device.host, DEV_SERVER_PORT, 2000))
      );

      const activeDevices = verifiedDevices.filter((d) => d.available);

      if (activeDevices.length > 0) {
        return activeDevices;
      }
    }
  }

  // Fall back to network scan
  return scanNetwork(options);
}
