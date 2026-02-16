
import { GoogleGenAI } from "@google/genai";
import { DonationRecord } from "../types";

export const generateDonationInsight = async (donations: DonationRecord[]): Promise<string> => {
  // Always use a named parameter for apiKey and obtain it exclusively from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalVolume = donations.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
  const byGroup = donations.reduce((acc, curr) => {
    acc[curr.userBloodGroup] = (acc[curr.userBloodGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = `
    Total Donations: ${donations.length}
    Total Volume: ${totalVolume}ml
    Donations by Group: ${JSON.stringify(byGroup)}
    Analysis Date: ${new Date().toLocaleDateString()}
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a professional medical data analyst for a blood bank management system. 
      Analyze the following live donation statistics and provide:
      1. A professional summary of current achievements.
      2. Specific actionable insights about blood group availability.
      3. A motivational sentence for the community.
      
      Keep the tone professional and use bullet points where necessary. Output in English.
      
      Data to analyze:
      ${summary}`,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    // Access the .text property directly
    return response.text || "No actionable insights found at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to synchronize with AI nodes. Please verify system connection and try again.";
  }
};
