// test_minimax.js
require('dotenv').config();
const { runModel } = require('./server/services/orchestrator');
(async () => {
  try {
    const systemPrompt = 'You are a helpful assistant.';
    const userPrompt = 'Give a short JSON summary of a software development lifecycle.';
    const result = await runModel(systemPrompt, userPrompt, 'MiniMax');
    console.log('MiniMax result:', result);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
