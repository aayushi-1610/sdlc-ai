import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.NIM_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "nvidia/nemotron-3-super-120b-a12b",
    messages: [{ role: "user", content: "Hello" }],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 1024,
    reasoning_budget: 512,
    chat_template_kwargs: { enable_thinking: true },
    stream: false,
  });

  // Non‑streaming response: `completion` is a plain object
  const content = completion.choices?.[0]?.message?.content;
  if (content) {
    console.log(content);
  } else {
    console.error("No content returned");
  }
}

main();
