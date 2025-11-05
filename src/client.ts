/**
 * GrayJay Dev Portal API Client
 */

import * as http from 'http';
import { PluginConfig, RemoteCallOptions, RemoteCallResult, DevLog } from './types';

export class DevPortalClient {
  private host: string;
  private port: number;
  private baseUrl: string;

  constructor(host: string, port: number = 11337) {
    this.host = host;
    this.port = port;
    this.baseUrl = `http://${host}:${port}`;
  }

  /**
   * Check if the dev portal is accessible
   */
  async ping(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`${this.baseUrl}/dev`, { timeout: 5000 }, (res) => {
        req.destroy();
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Load the dev portal and wait for initialization
   */
  async loadPortal(waitTime: number = 10000): Promise<boolean> {
    const isAccessible = await this.ping();

    if (isAccessible && waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    return isAccessible;
  }

  /**
   * Update test plugin
   */
  async updateTestPlugin(scriptUrl: string, config: PluginConfig): Promise<any> {
    const payload = {
      url: scriptUrl,
      config: config,
    };

    try {
      return await this.post('/plugin/updateTestPlugin', payload);
    } catch (error) {
      // Server may close connection after successful injection (204 No Content)
      // This is expected behavior, not an error
      if (error instanceof Error && error.message.includes('socket hang up')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Execute remote call on plugin method
   */
  async remoteCall<T = any>(options: RemoteCallOptions): Promise<RemoteCallResult<T>> {
    const { id, method, args = [] } = options;
    const path = `/plugin/remoteCall?id=${id}&method=${method}`;

    try {
      const result = await this.post(path, { args });
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test a plugin method (simplified remote call)
   */
  async testMethod(pluginId: string, method: string, ...args: any[]): Promise<RemoteCallResult> {
    return this.remoteCall({ id: pluginId, method, args });
  }

  /**
   * Check if plugin is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const result = await this.get('/plugin/isLoggedIn');
      return result?.isLoggedIn === true;
    } catch {
      return false;
    }
  }

  /**
   * Get development logs
   */
  async getDevLogs(startIndex: number = -1): Promise<DevLog[]> {
    try {
      const result = await this.get(`/plugin/getDevLogs?index=${startIndex}`);
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  }

  /**
   * Get plugin warnings
   */
  async getWarnings(): Promise<any> {
    return this.post('/plugin/getWarnings', {});
  }

  /**
   * Get package code
   */
  async getPackage(packageName: string): Promise<string> {
    return this.get(`/plugin/packageGet?variable=${packageName}`);
  }

  /**
   * Fetch content via dev portal proxy
   */
  async fetchContent(url: string, contentType: string = 'text/json'): Promise<any> {
    return this.post(`/get?CT=${contentType}`, url);
  }

  /**
   * Generic GET request
   */
  private async get(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = http.get(`${this.baseUrl}${path}`, { timeout: 10000 }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          req.destroy();

          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Generic POST request
   */
  private async post(path: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

      const options = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            try {
              resolve(responseData ? JSON.parse(responseData) : null);
            } catch {
              resolve(responseData);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        // Handle socket hang up as success for 204 responses
        if (error.message.includes('socket hang up') || error.message.includes('ECONNRESET')) {
          resolve(null);
        } else {
          reject(error);
        }
      });
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(data);
      req.end();
    });
  }
}
