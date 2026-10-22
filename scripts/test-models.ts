import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val) {
        process.env[key.trim()] = val;
      }
    }
  }
}
loadEnvLocal();

async function testModel(modelName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: 'Hello, reply with "OK".' }] }],
    });
    console.log(`Success on ${modelName}:`, res.text?.trim());
    return true;
  } catch (err: any) {
    console.error(`Error on ${modelName}:`, err?.message || err);
    return false;
  }
}

async function main() {
  await testModel('gemini-2.5-flash-lite');
}

main().catch(console.error);
