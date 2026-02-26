import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Combines system instructions + user message and sends it to Gemini.
 * Automatically handles all newer 2025 SDK formats.
 */
export async function chatWithGemini(userMessage, systemInstructions = "") {
  try {
    // Final prompt construction
    const finalPrompt = `
${systemInstructions}

User Message:
${userMessage}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    // Generate response
    const result = await model.generateContent(finalPrompt);

    // Safely return text across ALL Gemini response formats
    const output =
      result?.response?.text?.() ||
      result?.response?.text ||
      result?.text ||
      "⚠️ No response from Gemini";

    return output;

  } catch (err) {
    console.error("GEMINI API ERROR:", err);
    return "⚠️ Gemini API error — check API key, model name, or backend logs.";
  }
}
