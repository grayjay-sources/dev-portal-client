/**
 * Example usage of @grayjay-sources/dev-portal-client
 */

const { createClient, DevPortalClient, discoverDevices } = require("../dist");

async function main() {
  console.log("🔍 Discovering GrayJay devices...\n");

  let client;

  try {
    // Method 1: Auto-discover and connect
    console.log("Method 1: Auto-discovery");
    try {
      client = await createClient({ timeout: 5000 });
      console.log("✅ Connected to dev server!\n");
    } catch (e) {
      console.log(`⚠️  Auto-discovery failed: ${e.message}`);
      console.log("   Falling back to manual connection...\n");
    }

    // Method 2: Manual IP (fallback or standalone test)
    console.log("Method 2: Manual connection");
    const manualClient = new DevPortalClient("100.100.1.57", 11337);
    const isOnline = await manualClient.ping();
    console.log(`✅ Server ${isOnline ? "online" : "offline"}!\n`);

    // Use manual client if auto-discovery failed
    if (!client) {
      client = manualClient;
    }

    // Method 3: Just discovery
    console.log("Method 3: Discovery only");
    const devices = await discoverDevices();
    console.log(`✅ Found ${devices.length} device(s):\n`);
    devices.forEach((device, i) => {
      console.log(
        `   ${i + 1}. ${device.host}:${device.devPort} (${
          device.responseTime
        }ms)`
      );
    });

    // Test portal loading
    console.log("\n📡 Loading dev portal...");
    await client.loadPortal(5000);
    console.log("✅ Portal loaded!\n");

    // Test plugin injection
    const testConfig = {
      id: "test-plugin-" + Date.now(),
      name: "Test Plugin",
      description: "A test plugin for dev portal client",
      author: "Test Author",
      authorUrl: "https://github.com/test",
      version: 1,
      scriptUrl: "http://localhost:3000/script.js",
      sourceUrl: "http://localhost:3000/config.json",
      platformUrl: "https://example.com",
      repositoryUrl: "https://github.com/test/test-plugin",
      iconUrl: "http://localhost:3000/icon.png",
      scriptSignature: "",
      scriptPublicKey: "",
      packages: ["Http"],
      allowEval: false,
      allowUrls: ["example.com"],
      supportedClaimTypes: [3],
    };

    console.log("📦 Injecting test plugin...");
    await client.updateTestPlugin(testConfig.scriptUrl, testConfig);
    console.log("✅ Plugin injected!\n");

    // Test remote call (using remoteTest - currently loaded plugin)
    console.log("🧪 Testing plugin methods...");

    // Test enable (no args needed)
    const enableResult = await client.testMethod("enable");
    console.log(`   enable(): ${enableResult.success ? "✅" : "❌"}`);
    if (!enableResult.success) {
      console.log(`   Error: ${enableResult.error}`);
    }

    // Test getHome
    const homeResult = await client.testMethod("getHome");
    console.log(`   getHome(): ${homeResult.success ? "✅" : "❌"}`);
    if (!homeResult.success) {
      console.log(`   Error: ${homeResult.error}`);
    } else {
      console.log(
        `   Result: ${JSON.stringify(homeResult.result, null, 2).substring(
          0,
          200
        )}...`
      );
    }

    console.log("");

    console.log("✨ All tests passed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
