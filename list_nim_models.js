import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function listModels() {
  try {
    const response = await openai.models.list();
    console.log('Available models:');
    console.log(response.data);
  } catch (e) {
    console.error('Error listing models:', e);
  }
}

listModels();
