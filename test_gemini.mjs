import axios from 'axios';
import 'dotenv/config';

const key = process.env.GEMINI_API_KEY;
const models = ['gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash'];

console.log('Testing Gemini API key:', key ? key.slice(0, 12) + '...' : 'NOT SET');

for (const model of models) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { contents: [{ role: 'user', parts: [{ text: 'Say hello in one word.' }] }] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 600000 }
    );
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(`✅ ${model} -> ${text?.trim()}`);
    process.exit(0);
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    console.log(`❌ ${model} -> ${msg.split('\n')[0]}`);
  }
}

console.log('All models failed.');
