# @grayjay-sources/dev-portal-client

GrayJay Dev Portal API client with automatic device discovery via mDNS.

## Features

- 🔍 Auto-discovery via mDNS or network scanning
- 🚀 Complete API for all dev portal endpoints
- 🧪 Plugin testing with remote method execution
- 📝 TypeScript with full type definitions

## Installation

```bash
npm install @grayjay-sources/dev-portal-client
```

## Quick Start

```javascript
const { createClient } = require("@grayjay-sources/dev-portal-client");

// Auto-discover and connect
const client = await createClient();

// Load portal and inject plugin
await client.loadPortal(8000);
await client.updateTestPlugin("http://localhost:3000/script.js", config);

// Test methods
const home = await client.testMethod("getHome");
console.log(`Found ${home.result.length} videos`);

// Or use the wrapper (throws on error)
const videos = await client.plugin.getHome();
```

### Manual IP

```javascript
const { DevPortalClient } = require("@grayjay-sources/dev-portal-client");
const client = new DevPortalClient("192.168.1.100", 11337);
await client.loadPortal();
```

## API Reference

### Core Methods

| Method                                | Description                                              |
| ------------------------------------- | -------------------------------------------------------- |
| `testMethod(method, ...args)`         | Test plugin method, returns `{ success, result, error }` |
| `testMethodAndroid(method, ...args)`  | Test on Android device                                   |
| `plugin[method](...args)`             | Direct wrapper - returns result, throws on error         |
| `loadPortal(waitTime?)`               | Load portal and wait for initialization                  |
| `updateTestPlugin(scriptUrl, config)` | Inject plugin into dev server                            |
| `getDevLogs(startIndex?)`             | Get development logs                                     |
| `remoteCall(id, method, ...args)`     | Execute method on specific plugin                        |

### Discovery Functions

| Function                           | Description                     |
| ---------------------------------- | ------------------------------- |
| `createClient(options?)`           | Auto-discover and create client |
| `discoverDevices(options?)`        | Find all GrayJay devices        |
| `checkHost(host, port?, timeout?)` | Check specific host             |

### Options

```typescript
interface DiscoveryOptions {
  timeout?: number; // Discovery timeout (default: 3000ms)
  skipMDNS?: boolean; // Skip mDNS, use network scan
  scanNetwork?: boolean; // Force network scan
}
```

## Complete Example

```javascript
const { createClient } = require("@grayjay-sources/dev-portal-client");
const fs = require("fs");

// Discover device
const client = await createClient({ timeout: 5000 });

// Load portal
await client.loadPortal(10000);

// Inject plugin
const config = JSON.parse(fs.readFileSync("./dist/config.json"));
await client.updateTestPlugin("http://localhost:3000/script.js", config);

// Test methods
const enableResult = await client.testMethod("enable");
const homeResult = await client.testMethod("getHome");
const searchResult = await client.testMethod("search", { query: "test" });

console.log("enable():", enableResult.success ? "✅" : "❌");
console.log("getHome():", homeResult.success ? "✅" : "❌");
```

## Known Limitations

### Android Device Testing (Gson Serialization)

When using `testMethodAndroid()`, complex interface types (e.g., `IPlatformComment`) cannot be passed as arguments due to Gson limitations.

**Workarounds:**

- Use `testMethod()` instead (executes in dev portal JS context)
- Use browser's "Test" button (executes locally)
- Test directly in the GrayJay app

## Dependencies

- `bonjour-service` - mDNS device discovery (pure JavaScript, no native compilation)

## License

MIT
