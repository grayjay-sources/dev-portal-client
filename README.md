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
const { createClient } = require("@grayjay-sources/dev-portal-client");

// Auto-discover GrayJay devices
const client = await createClient();

// Load portal and inject plugin
await client.loadPortal(8000); // Wait 8 seconds for initialization
await client.updateTestPlugin(
  "https://plugins.grayjay.app/Youtube/YoutubeScript.js",
  config
);

// Test methods on currently loaded plugin
const enable = await client.testMethod("enable");
const isChannel = await client.testMethod(
  "isChannelUrl",
  "https://youtube.com/@test"
);
// Returns: { success: true, result: true }

const home = await client.testMethod("getHome");
// Returns: { success: true, result: [{ name: "...", duration: 181, playbackTime: -1, thumbnails: {...} }] }

// Or use the wrapper (returns result directly, throws on error)
const videos = await client.plugin.getHome(); // Returns array directly
const isChannel2 = await client.plugin.isChannelUrl(
  "https://youtube.com/@test"
); // Returns true

// Test on actual Android device (if connected)
const androidHome = await client.testMethodAndroid("getHome");

// Check results
if (home.success) {
  console.log(`Found ${home.result.length} videos`);
  console.log(`First video: ${home.result[0].name}`);
}
```

### Manual IP

```javascript
const { DevPortalClient } = require("@grayjay-sources/dev-portal-client");

const client = new DevPortalClient("100.100.1.57", 11337);
await client.loadPortal(); // Wait for initialization
```

### Discovery only

```javascript
const { discoverDevices } = require("@grayjay-sources/dev-portal-client");

// Find all GrayJay devices
const devices = await discoverDevices({ timeout: 5000 });

console.log("Found devices:", devices);
```

## API Reference

### DevPortalClient

#### Constructor

```typescript
new DevPortalClient(host: string, port: number = 11337)
```

#### Methods

**API Methods:**

| Method                                | Description                                           |
| ------------------------------------- | ----------------------------------------------------- |
| `testMethod(method, ...args)`         | Test method, returns `{ success, result, error }`     |
| `testMethodAndroid(method, ...args)`  | Test on Android, returns `{ success, result, error }` |
| `plugin[method](...args)`             | Wrapper - returns result directly, throws on error    |
| `ping()`                              | Check if dev portal is accessible                     |
| `loadPortal(waitTime?)`               | Load portal and wait for JS initialization            |
| `updateTestPlugin(scriptUrl, config)` | Inject plugin into dev server                         |
| `remoteCall(id, method, ...args)`     | Execute method on specific plugin by ID               |
| `isLoggedIn()`                        | Check plugin authentication status                    |
| `getDevLogs(startIndex?)`             | Get development logs                                  |
| `getWarnings()`                       | Get plugin warnings                                   |
| `getPackage(packageName)`             | Get package code (bridge, http, etc.)                 |
| `getPluginProperty(id, prop)`         | Get plugin property (e.g., supportedFeatures)         |
| `fetchContent(url, contentType?)`     | Fetch content via dev portal proxy                    |
| `testLogin()`                         | Test plugin login flow                                |
| `testLogout()`                        | Test plugin logout flow                               |
| `testCaptcha(captchaData)`            | Test plugin captcha handling                          |

**Return Format:**

```typescript
interface RemoteCallResult<T = any> {
  success: boolean;
  result?: T; // Present when success is true
  error?: string; // Present when success is false
}
```

### Discovery Functions

| Function                           | Description                    |
| ---------------------------------- | ------------------------------ |
| `discoverDevices(options?)`        | Discover devices (mDNS → scan) |
| `discoverViaMDNS(timeout?)`        | mDNS discovery only            |
| `scanNetwork(options?)`            | Network scanning only          |
| `checkHost(host, port?, timeout?)` | Check specific host            |
| `getLocalIPs()`                    | Get local network IPs          |

## Discovery Options

```typescript
interface DiscoveryOptions {
  timeout?: number; // Discovery timeout in ms (default: 3000 for mDNS)
  skipMDNS?: boolean; // Skip mDNS, use network scan
  scanNetwork?: boolean; // Force network scan
}
```

## Examples

### Complete Testing Workflow

```javascript
const {
  createClient,
  DevPortalClient,
} = require("@grayjay-sources/dev-portal-client");
const fs = require("fs");

// 1. Discover or use manual IP
const client = await createClient({ timeout: 5000 });
// OR: const client = new DevPortalClient('100.100.1.57');

// 2. Load portal (opens in browser & waits)
await client.loadPortal(10000); // Wait 10 seconds

// 3. Read your plugin config
const config = JSON.parse(fs.readFileSync("./dist/config.json", "utf-8"));

// 4. Inject plugin
await client.updateTestPlugin("http://localhost:3000/script.js", config);

// 5. Wait for plugin to load
await new Promise((resolve) => setTimeout(resolve, 5000));

// 6. Test methods
const enableResult = await client.testMethod(
  config.id,
  "enable",
  config,
  {},
  ""
);
const homeResult = await client.testMethod(config.id, "getHome");

console.log("enable():", enableResult.success ? "✅" : "❌");
console.log("getHome():", homeResult.success ? "✅" : "❌");
```

### Network Scanning

```javascript
const { scanNetwork } = require("@grayjay-sources/dev-portal-client");

// Scan with custom timeout
const devices = await scanNetwork({ timeout: 500 });

devices.forEach((device) => {
  console.log(
    `Found: ${device.host}:${device.devPort} (${device.responseTime}ms)`
  );
});
```

### Remote Method Execution

```javascript
// Test methods on currently loaded plugin (recommended)
const enableResult = await client.testMethod("enable");
const homeResult = await client.testMethod("getHome");
const searchResult = await client.testMethod("search", {
  query: "my query",
  type: "video",
  order: "relevance",
});

if (searchResult.success) {
  console.log("Search results:", searchResult.result);
} else {
  console.error("Error:", searchResult.error);
}

// Or call a specific plugin by ID
const result = await client.remoteCall(pluginId, "getHome");
```

## Dependencies

### Required

- `bonjour-service` - mDNS device discovery (pure JavaScript, no native compilation)

The library handles all discovery mechanisms internally. No additional dependencies needed for device discovery.

## Known Limitations

### Gson Serialization (Android Device Testing)

When using `testMethodAndroid()` to test methods on an actual Android device via the `/plugin/remoteTest` endpoint, there are serialization limitations:

- **Interface Types**: Cannot pass complex interface types (e.g., `IPlatformComment`) as arguments
- **Workaround**: Use `testMethod()` which executes in the dev portal's JavaScript context instead
- **Browser Testing**: The dev portal's browser interface handles this by executing locally

For methods that require complex objects (like `getSubComments(comment)`), prefer testing via:
1. The browser's "Test" button (executes locally)
2. The `testMethod()` API (dev portal JavaScript context)
3. Direct integration testing in the GrayJay app

## Changelog

### v1.3.1 (Latest)
- Improved error handling for network operations
- Enhanced test method reliability
- Better documentation for known limitations

### v1.3.0
- Added plugin wrapper API (`client.plugin[method]()`)
- Improved device discovery reliability
- Enhanced network scanning performance
- Better TypeScript type definitions

### v1.2.0
- Initial mDNS discovery support
- Network scanning fallback
- Complete dev portal API coverage

## License

MIT
