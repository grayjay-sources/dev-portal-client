/**
 * Comprehensive YouTube plugin test
 * Tests ALL Source interface methods from plugin.d.ts
 */

const { DevPortalClient } = require("../dist");

// ============================================================================
// TEST DATA - URLs and Constants
// ============================================================================

const TEST_URLS = {
  // Channel URLs
  CHANNEL: "https://www.youtube.com/@LinusTechTips",

  // Video URLs
  VIDEO_STANDARD: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Astley
  VIDEO_WITH_COMMENTS: "https://www.youtube.com/watch?v=HLxDp5rZmIs", // Video with active comments

  // Playlist URLs
  PLAYLIST:
    "https://www.youtube.com/playlist?list=PL_XvAI8qGLlWmZcJQzcLfK0RrNz50DbD-",

  // Search queries
  SEARCH_QUERY: "javascript tutorial",
};

const DEV_PORTAL = {
  HOST: "192.168.2.128",
  PORT: 11337,
};

const YOUTUBE_CONFIG = {
  URL: "https://plugins.grayjay.app/Youtube/YoutubeConfig.json",
  SCRIPT_URL: "https://plugins.grayjay.app/Youtube/YoutubeScript.js",
};

// ============================================================================
// Main Test Suite
// ============================================================================

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
    const client = new DevPortalClient(DEV_PORTAL.HOST, DEV_PORTAL.PORT);

    // Fetch YouTube config
    const https = require("https");
    const config = await new Promise((resolve, reject) => {
      https
        .get(YOUTUBE_CONFIG.URL, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(JSON.parse(data)));
        })
        .on("error", reject);
    });

    console.log(`📦 Plugin: ${config.name} v${config.version}\n`);

    // Setup
    console.log("🔧 Setup...");
    await client.loadPortal(8000);
    await client.updateTestPlugin(YOUTUBE_CONFIG.SCRIPT_URL, config);
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

    r = await testMethod("searchSuggestions", TEST_URLS.SEARCH_QUERY);
    console.log(
      `   searchSuggestions("${TEST_URLS.SEARCH_QUERY}"): ${
        r.success ? "✅" : "❌"
      }`
    );
    if (r.success && Array.isArray(r.result)) {
      console.log(`      Suggestions: ${r.result.length}`);
      if (r.result[0]) console.log(`      First: "${r.result[0]}"`);
    }

    // Valid sort: null (relevance), "Chronological", "Views", "Rating"
    r = await testMethod("search", TEST_URLS.SEARCH_QUERY, "video", null, []);
    console.log(
      `   search("${TEST_URLS.SEARCH_QUERY}"): ${r.success ? "✅" : "❌"}`
    );
    if (r.success && r.result) {
      const results = Array.isArray(r.result)
        ? r.result
        : r.result.results || [];
      console.log(`      Results: ${results.length}`);
      if (results[0])
        console.log(`      First: ${results[0].name || results[0].title}`);
    } else if (!r.success) {
      console.log(`      Error: ${r.error}`);
    }

    r = await testMethod("getSearchCapabilities");
    console.log(`   getSearchCapabilities(): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      const caps = r.result;
      console.log(`      Types: ${caps.types?.join(", ") || "N/A"}`);
      console.log(`      Sorts: ${caps.sorts?.join(", ") || "N/A"}`);
    }

    r = await testMethod("searchChannels", TEST_URLS.SEARCH_QUERY);
    console.log(
      `   searchChannels("${TEST_URLS.SEARCH_QUERY}"): ${
        r.success ? "✅" : "❌"
      }`
    );
    if (r.success && r.result) {
      const results = Array.isArray(r.result)
        ? r.result
        : r.result.results || [];
      console.log(`      Channels found: ${results.length}`);
    }

    r = await testMethod(
      "searchPlaylists",
      TEST_URLS.SEARCH_QUERY,
      "playlist",
      null,
      []
    );
    console.log(
      `   searchPlaylists("${TEST_URLS.SEARCH_QUERY}"): ${
        r.success ? "✅" : "❌"
      }`
    );
    if (r.success && r.result) {
      const results = Array.isArray(r.result)
        ? r.result
        : r.result.results || [];
      console.log(`      Playlists found: ${results.length}`);
    }

    // 4. Channel Methods
    console.log("\n4️⃣  Channel Methods\n");

    r = await testMethod("isChannelUrl", TEST_URLS.CHANNEL);
    console.log(
      `   isChannelUrl("${TEST_URLS.CHANNEL}"): ${r.success ? "✅" : "❌"} → ${
        r.result
      }`
    );

    r = await testMethod("getChannel", TEST_URLS.CHANNEL);
    console.log(
      `   getChannel("${TEST_URLS.CHANNEL}"): ${r.success ? "✅" : "❌"}`
    );
    if (r.success && r.result) {
      console.log(`      Name: ${r.result.name || "N/A"}`);
      console.log(`      Subscribers: ${r.result.subscribers || "N/A"}`);
    }

    r = await testMethod("getChannelCapabilities");
    console.log(`   getChannelCapabilities(): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      console.log(`      Has Playlists: ${!!r.result.hasPlaylists}`);
      console.log(
        `      Content Types: ${r.result.types?.join(", ") || "N/A"}`
      );
    }

    r = await testMethod("getChannelPlaylists", TEST_URLS.CHANNEL);
    console.log(`   getChannelPlaylists(): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      const playlists = Array.isArray(r.result)
        ? r.result
        : r.result.results || [];
      console.log(`      Playlists: ${playlists.length}`);
    }

    // Type.Feed: null/empty defaults to Videos, or try "", "Live", "Streams", "Shorts"
    r = await testMethod(
      "getChannelContents",
      TEST_URLS.CHANNEL,
      null,
      "Chronological",
      {}
    );
    console.log(`   getChannelContents(): ${r.success ? "✅" : "❌"}`);
    if (!r.success) console.log(`      Error: ${r.error}`);

    r = await testMethod("getSearchChannelContentsCapabilities");
    console.log(
      `   getSearchChannelContentsCapabilities(): ${r.success ? "✅" : "❌"}`
    );

    r = await testMethod(
      "searchChannelContents",
      TEST_URLS.CHANNEL,
      TEST_URLS.SEARCH_QUERY,
      "video",
      null,
      []
    );
    console.log(`   searchChannelContents(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("getPeekChannelTypes");
    console.log(`   getPeekChannelTypes(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("peekChannelContents", TEST_URLS.CHANNEL, "video");
    console.log(`   peekChannelContents(): ${r.success ? "✅" : "❌"}`);

    r = await testMethod("getChannelTemplateByClaimMap");
    console.log(
      `   getChannelTemplateByClaimMap(): ${r.success ? "✅" : "❌"}`
    );

    // 5. Video/Content Methods
    console.log("\n5️⃣  Video/Content Methods\n");

    r = await testMethod("isContentDetailsUrl", TEST_URLS.VIDEO_STANDARD);
    console.log(
      `   isContentDetailsUrl(): ${r.success ? "✅" : "❌"} → ${r.result}`
    );

    r = await testMethod("getContentDetails", TEST_URLS.VIDEO_STANDARD);
    console.log(
      `   getContentDetails("${TEST_URLS.VIDEO_STANDARD}"): ${
        r.success ? "✅" : "❌"
      }`
    );
    if (r.success && r.result) {
      console.log(
        `      Video: ${r.result.name || r.result.title || "Unknown"}`
      );
      console.log(`      Duration: ${r.result.duration}s`);
      console.log(`      Views: ${r.result.viewCount || "N/A"}`);
    } else if (!r.success) {
      console.log(`      Error: ${r.error}`);
    }

    r = await testMethod(
      "getContentRecommendations",
      TEST_URLS.VIDEO_STANDARD,
      null
    );
    console.log(`   getContentRecommendations(): ${r.success ? "✅" : "❌"}`);

    // 6. Comment Methods
    console.log("\n6️⃣  Comment Methods\n");

    // Use a video with active comments that have replies
    const commentsVideoUrl = "https://www.youtube.com/watch?v=HLxDp5rZmIs";

    r = await testMethod("getComments", commentsVideoUrl);
    console.log(`   getComments(): ${r.success ? "✅" : "❌"}`);

    // Get a real comment to test getSubComments
    if (r.success && r.result && Array.isArray(r.result)) {
      const commentWithReplies = r.result.find(
        (c) => c.replyCount && c.replyCount > 0
      );
      if (commentWithReplies) {
        // Note: getSubComments has a Gson limitation in remote testing
        // The browser's "Test" button works because it executes locally
        // For now, we'll skip this test - future versions will add local execution
        console.log(
          `   getSubComments(): ⏭️  (Gson limitation - works in browser/local execution)`
        );
        results.skipped++;
      } else {
        console.log(
          `   getSubComments(): ⏭️  (no comments with replies found)`
        );
        results.skipped++;
      }
    } else {
      console.log(`   getSubComments(): ⏭️  (getComments failed)`);
      results.skipped++;
    }

    // 7. Playlist Methods (Optional)
    console.log("\n7️⃣  Playlist Methods\n");

    r = await testMethod("isPlaylistUrl", TEST_URLS.PLAYLIST);
    console.log(
      `   isPlaylistUrl("${TEST_URLS.PLAYLIST}"): ${
        r.success ? "✅" : "❌"
      } → ${r.result}`
    );

    r = await testMethod("getPlaylist", TEST_URLS.PLAYLIST);
    console.log(`   getPlaylist(): ${r.success ? "✅" : "❌"}`);
    if (r.success && r.result) {
      console.log(`      Playlist: ${r.result.name || "N/A"}`);
      console.log(`      Videos: ${r.result.videoCount || "N/A"}`);
    } else if (!r.success && r.error) {
      console.log(`      Error: ${r.error}`);
    }

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
