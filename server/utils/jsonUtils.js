const fs = require("fs");
const { jsonrepair } = require("jsonrepair");

function extractJSONObject(text) {
  if (!text) return "{}";
  let cleaned = text.trim();
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  const match = jsonBlockRegex.exec(cleaned) || codeBlockRegex.exec(cleaned);
  if (match && match[1]) return match[1].trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1).trim();
  }
  return cleaned;
}

function applyLightFixes(json) {
  let cleaned = json;
  cleaned = cleaned.replace(/,\s*}/g, "}");
  cleaned = cleaned.replace(/,\s*]/g, "]");
  return cleaned.trim();
}

function applyAggressiveFixes(json) {
  let cleaned = applyLightFixes(json);
  cleaned = cleaned.replace(/(\b\w+",?)\s*\n\s*(?!")\1/g, "$1");
  cleaned = cleaned.replace(/([{,]\s*)"([a-zA-Z0-9_$]+)\s*:\s*([^"]+)"/g, '$1"$2": "$3"');
  cleaned = cleaned.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*:\s*"[^"]*"/g, '"$1": "$2"');
  cleaned = cleaned.replace(/([{,]\s*)'([a-zA-Z0-9_$]+)'\s*:/g, '$1"$2":');
  cleaned = cleaned.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  cleaned = cleaned.replace(/([\[,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'(?=\s*[,\]])/g, '$1"$2"');
  cleaned = cleaned.replace(/:\s*(?!true|false|null|[0-9\-'"\[{])([a-zA-Z0-9_\-]+)(?=\s*(?:,\s*"|\s*}))/g, ': "$1"');
  cleaned = cleaned.replace(/:\s*\+([0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/g, ': $1');
  cleaned = cleaned.replace(/([\[,]\s*)\+([0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)(?=\s*[,\]])/g, '$1$2');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/(?:^|[^:])\/\/.*$/gm, "");
  return cleaned.trim();
}

function cleanJSONResponse(text) {
  return applyAggressiveFixes(extractJSONObject(text));
}

function isParseError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("unexpected token") ||
    msg.includes("unexpected number") ||
    msg.includes("unexpected string") ||
    msg.includes("unexpected end of json") ||
    msg.includes("json at position") ||
    msg.includes("unterminated string") ||
    msg.includes("bad control character") ||
    msg.includes("not valid json") ||
    msg.includes("colon expected")
  );
}

function parseAIJSON(text, moduleName) {
  const raw = extractJSONObject(text);
  const strategies = [
    () => JSON.parse(applyLightFixes(raw)),
    () => JSON.parse(jsonrepair(raw)),
    () => JSON.parse(applyAggressiveFixes(raw)),
    () => JSON.parse(jsonrepair(applyAggressiveFixes(raw))),
    () => JSON.parse(jsonrepair(text.trim())),
  ];

  let lastError = null;
  for (const strategy of strategies) {
    try {
      return strategy();
    } catch (err) {
      lastError = err;
    }
  }

  console.error(`[jsonUtils] JSON parse error in ${moduleName}: ${lastError.message}`);
  try {
    const filename = `${(moduleName || "unknown").toLowerCase().replace(/\s+/g, "_")}_fail_output.txt`;
    fs.writeFileSync(filename, text || `(No output captured. Error: ${lastError.message})`);
    console.log(`[jsonUtils] Wrote raw output for ${moduleName} to ${filename} for debugging.`);
  } catch (fsErr) {
    console.error(`[jsonUtils] Failed to write fail output file: ${fsErr.message}`);
  }
  throw lastError;
}

module.exports = {
  cleanJSONResponse,
  parseAIJSON,
  isParseError,
};
