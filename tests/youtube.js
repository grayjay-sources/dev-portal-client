/**
 * Comprehensive test using YouTube plugin
 */

const { DevPortalClient } = require("../dist");

async function main() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║     🧪 COMPREHENSIVE YOUTUBE PLUGIN TEST                        ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝\n"
  );

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

    // Test with wrapper API
    console.log("3️⃣  Testing with Wrapper API...\n");

    try {
      console.log(
        '   const isChannel = await client.plugin.isChannelUrl("https://youtube.com/@test")'
      );
      const isChannel = await client.plugin.isChannelUrl(
        "https://youtube.com/@test"
      );
      console.log(`   ✅ Result: ${isChannel} (${typeof isChannel})`);
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }

    try {
      console.log("\n   const videos = await client.plugin.getHome()");
      const videos = await client.plugin.getHome();
      console.log(`   ✅ Videos: ${videos.length}`);

      if (videos.length > 0) {
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
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }

    // Test with standard API
    console.log("\n4️⃣  Testing with Standard API...\n");

    const enableResult = await client.testMethod("enable");
    console.log(`   enable(): ${enableResult.success ? "✅" : "❌"}`);

    const searchResult = await client.testMethod("search", {
      query: "test",
      type: "video",
      order: "relevance",
    });
    console.log(`   search(): ${searchResult.success ? "✅" : "❌"}`);

    // Test Android if available
    console.log("\n5️⃣  Testing on Android (if connected)...\n");
    console.log(
      "   ℹ️  Note: This requires an active GrayJay app connection\n"
    );

    const androidHome = await client.testMethodAndroid("getHome");
    console.log(
      `   testMethodAndroid("getHome"): ${androidHome.success ? "✅" : "❌"}`
    );

    if (androidHome.success && androidHome.result) {
      const videos = Array.isArray(androidHome.result)
        ? androidHome.result
        : androidHome.result.results;

      if (videos && videos.length > 0) {
        console.log(`   Videos from Android: ${videos.length}`);
        console.log(
          `   First video: ${videos[0].name || videos[0].title || "Unknown"}`
        );
      }
    }

    console.log("\n✨ All tests complete!\n");
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
