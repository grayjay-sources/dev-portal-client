# @grayjay-sources/dev-portal-client

GrayJay Dev Portal API client with automatic device discovery via mDNS.

## Features

- 🔍 **Auto-discovery** via mDNS (bonjour) or network scanning
- 📡 **Smart fallback** from mDNS → network scan → manual IP
- 🚀 **Complete API** for all dev portal endpoints
- 🧪 **Plugin testing** with remote method execution
- 📝 **TypeScript** with full type definitions
- 🌐 **Cross-platform** device discovery

## Installation

```bash
npm install @grayjay-sources/dev-portal-client
```

## Quick Start

### Auto-discover and connect

```javascript
const { createClient } = require('@grayjay-sources/dev-portal-client');

// Auto-discover GrayJay devices
const client = await createClient();

// Load your plugin
await client.updateTestPlugin('http://localhost:3000/script.js', pluginConfig);

// Test methods
const homeResult = await client.testMethod(pluginId, 'getHome');
console.log(homeResult);
```

### Manual IP

```javascript
const { DevPortalClient } = require('@grayjay-sources/dev-portal-client');

const client = new DevPortalClient('100.100.1.57', 11337);
await client.loadPortal(); // Wait for initialization
```

### Discovery only

```javascript
const { discoverDevices } = require('@grayjay-sources/dev-portal-client');

// Find all GrayJay devices
const devices = await discoverDevices({ timeout: 5000 });

console.log('Found devices:', devices);
```

## API Reference

### DevPortalClient

#### Constructor

```typescript
new DevPortalClient(host: string, port: number = 11337)
```

#### Methods

| Method | Description |
|--------|-------------|
| `ping()` | Check if dev portal is accessible |
| `loadPortal(waitTime?)` | Load portal and wait for JS initialization |
| `updateTestPlugin(scriptUrl, config)` | Inject plugin into dev server |
| `remoteCall(options)` | Execute plugin method with arguments |
| `testMethod(pluginId, method, ...args)` | Simplified remote call |
| `isLoggedIn()` | Check plugin authentication status |
| `getDevLogs(startIndex?)` | Get development logs |
| `getWarnings()` | Get plugin warnings |
| `getPackage(packageName)` | Get package code (bridge, http, etc.) |
| `fetchContent(url, contentType?)` | Fetch content via dev portal proxy |

### Discovery Functions

| Function | Description |
|----------|-------------|
| `discoverDevices(options?)` | Discover devices (mDNS → scan) |
| `discoverViaMDNS(timeout?)` | mDNS discovery only |
| `scanNetwork(options?)` | Network scanning only |
| `checkHost(host, port?, timeout?)` | Check specific host |
| `getLocalIPs()` | Get local network IPs |

## Discovery Options

```typescript
interface DiscoveryOptions {
  timeout?: number;        // Discovery timeout in ms (default: 3000 for mDNS)
  skipMDNS?: boolean;      // Skip mDNS, use network scan
  scanNetwork?: boolean;   // Force network scan
}
```

## Examples

### Complete Testing Workflow

```javascript
const { createClient, DevPortalClient } = require('@grayjay-sources/dev-portal-client');
const fs = require('fs');

// 1. Discover or use manual IP
const client = await createClient({ timeout: 5000 });
// OR: const client = new DevPortalClient('100.100.1.57');

// 2. Load portal (opens in browser & waits)
await client.loadPortal(10000); // Wait 10 seconds

// 3. Read your plugin config
const config = JSON.parse(fs.readFileSync('./dist/config.json', 'utf-8'));

// 4. Inject plugin
await client.updateTestPlugin('http://localhost:3000/script.js', config);

// 5. Wait for plugin to load
await new Promise(resolve => setTimeout(resolve, 5000));

// 6. Test methods
const enableResult = await client.testMethod(config.id, 'enable', config, {}, '');
const homeResult = await client.testMethod(config.id, 'getHome');

console.log('enable():', enableResult.success ? '✅' : '❌');
console.log('getHome():', homeResult.success ? '✅' : '❌');
```

### Network Scanning

```javascript
const { scanNetwork } = require('@grayjay-sources/dev-portal-client');

// Scan with custom timeout
const devices = await scanNetwork({ timeout: 500 });

devices.forEach(device => {
  console.log(`Found: ${device.host}:${device.devPort} (${device.responseTime}ms)`);
});
```

### Remote Method Execution

```javascript
// Execute any plugin method
const result = await client.remoteCall({
  id: 'plugin-uuid',
  method: 'search',
  args: ['my query', 'video', 'relevance', new Map()]
});

if (result.success) {
  console.log('Search results:', result.result);
} else {
  console.error('Error:', result.error);
}
```

## Dependencies

### Required
- `bonjour` - mDNS device discovery (pure JavaScript)

### Optional
- `mdns` - Alternative mDNS (requires native compilation)

## License

MIT
