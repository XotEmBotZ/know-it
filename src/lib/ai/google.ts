import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing environment variable: GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-embedding-001 as per latest documentation
export const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Use Gemma 3 27B (Instruction Tuned) for clinical analysis
export const chatModel = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

/**
 * Normalizes a vector to unit length (L2 normalization).
 */
function normalize(v: number[]) {
  const magnitude = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return v;
  return v.map(val => val / magnitude);
}

/**
 * Generates an embedding for the given text.
 * Default taskType is RETRIEVAL_DOCUMENT for indexing.
 * Use RETRIEVAL_QUERY for search queries.
 */
export async function generateEmbedding(
  text: string, 
  taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT
) {
  const cleanText = text.trim() || ' ';
  
  const result = await embeddingModel.embedContent({
    content: { role: 'user', parts: [{ text: cleanText.replace(/\n/g, ' ') }] },
    taskType,
    // @ts-ignore - outputDimensionality is supported in gemini-embedding-001
    outputDimensionality: 1536,
  });
  
  // Normalize the embedding as recommended by Gemini docs for dimensions < 3072
  return normalize(result.embedding.values);
}
