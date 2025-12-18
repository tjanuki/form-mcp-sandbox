// Global type definitions for ChatGPT's OpenAI window API

interface OpenAIWindowAPI {
  data?: any;
  setState?: (state: any) => void;
}

declare global {
  interface Window {
    openai?: OpenAIWindowAPI;
  }
}

export {};
