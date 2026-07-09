const http = require("http");

function consumeSSE(url, onEvent) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Server returned status code ${res.statusCode}`));
        return;
      }

      let buffer = "";
      let lastComplete = null;

      res.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop();

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            try {
              const data = JSON.parse(dataStr);
              onEvent(currentEvent, data);
              if (currentEvent === "complete") lastComplete = data;
              if (currentEvent === "design_complete") lastComplete = data;
              if (currentEvent === "error" || currentEvent === "design_error") {
                reject(new Error(data.message || "Pipeline error"));
              }
            } catch (e) {
              console.warn(`  Failed to parse SSE data: ${e.message}`);
            }
            currentEvent = null;
          }
        }
      });

      res.on("end", () => {
        if (lastComplete) resolve(lastComplete);
        else reject(new Error("Stream ended without complete event"));
      });
    }).on("error", reject);
  });
}

async function runAnalysisTest(query) {
  console.log(`\n--- Analysis: "${query.substring(0, 60)}..." ---`);
  const encoded = encodeURIComponent(query);
  const result = await consumeSSE(
    `http://localhost:3000/api/analysis/stream?requirements=${encoded}`,
    (event, data) => {
      if (event === "progress") {
        console.log(`  [progress] ${data.percent}% — ${data.label} (${data.model})`);
      } else if (event === "module") {
        console.log(`  [module] #${data.id} ${data.name}`);
      }
    }
  );

  if (!result.modules?.extracted?.functionalRequirements?.length) {
    throw new Error("Analysis missing functional requirements");
  }
  if (!result.sessionId) throw new Error("Analysis missing sessionId");
  if (!result.modules?.report) throw new Error("Analysis missing markdown report");
  console.log(`  ✓ Analysis complete — session: ${result.sessionId}`);
  return result;
}

async function runDesignTest(sessionId) {
  console.log(`\n--- Design Phase (session: ${sessionId}) ---`);
  const result = await consumeSSE(
    `http://localhost:3000/api/design/stream?sessionId=${encodeURIComponent(sessionId)}`,
    (event, data) => {
      if (event === "design_progress") {
        console.log(`  [design] ${data.percent}% — ${data.label} (${data.model})`);
      } else if (event === "design_module") {
        console.log(`  [design_module] ${data.id}`);
      } else if (event === "design_module_error") {
        console.warn(`  [design_error] ${data.id}: ${data.message}`);
      }
    }
  );

  const design = result.design;
  if (!design?.hld || !Object.keys(design.hld).length) {
    throw new Error("Design missing HLD module");
  }
  if (!design?.fusion) throw new Error("Design missing fusion module");
  console.log(`  ✓ Design complete — modules: ${Object.keys(design).join(", ")}`);
  return result;
}

async function verifyAll() {
  try {
    const brief = "Develop an online food delivery application with user registration, menu management, and real-time GPS tracking.";
    const analysis = await runAnalysisTest(brief);
    await runDesignTest(analysis.sessionId);

    console.log("\n==============================================");
    console.log("FULL PIPELINE VERIFICATION PASSED");
    console.log("Analysis + Design phases working end-to-end");
    console.log("==============================================");
    process.exit(0);
  } catch (err) {
    console.error("\n==============================================");
    console.error(`VERIFICATION FAILED: ${err.message}`);
    console.error("==============================================");
    process.exit(1);
  }
}

setTimeout(verifyAll, 1500);
