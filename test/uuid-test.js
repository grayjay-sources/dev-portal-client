/**
 * Test to discover how to get the runtime plugin UUID
 */

const { DevPortalClient } = require('../dist');

async function main() {
  console.log('🔍 UUID Discovery Test\n');

  try {
    const client = new DevPortalClient('192.168.2.128', 11337);
    
    const YOUTUBE_CONFIG_URL = 'https://plugins.grayjay.app/Youtube/YoutubeConfig.json';
    const YOUTUBE_SCRIPT_URL = 'https://plugins.grayjay.app/Youtube/YoutubeScript.js';

    // Fetch config
    const https = require('https');
    const config = await new Promise((resolve, reject) => {
      https.get(YOUTUBE_CONFIG_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    console.log(`📦 Config UUID: ${config.id}`);
    console.log(`📦 Plugin: ${config.name} v${config.version}\n`);

    // Load portal
    console.log('1️⃣  Loading portal...');
    await client.loadPortal(8000);
    console.log('   ✅ Done\n');

    // Inject plugin and capture response
    console.log('2️⃣  Injecting plugin...');
    console.log('   🔍 Watching what updateTestPlugin returns...\n');
    
    const result = await client.updateTestPlugin(YOUTUBE_SCRIPT_URL, config);
    
    console.log('   📊 updateTestPlugin response:');
    console.log(`      Type: ${typeof result}`);
    console.log(`      Value: ${JSON.stringify(result, null, 2)}`);
    console.log('');

    // Wait and try testMethod
    console.log('3️⃣  Waiting 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try testMethod to see if it works
    console.log('4️⃣  Testing enable() with testMethod...');
    const enableResult = await client.testMethod('enable');
    console.log(`   ${enableResult.success ? '✅' : '❌'} ${enableResult.success ? 'Success' : enableResult.error}\n`);

    // Check logs to see if there's plugin ID info
    console.log('5️⃣  Getting dev logs...');
    const logs = await client.getDevLogs(-1);
    console.log(`   📝 Found ${logs.length} log entries`);
    
    logs.forEach((log, i) => {
      console.log(`   ${i + 1}. [${log.type}] ${log.log?.substring(0, 80)}`);
    });

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
