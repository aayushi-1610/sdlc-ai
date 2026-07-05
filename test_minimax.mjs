// test_minimax.js
// Simple test for the MiniMax‑M3 model via NVIDIA Integrate API

import axios from "axios";
import "dotenv/config";

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const stream = false; // change to true for streaming responses

const headers = {
  Authorization: `Bearer ${process.env.MINIMAX_API_KEY || process.env.NIM_API_KEY}`,
  Accept: stream ? "text/event-stream" : "application/json",
};

const payload = {
  model: "minimaxai/minimax-m2.7",
  messages: [
    { role: "user", content: "You are a requirements analyst.\n\nExplain the benefits of AI." }
  ],
  max_tokens: 2048,
  temperature: 0.1,
  top_p: 0.95,
  stream: stream,
};

axios
  .post(invokeUrl, payload, {
    headers: headers,
    responseType: stream ? "stream" : "json",
  })
  .then((response) => {
    if (stream) {
      response.data.on("data", (chunk) => {
        console.log(chunk.toString());
      });
    } else {
      console.log(JSON.stringify(response.data, null, 2));
    }
  })
  .catch((error) => {
    if (error.response) {
      console.error(`HTTP ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error);
    }
  });
