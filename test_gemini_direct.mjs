import geminiClient from './server/services/geminiClient.js';
import 'dotenv/config';
const { callGemini } = geminiClient;

export async function runGeminiTest() {
  try {
    const systemPrompt = 'You are a helpful assistant.';
    const userPrompt = 'Hello';
    const reply = await callGemini(systemPrompt, userPrompt);
    console.log('✅ Gemini response received');
    console.dir(reply, { depth: 2 });
  } catch (e) {
    console.error('❌ Gemini error');
    console.error(e);
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', e.response.data);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGeminiTest();
}
