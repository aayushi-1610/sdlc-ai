const fs = require("fs");
const { jsonrepair } = require("jsonrepair");

function cleanJSONResponse(text) {
  if (!text) return "{}";
  let cleaned = text.trim();
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  let match = jsonBlockRegex.exec(cleaned) || codeBlockRegex.exec(cleaned);
  if (match && match[1]) cleaned = match[1].trim();
  else {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
  }
  cleaned = cleaned.replace(/,\s*}/g, "}");
  cleaned = cleaned.replace(/,\s*]/g, "]");
  return cleaned.trim();
}

const raw = fs.readFileSync("gemini_database_fail_output.txt", "utf8");
const cleaned = cleanJSONResponse(raw);

// Try repair on raw without aggressive cleaning
try {
  JSON.parse(jsonrepair(raw.trim()));
  console.log("raw jsonrepair OK");
} catch (e) {
  console.log("raw jsonrepair fail:", e.message);
}

try {
  JSON.parse(jsonrepair(cleaned));
  console.log("cleaned jsonrepair OK");
} catch (e) {
  console.log("cleaned jsonrepair fail:", e.message);
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || 0, 10);
  console.log("context:", jsonrepair(cleaned).substring(pos - 150, pos + 150));
}
