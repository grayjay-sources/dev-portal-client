/**
 * Simple usage example of @grayjay-sources/dev-portal-client
 */

const { createClient, DevPortalClient, discoverDevices } = require("./dist");

async function main() {
  console.log("🔍 GrayJay Dev Portal Client - Example Usage\n");

  try {
    // Method 1: Auto-discover and connect
    console.log("1️⃣  Auto-discovery");
    try {
      const client = await createClient({ timeout: 5000 });
      console.log("   ✅ Connected to dev server!\n");
      
      // Test a simple method
      const ping = await client.ping();
      console.log(`   Server online: ${ping ? "✅" : "❌"}\n`);
    } catch (e) {
      console.log(`   ⚠️  Auto-discovery failed: ${e.message}`);
      console.log("   Falling back to manual connection...\n");
    }

    // Method 2: Manual IP
    console.log("2️⃣  Manual connection");
    const manualClient = new DevPortalClient("192.168.2.128", 11337);
    const isOnline = await manualClient.ping();
    console.log(`   Server ${isOnline ? "online ✅" : "offline ❌"}!\n`);

    // Method 3: Discovery only
    console.log("3️⃣  Device discovery only");
    const devices = await discoverDevices({ timeout: 3000 });
    console.log(`   ✅ Found ${devices.length} device(s):\n`);
    devices.forEach((device, i) => {
      console.log(`      ${i + 1}. ${device.host}:${device.devPort}`);
      console.log(`         Response time: ${device.responseTime}ms`);
      if (device.name) console.log(`         Name: ${device.name}`);
    });

    console.log("\n✨ Example complete!\n");
    console.log("📝 Next steps:");
    console.log("   - Load a plugin with client.loadPortal() and client.updateTestPlugin()");
    console.log("   - Test methods with client.testMethod(name, ...args)");
    console.log("   - Test on Android with client.testMethodAndroid(name, ...args)");
    console.log("   - Or use the wrapper: const result = await client.plugin.getHome()\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
