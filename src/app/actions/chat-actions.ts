'use server'

import { chatModel } from '@/lib/ai/google'
import { retrievePatientContext } from '@/lib/ai/retrieval'
import { formatSystemPrompt } from '@/lib/ai/prompts'
import { Message } from '@/components/dashboard/chat-ui'

export async function chatAction(patientId: string, patientName: string, query: string, history: Message[]) {
  try {
    // 1. Retrieve the most relevant clinical context based on the current query
    const context = await retrievePatientContext(patientId, query);

    // 2. Format the system prompt with the retrieved context
    const systemPrompt = formatSystemPrompt(patientName, context);

    // 3. Construct conversation for Gemini
    const chat = chatModel.startChat({
      history: history
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
    });

    // We send the system prompt as part of the instructions if it's the first message, 
    // or just prepend it for context if we're not using system instructions separately.
    // In SDK v0.x, we can pass systemInstruction to the model constructor, 
    // but here we'll prepend it to the query for simplicity or use a specific format.
    
    const prompt = `System Instruction: ${systemPrompt}\n\nUser Query: ${query}`;
    const result = await chat.sendMessage(prompt);
    const answer = result.response.text();

    return answer;
  } catch (error) {
    console.error('Chat AI failed:', error);
    return "I encountered an error while analyzing the patient's records. Please try again later.";
  }
}
