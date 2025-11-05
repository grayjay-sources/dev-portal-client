/**
 * Comprehensive YouTube plugin test
 * Tests ALL Source interface methods from plugin.d.ts
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

    console.log(`📦 Plugin: ${config.name} v${config.version}\n`);

    // Setup
    console.log("🔧 Setup...");
    await client.loadPortal(8000);
    await client.updateTestPlugin(
      "https://plugins.grayjay.app/Youtube/YoutubeScript.js",
      config
    );
    console.log("   ✅ Portal loaded and plugin injected\n");

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Test categories
    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      authRequired: 0,
    };

    async function testMethod(name, ...args) {
      try {
        const result = await client.testMethod(name, ...args);
        if (result.success) {
          results.passed++;
          return { success: true, result: result.result };
        } else {
          results.failed++;
          return { success: false, error: result.error };
        }
      } catch (e) {
        results.failed++;
        return { success: false, error: e.message };
      }
    }

    async function testAuthMethod(name, ...args) {
      try {
        const result = await client.testMethod(name, ...args);
        if (result.success) {
          results.passed++;
          return { success: true, result: result.result };
        } else {
          results.authRequired++;
          return { success: false, error: result.error, authRequired: true };
        }
      } catch (e) {
        results.authRequired++;
        return { success: false, error: e.message, authRequired: true };
      }
    }

    // 1. Core Methods
    console.log("1️⃣  Core Methods\n");

    let r = await testMethod("enable");
    console.log(`   enable(): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      console.log(
        `      Returned config with keys: ${Object.keys(r.result).length}`
      );
      if (r.result.CLIENT_CANARY_STATE) {
        console.log(
          `      CLIENT_CANARY_STATE: ${r.result.CLIENT_CANARY_STATE}`
        );
      }
    }

    r = await testMethod("disable");
    console.log(`   disable(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("saveState");
    console.log(`   saveState(): ${r.success ? "✅" : "❌"}`);

    r = await testAuthMethod("setSettings", {});
    console.log(
      `   setSettings(): ${r.success ? "✅" : r.authRequired ? "🔒" : "❌"}`
    );

    // 2. Home & Content
    console.log("\n2️⃣  Home & Content\n");

    r = await testMethod("getHome");
    console.log(`   getHome(): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      const videos = Array.isArray(r.result)
        ? r.result
        : r.result.results || [];
      console.log(`      Videos: ${videos.length}`);
      if (videos[0])
        console.log(`      First: ${videos[0].name || videos[0].title}`);
    }

    // 3. Search Methods
    console.log("\n3️⃣  Search Methods\n");

    r = await testMethod("searchSuggestions", "test");
    console.log(`   searchSuggestions(): ${r.success ? "✅" : "❌"}`);
    if (r.success && Array.isArray(r.result)) {
      console.log(`      Suggestions: ${r.result.length}`);
    }

    // Valid sort: null (relevance), "Chronological", "Views", "Rating"
    r = await testMethod("search", "test", "video", null, []);
    console.log(`   search(): ${r.success ? "✅" : "❌"}`);
    if (!r.success) console.log(`      Error: ${r.error}`);

    r = await testMethod("getSearchCapabilities");
    console.log(`   getSearchCapabilities(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("searchChannels", "test");
    console.log(`   searchChannels(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("searchPlaylists", "test", "playlist", null, []);
    console.log(`   searchPlaylists(): ${r.success ? "✅" : "❌"}`);

    // 4. Channel Methods
    console.log("\n4️⃣  Channel Methods\n");

    // Use a real YouTube channel
    const channelUrl = "https://youtube.com/@LinusTechTips";

    r = await testMethod("isChannelUrl", channelUrl);
    console.log(`   isChannelUrl(): ${r.success ? "✅" : "❌"} → ${r.result}`);

    r = await testMethod("getChannel", channelUrl);
    console.log(`   getChannel(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("getChannelCapabilities");
    console.log(`   getChannelCapabilities(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("getChannelPlaylists", channelUrl);
    console.log(`   getChannelPlaylists(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod(
      "getChannelContents",
      channelUrl,
      "video",
      "Chronological",
      {}
    );
    console.log(`   getChannelContents(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("getSearchChannelContentsCapabilities");
    console.log(
      `   getSearchChannelContentsCapabilities(): ${r.success ? "✅" : "❌"}`
    );

    r = await testMethod(
      "searchChannelContents",
      channelUrl,
      "test",
      "video",
      null,
      []
    );
    console.log(`   searchChannelContents(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("getPeekChannelTypes");
    console.log(`   getPeekChannelTypes(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("peekChannelContents", channelUrl, "video");
    console.log(`   peekChannelContents(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("getChannelTemplateByClaimMap");
    console.log(
      `   getChannelTemplateByClaimMap(): ${r.success ? "✅" : "❌"}`
    );

    // 5. Video/Content Methods
    console.log("\n5️⃣  Video/Content Methods\n");

    const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    r = await testMethod("isContentDetailsUrl", videoUrl);
    console.log(
      `   isContentDetailsUrl(): ${r.success ? "✅" : "❌"} → ${r.result}`
    );

    r = await testMethod("getContentDetails", videoUrl);
    console.log(`   getContentDetails(): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      console.log(
        `      Video: ${r.result.name || r.result.title || "Unknown"}`
      );
      console.log(`      Duration: ${r.result.duration}s`);
    } else if (!r.success) {
      console.log(`      Error: ${r.error}`);
    }

    r = await testMethod("getContentRecommendations", videoUrl, null);
    console.log(`   getContentRecommendations(): ${r.success ? "✅" : "❌"}`);

    // 6. Comment Methods
    console.log("\n6️⃣  Comment Methods\n");

    r = await testMethod("getComments", videoUrl);
    console.log(`   getComments(): ${r.success ? "✅" : "❌"}`);

    const testComment = { contextUrl: videoUrl };
    r = await testMethod("getSubComments", testComment);
    console.log(`   getSubComments(): ${r.success ? "✅" : "❌"}`);

    // 7. Playlist Methods (Optional)
    console.log("\n7️⃣  Playlist Methods\n");

    // Use a real YouTube playlist
    const playlistUrl =
      "https://www.youtube.com/playlist?list=PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo";

    r = await testMethod("isPlaylistUrl", playlistUrl);
    console.log(`   isPlaylistUrl(): ${r.success ? "✅" : "❌"} → ${r.result}`);

    r = await testMethod("getPlaylist", playlistUrl);
    console.log(`   getPlaylist(): ${r.success ? "✅" : "❌"}`);

    // 8. User Methods (Require Auth)
    console.log("\n8️⃣  User Methods (Auth Required)\n");

    r = await testAuthMethod("getUserSubscriptions");
    console.log(
      `   getUserSubscriptions(): ${
        r.success ? "✅" : r.authRequired ? "🔒" : "❌"
      }`
    );

    r = await testAuthMethod("getUserPlaylists");
    console.log(
      `   getUserPlaylists(): ${
        r.success ? "✅" : r.authRequired ? "🔒" : "❌"
      }`
    );

    // 9. Wrapper API Test
    console.log("\n9️⃣  Plugin Wrapper API\n");

    try {
      const isChannel = await client.plugin.isChannelUrl(
        "https://youtube.com/@test"
      );
      console.log(`   client.plugin.isChannelUrl(): ✅ → ${isChannel}`);
      results.passed++;
    } catch (e) {
      console.log(`   client.plugin.isChannelUrl(): ❌ → ${e.message}`);
      results.failed++;
    }

    try {
      const videos = await client.plugin.getHome();
      console.log(`   client.plugin.getHome(): ✅ → ${videos.length} videos`);
      results.passed++;
    } catch (e) {
      console.log(`   client.plugin.getHome(): ❌ → ${e.message}`);
      results.failed++;
    }

    // 10. Android Testing
    console.log("\n🔟 Android Device Testing\n");
    console.log("   ℹ️  Requires active GrayJay app connection\n");

    r = await client.testMethodAndroid("getHome");
    console.log(`   testMethodAndroid("getHome"): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      const videos = Array.isArray(r.result)
        ? r.result
        : r.result.results || [];
      console.log(`      Videos from Android: ${videos.length}`);
    }

    // Summary
    console.log(
      "\n╔══════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      `║     📊 TEST RESULTS                                             ║`
    );
    const total = results.passed + results.failed + results.authRequired;
    console.log(
      `║     ✅ Passed: ${results.passed}/${total}     ❌ Failed: ${results.failed}     🔒 Auth: ${results.authRequired}          ║`
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════════╝\n"
    );

    if (results.failed > 0) {
      console.log(
        "⚠️  Some failures expected for optional/unimplemented methods\n"
      );
    }
    if (results.authRequired > 0) {
      console.log(
        `🔒 ${results.authRequired} methods require authentication\n`
      );
    }
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
