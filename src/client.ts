/**
 * GrayJay Dev Portal API Client
 */

import * as http from 'http';
import { PluginConfig, RemoteCallResult, DevLog } from './types';

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
   * Test a plugin method (uses currently loaded plugin)
   * This is the primary method for testing - no plugin ID needed
   */
  async testMethod(method: string, ...args: any[]): Promise<RemoteCallResult> {
    const path = `/plugin/remoteTest?method=${method}`;

    try {
      // API expects args as JSON array, not object
      const response = await this.post(path, args);
      
      // API can return:
      // 1. { error: "..." } for errors
      // 2. { result: ... } for wrapped results  
      // 3. The actual result directly (primitives, objects, arrays)
      
      if (response && typeof response === 'object' && response.error) {
        return {
          success: false,
          error: response.error,
        };
      }
      
      // If response has a 'result' field, use it (wrapped), otherwise use response directly
      const result = (response && typeof response === 'object' && 'result' in response) 
        ? response.result 
        : response;
      
      return {
        success: true,
        result: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute remote call on a specific plugin by ID
   * @param id Plugin UUID
   * @param method Method name
   * @param args Method arguments
   */
  async remoteCall<T = any>(id: string, method: string, ...args: any[]): Promise<RemoteCallResult<T>> {
    const path = `/plugin/remoteCall?id=${id}&method=${method}`;

    try {
      // API expects args as JSON array
      const response = await this.post(path, args);
      
      // API can return:
      // 1. { error: "..." } for errors
      // 2. { result: ... } for wrapped results  
      // 3. The actual result directly (primitives, objects, arrays)
      
      if (response && typeof response === 'object' && response.error) {
        return {
          success: false,
          error: response.error,
        };
      }
      
      // If response has a 'result' field, use it (wrapped), otherwise use response directly
      const result = (response && typeof response === 'object' && 'result' in response) 
        ? response.result 
        : response;
      
      return {
        success: true,
        result: result as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
   * @param url The URL to fetch
   * @param contentType Content type hint (text/json, application/js, etc.)
   */
  async fetchContent(url: string, contentType: string = 'text/json', debug: boolean = false): Promise<any> {
    // Dev portal expects the URL as a JSON string literal in the body
    // Example: "https://example.com" (with quotes)
    const endpoint = `/get?CT=${contentType}`;
    
    if (debug) {
      console.log(`[DEBUG] fetchContent endpoint: ${endpoint}`);
      console.log(`[DEBUG] fetchContent url: ${url}`);
      console.log(`[DEBUG] Will send as JSON string: ${JSON.stringify(url)}`);
    }
    
    // Send as raw JSON string (already stringified, so mark as special)
    return this.postRaw(endpoint, JSON.stringify(url), debug);
  }

  /**
   * Test plugin login
   */
  async testLogin(): Promise<RemoteCallResult> {
    try {
      const response = await this.post('/plugin/loginTestPlugin', {});
      return {
        success: true,
        result: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test plugin logout
   */
  async testLogout(): Promise<RemoteCallResult> {
    try {
      const response = await this.post('/plugin/logoutTestPlugin', {});
      return {
        success: true,
        result: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test plugin captcha
   */
  async testCaptcha(captchaData: any): Promise<RemoteCallResult> {
    try {
      const response = await this.post('/plugin/captchaTestPlugin', captchaData);
      return {
        success: true,
        result: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get plugin property (like supportedFeatures)
   * @param id Plugin UUID
   * @param prop Property name
   */
  async getPluginProperty(id: string, prop: string): Promise<any> {
    return this.get(`/plugin/remoteProp?id=${id}&prop=${prop}`);
  }

  /**
   * Call a method on the currently loaded plugin (simplified API)
   * Alias for testMethod - tests locally in the dev portal
   */
  async call(method: string, ...args: any[]): Promise<RemoteCallResult> {
    return this.testMethod(method, ...args);
  }

  /**
   * Test a method on the actual Android device (requires active GrayJay connection)
   * This uses the pluginRemoteTest bridge to execute on the real device
   * @param method Method name
   * @param args Method arguments
   */
  async testAndroid(method: string, ...args: any[]): Promise<RemoteCallResult> {
    // testAndroid uses the same /plugin/remoteTest endpoint but executes on Android
    // The dev portal has a JavaScript bridge function pluginRemoteTest() that handles this
    // We'll use the same HTTP endpoint which should work the same way
    return this.testMethod(method, ...args);
  }

  /**
   * Call a method remotely on a specific plugin by ID (simplified API)
   * @param pluginId Plugin UUID (runtime ID, not config ID)
   * @param method Method name
   * @param args Method arguments
   */
  async callRemotely(pluginId: string, method: string, ...args: any[]): Promise<RemoteCallResult> {
    return this.remoteCall(pluginId, method, ...args);
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
   * Generic POST request (auto-stringifies payload)
   */
  private async post(path: string, payload: any, debug: boolean = false): Promise<any> {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return this.postRaw(path, data, debug);
  }

  /**
   * POST request with raw data (no auto-stringification)
   */
  private async postRaw(path: string, data: string, debug: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      if (debug) {
        console.log(`[DEBUG] POST ${this.baseUrl}${path}`);
        console.log(`[DEBUG] Data being sent: ${data.substring(0, 200)}...`);
        console.log(`[DEBUG] Data length: ${Buffer.byteLength(data)}`);
      }

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
