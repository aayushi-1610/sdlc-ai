const fs = require("fs");
const { jsonrepair } = require("jsonrepair");

function escapeInnerQuotes(json) {
  let result = "";
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (ch === '"' && json[i - 1] !== "\\") {
      if (!inString) {
        inString = true;
        result += ch;
      } else {
        let j = i + 1;
        while (j < json.length && /\s/.test(json[j])) j++;
        const next = json[j];
        if (next === "," || next === "}" || next === "]" || next === ":" || next === undefined) {
          inString = false;
          result += ch;
        } else {
          result += '\\"';
        }
      }
    } else {
      result += ch;
    }
  }
  return result;
}

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
  cleaned = cleaned.replace(/(\b\w+",?)\s*\n\s*(?!")\1/g, "$1");
  cleaned = cleaned.replace(/([{,]\s*)"([a-zA-Z0-9_$]+)\s*:\s*([^"]+)"/g, '$1"$2": "$3"');
  cleaned = cleaned.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*:\s*"[^"]*"/g, '"$1": "$2"');
  cleaned = cleaned.replace(/([{,]\s*)'([a-zA-Z0-9_$]+)'\s*:/g, '$1"$2":');
  cleaned = cleaned.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  cleaned = cleaned.replace(/([\[,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'(?=\s*[,\]])/g, '$1"$2"');
  cleaned = cleaned.replace(/:\s*(?!true|false|null|[0-9\-'"\[{])([a-zA-Z0-9_\-]+)(?=\s*(?:,\s*"|\s*}))/g, ': "$1"');
  cleaned = cleaned.replace(/,\s*}/g, "}");
  cleaned = cleaned.replace(/,\s*]/g, "]");
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/(?:^|[^:])\/\/.*$/gm, "");
  return escapeInnerQuotes(cleaned.trim());
}

for (const f of ["gemini_uiux_fail_output.txt", "gemini_database_fail_output.txt"]) {
  const raw = fs.readFileSync(f, "utf8");
  const cleaned = cleanJSONResponse(raw);
  try {
    JSON.parse(cleaned);
    console.log(f, "PARSED OK (clean only)");
  } catch (e) {
    try {
      const repaired = jsonrepair(cleaned);
      JSON.parse(repaired);
      console.log(f, "PARSED OK (jsonrepair)");
    } catch (e2) {
      const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || 0, 10);
      console.log(f, e.message);
      console.log("jsonrepair also failed:", e2.message);
      console.log("Context:", cleaned.substring(Math.max(0, pos - 100), pos + 100));
    }
  }
}
