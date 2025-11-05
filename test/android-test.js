/**
 * Test Android device integration
 * This tests methods on the actual Android device, not just the dev portal
 */

const { DevPortalClient } = require("../dist");

async function main() {
  console.log("📱 Android Integration Test\n");

  try {
    const client = new DevPortalClient("192.168.2.128", 11337);

    // Fetch YouTube config
    const https = require("https");
    const config = await new Promise((resolve, reject) => {
      https
        .get(
          "https://plugins.grayjay.app/Youtube/YoutubeConfig.json",
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve(JSON.parse(data)));
          }
        )
        .on("error", reject);
    });

    console.log(`📦 Testing with: ${config.name} v${config.version}\n`);

    // Load portal
    console.log("1️⃣  Loading portal...");
    await client.loadPortal(8000);
    console.log("   ✅ Done\n");

    // Inject plugin
    console.log("2️⃣  Injecting plugin...");
    await client.updateTestPlugin(
      "https://plugins.grayjay.app/Youtube/YoutubeScript.js",
      config
    );
    console.log("   ✅ Done\n");

    // Wait for plugin to load
    console.log("⏳ Waiting 5 seconds...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Test locally first
    console.log("3️⃣  Testing Locally (in dev portal)...\n");

    console.log(
      '   client.testMethod("isChannelUrl", "https://youtube.com/@test")'
    );
    const isChannelLocal = await client.testMethod(
      "isChannelUrl",
      "https://youtube.com/@test"
    );
    console.log(
      `   ${isChannelLocal.success ? "✅" : "❌"} Success: ${
        isChannelLocal.success
      }`
    );
    console.log(`   Result: ${JSON.stringify(isChannelLocal.result)}`);
    console.log(`   Result type: ${typeof isChannelLocal.result}`);

    console.log('\n   client.testMethod("getHome")');
    const homeLocal = await client.testMethod("getHome");
    console.log(
      `   ${homeLocal.success ? "✅" : "❌"} Success: ${homeLocal.success}`
    );
    if (homeLocal.success && homeLocal.result) {
      const result = homeLocal.result;
      console.log(
        `   Result type: ${
          Array.isArray(result) ? "Array" : result.constructor.name
        }`
      );

      // Handle both direct array and pager with .results
      const videos = Array.isArray(result) ? result : result.results;

      if (videos && videos.length > 0) {
        console.log(`   Videos: ${videos.length}`);
        const firstVideo = videos[0];
        console.log(`   First video:`);
        console.log(
          `      Name: ${firstVideo.name || firstVideo.title || "Unknown"}`
        );
        console.log(`      Duration: ${firstVideo.duration}s`);
        console.log(`      Playback time: ${firstVideo.playbackTime}`);
        if (firstVideo.thumbnails) {
          console.log(
            `      Thumbnail: ${
              firstVideo.thumbnails.sources?.[0]?.url ||
              JSON.stringify(firstVideo.thumbnails).substring(0, 80)
            }`
          );
        }
      }
    }

    // Test on Android device
    console.log("\n4️⃣  Testing on Android Device...\n");
    console.log(
      "   ℹ️  Note: This requires an active GrayJay app connection\n"
    );

    console.log(
      '   client.testMethodAndroid("isChannelUrl", "https://youtube.com/@test")'
    );
    const isChannelAndroid = await client.testMethodAndroid(
      "isChannelUrl",
      "https://youtube.com/@test"
    );
    console.log(
      `   ${isChannelAndroid.success ? "✅" : "❌"} Success: ${
        isChannelAndroid.success
      }`
    );
    console.log(`   Result: ${JSON.stringify(isChannelAndroid.result)}`);

    console.log('\n   client.testMethodAndroid("getHome")');
    const homeAndroid = await client.testMethodAndroid("getHome");
    console.log(
      `   ${homeAndroid.success ? "✅" : "❌"} Success: ${homeAndroid.success}`
    );
    if (homeAndroid.success && homeAndroid.result) {
      const result = homeAndroid.result;
      console.log(
        `   Result type: ${
          Array.isArray(result) ? "Array" : result.constructor.name
        }`
      );

      // Handle both direct array and pager with .results
      const videos = Array.isArray(result) ? result : result.results;

      if (videos && videos.length > 0) {
        console.log(`   Videos: ${videos.length}`);
        const firstVideo = videos[0];
        console.log(`   First video:`);
        console.log(
          `      Name: ${firstVideo.name || firstVideo.title || "Unknown"}`
        );
        console.log(`      Duration: ${firstVideo.duration}s`);
        console.log(`      Playback time: ${firstVideo.playbackTime}`);
        if (firstVideo.thumbnails) {
          console.log(
            `      Thumbnails: ${JSON.stringify(
              firstVideo.thumbnails
            ).substring(0, 150)}...`
          );
        }
      }
    }

    console.log("\n✨ Test complete!\n");
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
