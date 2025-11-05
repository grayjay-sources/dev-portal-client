/**
 * Example usage of @grayjay-sources/dev-portal-client
 */

const { createClient, DevPortalClient, discoverDevices } = require('../dist');

async function main() {
  console.log('🔍 Discovering GrayJay devices...\n');

  try {
    // Method 1: Auto-discover and connect
    console.log('Method 1: Auto-discovery');
    const client = await createClient({ timeout: 5000 });
    console.log('✅ Connected to dev server!\n');

    // Method 2: Manual IP
    console.log('Method 2: Manual connection');
    const manualClient = new DevPortalClient('100.100.1.57', 11337);
    const isOnline = await manualClient.ping();
    console.log(`✅ Server ${isOnline ? 'online' : 'offline'}!\n`);

    // Method 3: Just discovery
    console.log('Method 3: Discovery only');
    const devices = await discoverDevices();
    console.log(`✅ Found ${devices.length} device(s):\n`);
    devices.forEach((device, i) => {
      console.log(`   ${i + 1}. ${device.host}:${device.devPort} (${device.responseTime}ms)`);
    });

    // Test portal loading
    console.log('\n📡 Loading dev portal...');
    await client.loadPortal(5000);
    console.log('✅ Portal loaded!\n');

    // Test plugin injection
    const testConfig = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: 1,
      scriptUrl: 'http://localhost:3000/script.js',
      platformUrl: 'https://example.com'
    };

    console.log('📦 Injecting test plugin...');
    await client.updateTestPlugin(testConfig.scriptUrl, testConfig);
    console.log('✅ Plugin injected!\n');

    // Test remote call
    console.log('🧪 Testing plugin method...');
    const result = await client.testMethod(testConfig.id, 'enable', testConfig, {}, '');
    console.log(`✅ Result: ${JSON.stringify(result, null, 2)}\n`);

    console.log('✨ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
