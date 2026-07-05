const http = require("http");

function runTest(query) {
  return new Promise((resolve, reject) => {
    console.log(`\n--- Starting Verification for: "${query}" ---`);
    const encoded = encodeURIComponent(query);
    const url = `http://localhost:3000/api/analysis/stream?requirements=${encoded}`;

    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Server returned status code ${res.statusCode}`));
        return;
      }

      let buffer = "";
      let receivedEvents = 0;
      let isComplete = false;
      let lastModules = null;

      res.on("data", (chunk) => {
        buffer += chunk.toString();
        
        // Parse SSE lines
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop();

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            try {
              const data = JSON.parse(dataStr);
              receivedEvents++;
              console.log(`[Event: ${currentEvent}] Received data payload.`);
              
              if (currentEvent === "progress") {
                console.log(`  Progress: Step ${data.step} (${data.label}) - ${data.percent}% via ${data.model}`);
              } else if (currentEvent === "module") {
                console.log(`  Module ID: ${data.id} (${data.name}) keys: ${Object.keys(data.data || {}).join(", ")}`);
              } else if (currentEvent === "complete") {
                isComplete = true;
                lastModules = data.modules;
                console.log(`  Complete: Received final module summaries.`);
              } else if (currentEvent === "error") {
                console.error(`  ERROR Event: ${data.message}`);
                reject(new Error(data.message));
              }
            } catch (e) {
              console.warn(`  Failed to parse data line: ${dataStr}. Error: ${e.message}`);
            }
            currentEvent = null;
          }
        }
      });

      res.on("end", () => {
        console.log(`--- Finished Stream. Received ${receivedEvents} event messages. ---`);
        if (isComplete && lastModules) {
          console.log("\nSuccess: Verification passed! All pipeline stages returned valid data structures.");
          resolve(lastModules);
        } else {
          reject(new Error("Stream ended without receiving 'complete' event."));
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function verifyAll() {
  try {
    // Test 1: Food Delivery App Sample
    const foodBrief = "Develop an online food delivery application with user registration, menu management, and real-time GPS tracking.";
    const foodResults = await runTest(foodBrief);
    
    // Assert structure matches UI expectations
    if (!foodResults.extracted || !foodResults.extracted.projectTitle || foodResults.extracted.functionalRequirements.length === 0) {
      throw new Error("Validation check failed: Elicitation module results are empty or incorrect.");
    }
    if (!foodResults.analyzed || !foodResults.analyzed.technologyRecommendation) {
      throw new Error("Validation check failed: Analysis module results are missing technology recommendations.");
    }
    if (!foodResults.feasibility || !foodResults.feasibility.overallVerdict) {
      throw new Error("Validation check failed: Feasibility module verdict is missing.");
    }
    console.log("Assert checks passed for Sample Brief!");

    // Test 2: Custom Project Brief
    const customBrief = "A simple mobile app for pet training tutorials with user videos and trainer advice.";
    const customResults = await runTest(customBrief);
    
    // Assert structure matches UI expectations
    if (!customResults.extracted || !customResults.extracted.projectTitle || !(customResults.extracted.projectTitle.toLowerCase().includes('pet') && customResults.extracted.projectTitle.toLowerCase().includes('training'))) {
      throw new Error('Validation check failed: Custom title generation did not contain required keywords.');
    }
    console.log("Assert checks passed for Custom Brief!");
    
    console.log("\n==============================================");
    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
    console.log("==============================================");
    process.exit(0);
  } catch (err) {
    console.error("\n==============================================");
    console.error(`VERIFICATION FAILED: ${err.message}`);
    console.error("==============================================");
    process.exit(1);
  }
}

// Wait for server to be ready before calling
setTimeout(verifyAll, 1000);
