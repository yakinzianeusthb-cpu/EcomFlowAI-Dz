import { callGeminiWithRetry, MODEL_NAME } from "./gemini";
import { buildScoutContext, type TelegramTrendPayload } from "../lib/telegramContext";

export interface ScoutedProduct {
  name: string;
  category: string;
  description: string;
  trendingScore: number;
  estimatedPrice: string;
  sourceChannel: string;
  whyTrending: string;
  marketingHook: string;
  imageKeywords: string;
}

export async function scoutTelegramProducts(query: string = "") {
  let trendData: TelegramTrendPayload | null = null;
  try {
    const trendRes = await fetch('/api/telegram-trends');
    if (trendRes.ok) trendData = await trendRes.json();
  } catch (e) {
    console.warn("Could not fetch real trend context, falling back to pure simulation.");
  }
  const scout = buildScoutContext(trendData);

  const systemInstruction = `
    # ROLE
    Tu es un Expert Product Scout spécialisé dans le marché e-commerce algérien.
    TU ANALYSES LES TENDANCES SUR LES CANAUX TELEGRAM ALGERIA.

    # CONTEXTE
    ${scout.context}

    # RÈGLES
    ${scout.rules}

    # MISSION
    Retourne les 6 meilleurs produits pour la niche : "${query || 'Toutes niches'}".
    Sois très précis sur les prix en DZD et les accroches en Darija.
  `;

  return callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query ? `Recherche pour la niche: ${query}` : "Top tendances e-commerce Algérie COD",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          required: ["products"],
          properties: {
            products: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                required: ["name", "category", "description", "trendingScore", "estimatedPrice", "sourceChannel", "whyTrending", "marketingHook", "imageKeywords"],
                properties: {
                  name: { type: "STRING" },
                  category: { type: "STRING" },
                  description: { type: "STRING" },
                  trendingScore: { type: "NUMBER" },
                  estimatedPrice: { type: "STRING" },
                  sourceChannel: { type: "STRING" },
                  whyTrending: { type: "STRING" },
                  marketingHook: { type: "STRING" },
                  imageKeywords: { type: "STRING" }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return (data.products || []) as ScoutedProduct[];
  }).catch(error => {
    console.error("Scouting failed after retries:", error);
    throw error; // Let the caller handle the UI state for persistent failure
  });
}
