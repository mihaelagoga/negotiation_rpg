

export const KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
export const chatGPTKey = import.meta.env.VITE_OPENAI_API_KEY;


if (!KEY || !chatGPTKey) {
  console.warn("API keys not found. Ensure VITE_AZURE_SPEECH_KEY and VITE_OPENAI_API_KEY environment variables are set.");
}
console.log("Azure Key Loaded:", KEY ? 'Yes' : 'No');
console.log("ChatGPT Key Loaded:", chatGPTKey ? 'Yes' : 'No');