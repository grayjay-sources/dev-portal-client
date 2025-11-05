/**
 * Full integration test with local HTTP server serving YouTube plugin
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { DevPortalClient } = require('../dist');

// Start local HTTP server
function startServer(port) {
  const server = http.createServer((req, res) => {
    const sourcePath = path.join(__dirname, '../../sources/futo-youtube');
    let filePath;

    if (req.url === '/YoutubeConfig.json' || req.url === '/config.json') {
      filePath = path.join(sourcePath, 'YoutubeConfig.json');
      res.setHeader('Content-Type', 'application/json');
    } else if (req.url === '/YoutubeScript.js' || req.url === '/script.js') {
      filePath = path.join(sourcePath, 'YoutubeScript.js');
      res.setHeader('Content-Type', 'application/javascript');
    } else {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.writeHead(200);
      res.end(content);
    } catch (e) {
      res.writeHead(500);
      res.end('Error: ' + e.message);
    }
  });

  server.listen(port);
  return server;
}

async function main() {
  console.log('🔬 Full Integration Test\n');

  const PORT = 3000;
  const server = startServer(PORT);
  console.log(`🌐 Local server started on port ${PORT}\n`);

  try {
    // Load config
    const config = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../sources/futo-youtube/YoutubeConfig.json'),
        'utf-8'
      )
    );

    // Update URLs to local server
    config.sourceUrl = `http://localhost:${PORT}/config.json`;
    config.scriptUrl = `http://localhost:${PORT}/script.js`;

    console.log(`📦 Testing with: ${config.name} v${config.version}\n`);

    // Connect to dev server
    const client = new DevPortalClient('100.100.1.57', 11337);

    console.log('1️⃣  Testing Connection...');
    const isOnline = await client.ping();
    console.log(`   ${isOnline ? '✅' : '❌'} Server ${isOnline ? 'online' : 'offline'}\n`);

    if (!isOnline) {
      console.log('❌ Dev server not available. Make sure GrayJay is running with dev mode enabled.');
      process.exit(1);
    }

    console.log('2️⃣  Loading Dev Portal...');
    await client.loadPortal(10000);
    console.log('   ✅ Portal loaded\n');

    console.log('3️⃣  Injecting Plugin...');
    await client.updateTestPlugin(config.scriptUrl, config);
    console.log('   ✅ Plugin injected\n');

    console.log('⏳ Waiting 5 seconds for plugin to initialize...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('4️⃣  Testing Plugin Methods...\n');

    // Test enable
    console.log('   • enable()');
    const enableResult = await client.testMethod('enable');
    console.log(`     ${enableResult.success ? '✅' : '❌'} ${enableResult.success ? 'Success' : enableResult.error}`);

    // Test getHome
    console.log('\n   • getHome()');
    const homeResult = await client.testMethod('getHome');
    console.log(`     ${homeResult.success ? '✅' : '❌'} ${homeResult.success ? 'Success' : homeResult.error}`);
    if (homeResult.success && homeResult.result) {
      const result = homeResult.result;
      console.log(`     📊 Results: ${result.results?.length || 0} items`);
      console.log(`     📄 HasMore: ${result.hasMore || false}`);
    }

    // Test search
    console.log('\n   • search("test")');
    const searchResult = await client.testMethod('searchChannels', 'test');
    console.log(`     ${searchResult.success ? '✅' : '❌'} ${searchResult.success ? 'Success' : searchResult.error}`);

    // Test isChannelUrl
    console.log('\n   • isChannelUrl()');
    const isChannelResult = await client.testMethod('isChannelUrl', 'https://youtube.com/@test');
    console.log(`     ${isChannelResult.success ? '✅' : '❌'} Result: ${JSON.stringify(isChannelResult.result)}`);

    console.log('\n5️⃣  Testing Utility Endpoints...\n');

    // Get warnings
    console.log('   • getWarnings()');
    const warnings = await client.getWarnings();
    console.log(`     ✅ Warnings: ${warnings ? JSON.stringify(warnings).substring(0, 100) : 'none'}`);

    // Get dev logs
    console.log('\n   • getDevLogs()');
    const logs = await client.getDevLogs();
    console.log(`     ✅ Logs: ${logs.length} entries`);

    // Check login status
    console.log('\n   • isLoggedIn()');
    const loginStatus = await client.isLoggedIn();
    console.log(`     ${loginStatus ? '✅' : 'ℹ️'} ${loginStatus ? 'Logged in' : 'Not logged in'}`);

    console.log('\n✨ Integration test complete!\n');
    console.log('📝 Keep the server running and visit:');
    console.log(`   http://100.100.1.57:11337/dev\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Keep server running for manual testing
    console.log('⚠️  Server still running on port ' + PORT);
    console.log('   Press Ctrl+C to stop\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };

