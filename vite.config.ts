
import { defineConfig } from 'vite';

const repoName = 'negotiation_rpg';
// ----------------------------------------------------------------------------------

export default defineConfig(({ mode }) => {

  const isProduction = mode === 'production';

  return {

    base: isProduction ? `/${repoName}/` : '/',

    build: {
      outDir: 'dist',
    },


    define: {
      'import.meta.env.VITE_AZURE_SPEECH_KEY': JSON.stringify(process.env.AZURE_SPEECH_KEY),
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
    }
  }
});