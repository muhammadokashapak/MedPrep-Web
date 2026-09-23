export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Wait for specified milliseconds
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API call with automatic retry on rate limit (429) and server errors (500/503)
 */
async function fetchWithRetry(url, options, maxRetries = 5, onRetry) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) return response;

      if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        let delaySeconds;
        
        if (retryAfter && !isNaN(Number(retryAfter))) {
          delaySeconds = Math.max(Number(retryAfter), 10);
        } else {
          delaySeconds = Math.min(15 + (attempt * 15), 60);
        }

        if (onRetry) onRetry(attempt + 1, maxRetries, delaySeconds);
        await wait(delaySeconds * 1000);
        continue;
      }

      const errorData = await response.json().catch(() => ({}));
      const apiErrorMsg = errorData?.error?.message || 'Unknown Gemini API Error';
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Invalid Gemini API key. Details: ${apiErrorMsg}`);
      }
      if (response.status === 400) {
        throw new Error(`Gemini Request Error (400): ${apiErrorMsg}`);
      }
      if (response.status === 429) {
        throw new Error('API rate limit — sab retries khatam ho gayi. 2 minute baad try karen.');
      }
      throw new Error(apiErrorMsg || `API Error: ${response.status}`);
    } catch (err) {
      if (err.name === 'TypeError' && attempt < maxRetries) {
        const delaySeconds = Math.min(15 + (attempt * 15), 60);
        if (onRetry) onRetry(attempt + 1, maxRetries, delaySeconds);
        await wait(delaySeconds * 1000);
        continue;
      }
      throw err;
    }
  }
}

/**
 * Extract text from an array of base64 images using OpenRouter Vision
 */
export async function extractTextFromImages(base64Images, onProgress) {
  const batchSize = 10; // OpenRouter/Gemini handles multiple images, 10 is safe
  let allText = '';

  for (let i = 0; i < base64Images.length; i += batchSize) {
    const batch = base64Images.slice(i, i + batchSize);

    if (onProgress) onProgress(`🔍 OCR: Pages ${i + 1}-${Math.min(i + batchSize, base64Images.length)} of ${base64Images.length}...`);

    const imageParts = batch.map(img => ({
      inlineData: { mimeType: 'image/png', data: img }
    }));

    const response = await fetchWithRetry(
      `${GEMINI_API_URL}?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Extract ALL text from these scanned book/document pages. Return ONLY the extracted text content, preserving paragraphs and structure. Do not add any commentary or explanation. If there are diagrams or figures, briefly describe them in brackets like [Figure: description]. Extract every single word visible in the images.' },
              ...imageParts
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        })
      },
      3,
      (attempt, max, delay) => {
        if (onProgress) onProgress(`⏳ OCR rate limit — retry ${attempt}/${max}, ${delay}s wait...`);
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    allText += text + '\n\n';

    if (i + batchSize < base64Images.length) {
      await wait(3000);
    }
  }

  return allText.trim();
}

/**
 * Generate MCQs from multiple sources using chunked API calls to avoid token limits.
 * Uses a callback to stream chunks back to the UI.
 */
export async function generateMCQs(sources, difficulty, onStatusUpdate, onChunkReceived) {
  const maxChars = 150000;
  let allQuestions = [];
  const statusUpdate = onStatusUpdate || (() => {});
  const chunkCallback = onChunkReceived || (() => {});

  let chunkIndex = 1;
  let isFirstChunk = true;
  let totalTarget = sources.reduce((acc, src) => acc + src.count, 0);

  try {
    for (const source of sources) {
      if (source.count <= 0) continue;

      const truncatedText = source.text.length > maxChars
        ? source.text.substring(0, maxChars) + '\n...[Content truncated]'
        : source.text;

      let remainingCount = source.count;

      while (remainingCount > 0) {
        let chunkCount = 30;
        if (isFirstChunk && remainingCount >= 5) {
          chunkCount = 5;
        } else {
          chunkCount = Math.min(30, remainingCount);
        }
        
        remainingCount -= chunkCount;

        const easyCount = Math.round(chunkCount * (difficulty.easy / 100));
        const medCount = Math.round(chunkCount * (difficulty.medium / 100));
        const hardCount = Math.round(chunkCount * (difficulty.hard / 100));
        const techCount = chunkCount - easyCount - medCount - hardCount;

        const prompt = `You are an expert MDCAT (Medical and Dental College Admission Test) exam paper setter for Pakistani FSc Pre-Medical students.

I will provide you with study material content. You MUST generate MCQs ONLY from the provided content below. Do NOT use any external knowledge. Every question must be directly based on the information in the text.

Generate exactly ${chunkCount} multiple-choice questions with this difficulty distribution:
- ${easyCount} EASY questions (direct facts, definitions, and recall from the text)
- ${medCount} MEDIUM questions (conceptual understanding from the text)
- ${hardCount} HARD questions (application and analysis based on the text)
- ${techCount} TECHNICAL questions (tricky MDCAT-level questions based on the text)

IMPORTANT RULES:
1. Each question MUST have exactly 4 options (A, B, C, D)
2. Exactly one option must be correct
3. Questions must be STRICTLY from the provided content only
4. Mix up the position of correct answers
5. Provide a short, 1-2 sentence explanation of WHY the answer is correct

Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks. Just the raw JSON array.

Each object in the array must have this exact structure:
{"q": "question text", "opts": ["option A", "option B", "option C", "option D"], "correct": 0, "difficulty": "Easy", "explanation": "reasoning here"}

Where "correct" is the 0-based index of the correct option (0, 1, 2, or 3).
Where "difficulty" is one of: "Easy", "Medium", "Hard", "Technical"

HERE IS THE STUDY MATERIAL CONTENT:
---
${truncatedText}
---

Generate the JSON array now:`;

        if (isFirstChunk) {
          statusUpdate(`⏳ Pehle 5 MCQs generate ho rahe hen... Test bas start hone wala hai!`);
        } else {
          statusUpdate(`⏳ Background generation... (${allQuestions.length}/${totalTarget} MCQs)`);
        }

        const response = await fetchWithRetry(
          `${GEMINI_API_URL}?key=${API_KEY}`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
              }
            })
          },
          5,
          (attempt, maxRetries, delaySec) => {
            statusUpdate(`⏳ Rate limit — retry ${attempt}/${maxRetries}, ${delaySec}s wait...`);
          }
        );

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawText) throw new Error('AI se koi response nahi aaya. Dobara try karen.');

        let cleanText = rawText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }

        let questions;
        try {
          questions = JSON.parse(cleanText);
        } catch (e) {
          try {
            const lastBraceIndex = cleanText.lastIndexOf('}');
            if (lastBraceIndex > -1) {
              const fixedText = cleanText.substring(0, lastBraceIndex + 1) + ']';
              questions = JSON.parse(fixedText);
            } else {
              throw e;
            }
          } catch (fallbackError) {
            throw new Error('AI response boht zyada lamba tha jiski wajah se kat gaya. MCQs ki tadad thori kam kar k try karen.');
          }
        }

        if (!Array.isArray(questions)) {
          if (questions && Array.isArray(questions.questions)) {
            questions = questions.questions;
          } else {
            throw new Error('Invalid AI response format.');
          }
        }

        const cleanQuestions = questions.map(q => ({
          q: q.q || q.question || '',
          opts: q.opts || q.options || [],
          correct: typeof q.correct === 'number' ? q.correct : 0,
          difficulty: q.difficulty || 'Medium',
          explanation: q.explanation || 'No explanation provided.',
        })).filter(q => q.q && q.opts.length === 4);

        allQuestions = [...allQuestions, ...cleanQuestions];
        isFirstChunk = false;
        
        const isDone = (allQuestions.length >= totalTarget);
        chunkCallback(cleanQuestions, isDone, null);

        chunkIndex++;

        if (!isDone) {
          await wait(2000); // 2-second delay between chunks
        }
      }
    }
  } catch (err) {
    chunkCallback([], true, err);
  }
}
