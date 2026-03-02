'use server'

import { chatModel } from '@/lib/ai/google'
import { retrievePatientContext } from '@/lib/ai/retrieval'
import { formatSystemPrompt } from '@/lib/ai/prompts'
import { Message } from '@/components/dashboard/chat-ui'
import { createClient } from '@/utils/supabase/server'
import { DataAccessLayer } from '@/lib/dal'

export async function chatAction(
  patientId: string, 
  patientName: string, 
  query: string, 
  history: Message[], 
  role: 'doctor' | 'patient' = 'doctor',
  fullHistory: boolean = false
) {
  try {
    const supabase = await createClient();
    const dal = new DataAccessLayer(supabase);

    // 1. Retrieve clinical context
    let context = '';
    
    if (role === 'doctor' && fullHistory) {
      // Fetch EVERYTHING for full analysis
      const [allHistory, allTests] = await Promise.all([
        dal.getPatientHistory(patientId),
        dal.getPatientTests(patientId)
      ]);

      let fullContext = 'FULL MEDICAL HISTORY:\n';
      allHistory.forEach((h, i) => {
        fullContext += `\n[RECORD - Date: ${new Date(h.date).toLocaleDateString()}] Symptoms: ${h.symptoms} | Solutions: ${h.solutions}`;
      });
      allTests.forEach((t, i) => {
        fullContext += `\n[TEST - Date: ${new Date(t.date).toLocaleDateString()}] ${t.test_name}: ${t.results}`;
      });
      context = fullContext;
    } else {
      // Use RAG for targeted search
      context = await retrievePatientContext(patientId, query);

      // 2. Explicitly add recent context to ensure dates and patterns are available
      if (role === 'patient') {
        const [latestHistory, latestTests] = await Promise.all([
          dal.getPatientHistory(patientId),
          dal.getPatientTests(patientId)
        ]);

        let latestContext = '';
        if (latestHistory && latestHistory.length > 0) {
          const h = latestHistory[0];
          latestContext += `\n[LATEST MEDICAL RECORD - Date: ${new Date(h.date).toLocaleDateString()}] Symptoms: ${h.symptoms} | Solutions/Prescription: ${h.solutions}`;
        }
        if (latestTests && latestTests.length > 0) {
          const t = latestTests[0];
          latestContext += `\n[LATEST TEST RESULT - Date: ${new Date(t.date).toLocaleDateString()}] ${t.test_name}: ${t.results}`;
        }

        if (latestContext) {
          context = `MOST RECENT DATA:${latestContext}\n\nOTHER RELEVANT HISTORY (RAG):\n${context}`;
        }
      } else if (role === 'doctor') {
        const [recentHistory, recentTests] = await Promise.all([
          dal.getPatientHistory(patientId).then(h => h.slice(0, 3)),
          dal.getPatientTests(patientId).then(t => t.slice(0, 3))
        ]);

        let recentContext = '';
        recentHistory.forEach((h, i) => {
          recentContext += `\n[RECENT RECORD ${i+1} - Date: ${new Date(h.date).toLocaleDateString()}] Symptoms: ${h.symptoms} | Solutions: ${h.solutions}`;
        });
        recentTests.forEach((t, i) => {
          recentContext += `\n[RECENT TEST ${i+1} - Date: ${new Date(t.date).toLocaleDateString()}] ${t.test_name}: ${t.results}`;
        });

        if (recentContext) {
          context = `MOST RECENT RECORDS (to help find patterns and dates):${recentContext}\n\nRELEVANT SEARCH RESULTS (RAG):\n${context}`;
        }
      }
    }

    // 3. Format the system prompt with the retrieved context and role
    const systemPrompt = formatSystemPrompt(patientName, context, role);

    // 4. Construct conversation for Gemini
    // GEMINI SDK REQUIREMENT: First content must be role 'user'
    const geminiHistory = history
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Find first user index
    const firstUserIndex = geminiHistory.findIndex(m => m.role === 'user');
    const validHistory = firstUserIndex !== -1 ? geminiHistory.slice(firstUserIndex) : [];

    const chat = chatModel.startChat({
      history: validHistory,
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
