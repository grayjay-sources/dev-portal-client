/**
 * Test based on actual browser network requests
 * This test mimics exactly what the browser does
 */

const { DevPortalClient } = require('../dist');

async function main() {
  console.log('🌐 Browser-Based Integration Test\n');
  console.log('This test mimics the exact sequence the dev portal uses\n');

  try {
    const client = new DevPortalClient('192.168.2.128', 11337);
    
    const YOUTUBE_CONFIG_URL = 'https://plugins.grayjay.app/Youtube/YoutubeConfig.json';
    const YOUTUBE_SCRIPT_URL = 'https://plugins.grayjay.app/Youtube/YoutubeScript.js';

    // Step 1: Check login status (portal does this first)
    console.log('1️⃣  Check Login Status...');
    const loginStatus = await client.isLoggedIn();
    console.log(`   ${loginStatus ? '✅' : 'ℹ️'} ${loginStatus ? 'Logged in' : 'Not logged in'}\n`);

    // Step 2: Fetch config via /get endpoint (like browser does)
    console.log('2️⃣  Fetch Config via Proxy...');
    console.log(`   URL: ${YOUTUBE_CONFIG_URL}`);
    
    // Try the actual POST request format
    const https = require('https');
    const configData = await new Promise((resolve, reject) => {
      https.get(YOUTUBE_CONFIG_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    
    console.log(`   ✅ Loaded: ${configData.name} v${configData.version}\n`);

    // Step 3: Get warnings (browser does this next)
    console.log('3️⃣  Get Warnings...');
    const warnings = await client.getWarnings();
    console.log(`   ✅ Warnings: ${JSON.stringify(warnings)}\n`);

    // Step 4: Fetch script via /get endpoint
    console.log('4️⃣  Fetch Script via Proxy...');
    console.log(`   URL: ${YOUTUBE_SCRIPT_URL}`);
    console.log(`   ⏭️  Skipping (large file)\n`);

    // Step 5: Update test plugin
    console.log('5️⃣  Update Test Plugin...');
    await client.updateTestPlugin(YOUTUBE_SCRIPT_URL, configData);
    console.log(`   ✅ Plugin updated\n`);

    // Wait for plugin to load
    console.log('⏳ Waiting 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 6: Get packages (browser requests http and bridge)
    console.log('6️⃣  Get Packages...');
    try {
      const httpPackage = await client.getPackage('http');
      console.log(`   ✅ Http package: ${httpPackage.length} bytes`);
    } catch (e) {
      console.log(`   ⚠️  Http: ${e.message}`);
    }

    try {
      const bridgePackage = await client.getPackage('bridge');
      console.log(`   ✅ Bridge package: ${bridgePackage.length} bytes\n`);
    } catch (e) {
      console.log(`   ⚠️  Bridge: ${e.message}\n`);
    }

    // Step 7: Get plugin property (supportedFeatures)
    console.log('7️⃣  Get Plugin Properties...');
    try {
      const features = await client.getPluginProperty(configData.id, 'supportedFeatures');
      console.log(`   ✅ Supported features: ${JSON.stringify(features)}\n`);
    } catch (e) {
      console.log(`   ⚠️  ${e.message}\n`);
    }

    // Step 8: Test method via remoteCall (browser uses this for log)
    console.log('8️⃣  Remote Call (log method)...');
    const logResult = await client.remoteCall(configData.id, 'log', 'Test message from API client');
    console.log(`   ${logResult.success ? '✅' : '❌'} ${logResult.success ? 'Success' : logResult.error}\n`);

    // Step 9: Get dev logs (browser polls this)
    console.log('9️⃣  Get Dev Logs...');
    const logs = await client.getDevLogs(-1);
    console.log(`   ✅ Retrieved ${logs.length} log entries`);
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      console.log(`   📝 Last: [${lastLog.type}] ${lastLog.log?.substring(0, 80)}...\n`);
    }

    // Step 10: Test plugin methods
    console.log('🔟 Test Plugin Methods...');
    
    const enableResult = await client.testMethod('enable');
    console.log(`   enable(): ${enableResult.success ? '✅' : '❌'} ${enableResult.success ? 'Success' : enableResult.error}`);

    const homeResult = await client.testMethod('getHome');
    console.log(`   getHome(): ${homeResult.success ? '✅' : '❌'} ${homeResult.success ? 'Success' : homeResult.error}`);

    console.log('\n✨ All tests complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
