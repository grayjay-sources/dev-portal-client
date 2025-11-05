/**
 * Debug test to see actual API responses
 */

const { DevPortalClient } = require("../dist");

async function main() {
  console.log("🔍 Debug Test\n");

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

    console.log(`📦 Testing with: ${config.name}\n`);

    // Load and inject
    await client.loadPortal(8000);
    await client.updateTestPlugin(
      "https://plugins.grayjay.app/Youtube/YoutubeScript.js",
      config
    );

    console.log("⏳ Waiting 5 seconds...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Test with debug enabled
    console.log("Testing isChannelUrl with DEBUG:\n");
    const result = await client.testMethod(
      "isChannelUrl",
      "https://youtube.com/@test",
      true
    );

    console.log("\n📊 Final result object:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
