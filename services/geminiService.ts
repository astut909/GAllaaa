
import { GoogleGenAI, Type } from "@google/genai";
import { VoiceExtractionResult, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    customerName: {
      type: Type.STRING,
      description: "The name of the customer mentioned in the audio.",
    },
    amount: {
      type: Type.NUMBER,
      description: "The monetary amount mentioned.",
    },
    type: {
      type: Type.STRING,
      description: "The type of transaction: 'credit' if the shopkeeper gave money/goods to the customer, 'debit' if the customer paid money to the shopkeeper.",
    },
    note: {
      type: Type.STRING,
      description: "A short summary or reason for the transaction mentioned in the audio.",
    },
  },
  required: ["customerName", "amount", "type", "note"],
};

export async function extractTransactionFromAudio(base64Audio: string): Promise<VoiceExtractionResult | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm", // Common recording format
              data: base64Audio,
            },
          },
          {
            text: `Extract the transaction details from this audio recording for a business ledger. 
            The language might be English or Hindi/English mixed (Hinglish). 
            
            Context:
            - "Credit" (Gave/Udhaar): Shopkeeper gave goods or money to customer. Customer now owes money.
            - "Debit" (Got/Received): Customer paid back some money to the shopkeeper.
            
            Output strictly valid JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return null;
    
    const parsed = JSON.parse(text);
    return {
      customerName: parsed.customerName,
      amount: parsed.amount,
      type: parsed.type.toLowerCase().includes('credit') ? TransactionType.CREDIT : TransactionType.DEBIT,
      note: parsed.note
    };
  } catch (error) {
    console.error("Gemini processing error:", error);
    return null;
  }
}
