import { GoogleGenAI, Type } from "@google/genai";
import { DlpOptions } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeCommand = async (command: string, options: DlpOptions): Promise<string> => {
  try {
    const ai = getClient();
    
    const prompt = `
      You are an expert in the command line tool 'yt-dlp'.
      
      User Configuration:
      - Target URL: ${options.url || "Not provided yet"}
      - Current Command: \`${command}\`
      
      Task:
      1. Explain simply what this command will do in Chinese (Simplified).
      2. If the URL is provided, analyze if there are specific known issues or better flags for this specific website domain (e.g. Bilibili, YouTube, Twitch).
      3. Point out any potential conflicts in the flags.
      
      Format the response using Markdown. Be concise and helpful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful assistant for the yt-dlp CLI tool. Answer in Chinese.",
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    return response.text || "无法生成分析结果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 服务暂时不可用或 API Key 未配置。请检查网络或密钥设置。";
  }
};

export const suggestFlags = async (url: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      User wants to download video from: ${url}
      Suggest the 3 most useful yt-dlp flags for this specific site in a JSON format.
      Only return JSON.
    `;
    
    // We request a structured JSON response for flags
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of tips/flags"
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return "";
    
    const data = JSON.parse(jsonText);
    return data.tips.join("\n");

  } catch (e) {
    return "";
  }
}