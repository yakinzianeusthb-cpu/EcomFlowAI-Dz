// All Gemini calls are server-proxied (POST /api/ai/generate) so the user's
// API key never reaches the browser bundle. See getAI() below.

import { translate } from '../i18n/runtime';
import { unwrapSingleObject } from '../lib/aiJson';

export const MODEL_NAME = "gemini-3-flash-preview";
// Image generation model — separate model family (Gemini image), intentionally different.
export const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

/**
 * Repairs a truncated JSON string by parsing it and balancing open structures.
 */
function repairTruncatedJSON(s: string): string {
  let text = s.trim();
  if (!text) return "{}";

  let repaired = "";
  let inStr = false;
  let esc = false;
  const stack: ('{' | '[')[] = [];
  const objContextStack: ('KEY' | 'COLON' | 'VALUE' | 'COMMA')[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (esc) {
      repaired += char;
      esc = false;
      continue;
    }

    if (char === '\\') {
      repaired += char;
      esc = true;
      continue;
    }

    if (char === '"') {
      repaired += char;
      inStr = !inStr;
      
      if (!inStr && stack.length > 0 && stack[stack.length - 1] === '{') {
        const currentCtx = objContextStack[objContextStack.length - 1];
        if (currentCtx === 'KEY') {
          objContextStack[objContextStack.length - 1] = 'COLON';
        } else if (currentCtx === 'VALUE') {
          objContextStack[objContextStack.length - 1] = 'COMMA';
        }
      }
      continue;
    }

    if (inStr) {
      if (char === '\n') {
        repaired += '\\n';
      } else if (char === '\r') {
        repaired += '\\r';
      } else if (char === '\t') {
        repaired += '\\t';
      } else {
        const code = char.charCodeAt(0);
        if (code >= 32) {
          repaired += char;
        }
      }
      continue;
    }

    if (char.trim() === '') {
      repaired += char;
      continue;
    }

    repaired += char;

    if (char === '{') {
      stack.push('{');
      objContextStack.push('KEY');
    } else if (char === '[') {
      stack.push('[');
    } else if (char === '}') {
      if (stack.length > 0 && stack[stack.length - 1] === '{') {
        stack.pop();
        objContextStack.pop();
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          objContextStack[objContextStack.length - 1] = 'COMMA';
        }
      }
    } else if (char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === '[') {
        stack.pop();
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          objContextStack[objContextStack.length - 1] = 'COMMA';
        }
      }
    } else if (char === ':') {
      if (stack.length > 0 && stack[stack.length - 1] === '{') {
        objContextStack[objContextStack.length - 1] = 'VALUE';
      }
    } else if (char === ',') {
      if (stack.length > 0 && stack[stack.length - 1] === '{') {
        objContextStack[objContextStack.length - 1] = 'KEY';
      }
    }
  }

  // Handle truncation
  let suffix = "";
  if (inStr) {
    if (esc) {
      repaired = repaired.slice(0, -1);
    }
    suffix += '"';
    if (stack.length > 0 && stack[stack.length - 1] === '{') {
      const currentCtx = objContextStack[objContextStack.length - 1];
      if (currentCtx === 'KEY') {
        objContextStack[objContextStack.length - 1] = 'COLON';
      } else if (currentCtx === 'VALUE') {
        objContextStack[objContextStack.length - 1] = 'COMMA';
      }
    }
  }

  let resultStr = repaired + suffix;

  // Now close remaining open structures
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === '{') {
      const ctx = objContextStack.pop();
      let trimmed = resultStr.trim();
      if (trimmed.endsWith(',')) {
        resultStr = trimmed.slice(0, -1);
      } else if (ctx === 'COLON' || trimmed.endsWith(':')) {
        if (trimmed.endsWith(':')) {
          resultStr = trimmed + ' null';
        } else {
          resultStr = trimmed + ': null';
        }
      }
      resultStr += '}';
    } else if (top === '[') {
      let trimmed = resultStr.trim();
      if (trimmed.endsWith(',')) {
        resultStr = trimmed.slice(0, -1);
      }
      resultStr += ']';
    }
  }

  return resultStr;
}

/**
 * Robustly parses JSON from AI responses, handling markdown blocks and common errors.
 */
export function safeParseJSON(text: string) {
  if (!text) return null;

  // Let's first try to clean up code block wraps if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  }
  cleaned = cleaned.trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Direct parse failed, continue with advanced extraction & repair
  }

  // Find first '{' or '['
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let isObject = true;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isObject = false;
  }

  if (startIdx === -1) {
    // No JSON structure found at all
    return null;
  }

  // Scan forward to find the matching closing brace/bracket
  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIdx = -1;

  for (let i = startIdx; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (isObject) {
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      } else {
        if (char === '[') depth++;
        else if (char === ']') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }
  }

  let extracted = "";

  if (endIdx !== -1) {
    extracted = cleaned.substring(startIdx, endIdx + 1);
  } else {
    // It is truncated (could not find matching closing brace)
    extracted = cleaned.substring(startIdx);
  }

  // Advanced repairs on 'extracted'
  const repairAttempts = [
    // Attempt 1: Raw extract parse
    (s: string) => JSON.parse(s),

    // Attempt 2: State-machine based truncated JSON recovery
    (s: string) => {
      const repaired = repairTruncatedJSON(s);
      return JSON.parse(repaired);
    },

    // Attempt 3: Clean control characters and trailing commas, handle newlines in strings
    (s: string) => {
      let r = s;
      // eslint-disable-next-line no-control-regex
      r = r.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
      r = r.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      });
      r = r.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(repairTruncatedJSON(r));
    },

    // Attempt 4: Truncate back to last complete field comma, then balance
    (s: string) => {
      const lastComma = s.lastIndexOf(',');
      if (lastComma > 0) {
        const sliced = s.substring(0, lastComma);
        return JSON.parse(repairTruncatedJSON(sliced));
      }
      throw new Error("Cannot slice at comma");
    },

    // Attempt 5: Aggressive fix for unbalanced/unescaped quotes inside JSON values
    (s: string) => {
      let r = s;
      r = r.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      });
      r = r.replace(/":\s*"([\s\S]*?)"\s*([,}])/g, (match, p1, p2) => {
        const fixedValue = p1.replace(/(?<!\\)"/g, '\\"');
        return `": "${fixedValue}"${p2}`;
      });
      return JSON.parse(repairTruncatedJSON(r));
    }
  ];

  for (let attempt = 0; attempt < repairAttempts.length; attempt++) {
    try {
      return repairAttempts[attempt](extracted);
    } catch (e) {
      // Continue to next attempt
    }
  }

  // If all failed, log and attempt emergency extraction or fallback
  console.error("All JSON repair attempts failed. Extraction was:", extracted.substring(0, 500));
  return null;
}

async function proxyGenerate(params: {
  model: string;
  contents: unknown;
  config?: Record<string, unknown>;
}): Promise<{ text?: string; candidates?: any[]; usageMetadata?: any }> {
  let res: Response;
  try {
    res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error(translate('shAiServerUnreachable', 'Impossible de joindre le serveur IA. Réessaie.'));
  }
  if (!res.ok) {
    let message = translate('shAiError', 'Erreur IA. Réessaie.');
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch { /* keep default message */ }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Server-proxied stand-in for the Gemini SDK chat object. */
function createProxyChat(
  model: string,
  history: any[] = [],
  config?: Record<string, unknown>,
) {
  let running = [...(history || [])];
  return {
    async sendMessage({ message }: { message: any }) {
      const parts = Array.isArray(message) ? message : [{ text: message }];
      running = [...running, { role: "user", parts }];
      const res = await proxyGenerate({ model, contents: running, config });
      const text = res.text || "";
      running = [...running, { role: "model", parts: [{ text }] }];
      return res;
    },
  };
}

/** Client-side stand-in for the Gemini SDK (server-proxied). */
export function getAI() {
  return {
    models: {
      generateContent: (params: any) => proxyGenerate(params),
    },
    chats: {
      create: (opts: any) => createProxyChat(opts.model, opts.history, opts.config),
    },
  };
}

/**
 * Calls Gemini through the server proxy, retrying only on server-side quota
 * (429). Every other failure — including a missing API key (400) — is thrown
 * immediately so the real reason reaches the user instead of a long silent
 * backoff.
 */
export async function callGeminiWithRetry(
  callFn: (ai: ReturnType<typeof getAI>) => Promise<any>,
  maxRetries = 2,
  initialDelay = 3000,
) {
  let lastError: any = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const ai = getAI();
      return await callFn(ai);
    } catch (error: any) {
      lastError = error;
      if (error?.status === 429 && i < maxRetries - 1) {
        const delay = initialDelay + Math.random() * 2000;
        console.warn(`Gemini quota (429). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function generateVideoAdScript(analysisContext: string, visualStyle: string = "Dynamique", aspectRatio: string = "9:16") {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Expert Director Marketing & Concepteur-Rédacteur spécialisé dans la production publicitaire (UGC et Studio) pour le marché E-commerce algérien (COD).

      # MISSION
      Rédige un "Brief Production Vidéo" haute conversion basé sur l'analyse de produit fournie. Le script doit être optimisé pour capter l'attention en moins de 3 secondes.

      # CONTEXTE DU PRODUIT
      ${analysisContext}

      # DIRECTION ARTISTIQUE
      STYLE : ${visualStyle}
      FORMAT : ${aspectRatio}
      - Si "User-Generated Content (UGC)" : Esthétique authentique, cadrage smartphone vertical (si 9:16), interaction réelle, son ambiant naturel (ASMR de déballage).
      - Si "Studio" : Eclairage professionnel, plans lents (cinematic), focus sur les finitions premium.

      # CONTRAINTES DE RÉDACTION (DZ)
      - Langue : Arabe mélangé à de la Darija Algérienne percutante.
      - Rassurance : Inclure impérativement "الدفع عند الاستلام" (COD) et "توصيل 58 ولاية".

      # STRUCTURE DU SCRIPT (JSON UNIQUEMENT)
      Génère un objet JSON suivant strictement ce format :
      {
        "title": "Brief Production Vidéo - [Nom du Produit]",
        "visualStyle": "${visualStyle}",
        "aspectRatio": "${aspectRatio}",
        "productName": "Nom commercial en Arabe",
        "funnelStructure": "AIDA ou PAS (expliquer brièvement les phases)",
        "marketingStrategy": {
          "targetAudience": "Audience cible détaillée en Algérie (ex: Mamans débordées, actifs urbains...)",
          "coreHook": "Le hook principal percutant de la vidéo de 3 secondes",
          "voiceoverTone": "Ton de la voix-off (Ex: Chaleureux & Amical, Captivant, Dynamique, etc.)"
        },
        "scenes": [
          {
            "time": "0-3s",
            "step": "Le Hook (Attention)",
            "visual": "Détails visuels détaillés (cadrage précis, action de l'acteur, éclairage pour ${aspectRatio})",
            "audio": "Transcription de la voix-off en Arabe officiel ou en lettres arabes Darija",
            "audioFranco": "Transcription phonétique Darija de la voix-off (Ex: Chofi khti, had el-produit...)",
            "overlay": "Texte court en grand et gras à l'écran (Ex: التوصيل مجاني 🎁)",
            "sfxMusic": "Effets sonores (SFX) et niveau/style de musique (Ex: Son de sonnerie, musique énergique...)",
            "actorDirection": "Indications de jeu de rôle pour l'acteur/créateur (Ex: Fait mine de s'énerver, puis sourit...)",
            "marketingAngle": "Raison psychologique / Levier utilisé pour cette scène"
          }
        ],
        "isUgcEmphasis": true,
        "ctaSection": {
          "ctaText": "Texte de l'appel à l'action final (Ex: اطلب الآن بالنقر على الزر...)",
          "priceOnScreen": "Prix commercial affiché",
          "trustTriggers": ["الدفع عند الاستلام", "توصيل 58 ولاية", "ضمان جودة"]
        },
        "generalNotes": "Conseils globaux de casting, de voix-off et de style musical pour le format ${aspectRatio}",
        "productionTips": [
          "Conseil de tournage 1",
          "Conseil de tournage 2",
          "Conseil de montage 3"
        ]
      }

      IMPORTANT : Génère au moins 5 scènes complètes. Ne réponds QUE le JSON valide. Échappe rigoureusement les guillemets internes dans le texte.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function analyzeProductFromImage(image: { data: string, mimeType: string }) {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Expert Product Scout & Marketing Analyst pour le marché e-commerce algérien. 

      # MISSION
      Analyse cette image de produit et extrais les données stratégiques pour un vendeur en mode Cash on Delivery (COD).

      # DIRECTIVES DE RÉPONSE (JSON)
      Retourne UNIQUEMENT un objet JSON avec cette structure :
      {
        "name": "Nom commercial percutant en Français",
        "nameAr": "Nom commercial percutant en Arabe Algérien (Darija)",
        "brand": "Marque identifiée ou 'Marque Blanche'",
        "category": "vêtement | accessoire | gadget technologique | article ménager",
        "type": "Type de produit précis",
        "targetAudience": "Cible démographique précise en Algérie (Âge, Ville, Intérêt)",
        "colorPalette": ["HEX Dominant", "HEX Secondaire", "HEX Accents"],
        "sellingPoints": ["Point fort 1 (Bénéfice)", "Point fort 2 (Qualité)", "Point fort 3 (Usage)", "Point fort 4", "Point fort 5"],
        "briefDescription": "Pitch marketing rapide de 2 phrases en Arabe/Darija",
        "marketingAngle": "Luxe Accessible | Urgence maximale | Solution miracle | Confiance & Famille | Style & Tendance | Économie / Offre Or",
        "funnelStrategy": "AIDA | PAS | FAB",
        "tone": "Vendeur / Persuasif | Professionnel / Corporate | Amical / Storytelling | Minimaliste / Direct",
        "designStyle": "Moderne / Minimaliste | Brutalist / High-tech | Élégant / Classique | Coloré / Dynamique",
        "pageType": "Landing Page Classique | Page de Vente Directe | Opt-in / Pre-sell"
      }

      # CRITÈRES DE QUALITÉ
      - Persuasion : Formule les points de vente pour qu'ils soient irrésistibles.
      - Fidélité visuelle : Base ton analyse sur les couleurs et textures réelles de l'image.
      - Echappe impérativement les guillemets et caractères spéciaux.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        { inlineData: image }
      ],
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function generateLandingPageCopy(
  productData: {
    name: string;
    description: string;
    marketingAngle?: string;
    nicheAngle?: string;
    brand?: string;
    category?: string;
    productType?: string;
    targetAudience?: string;
    colorPalette?: string[];
    sellingPoints?: string[];
    funnelStrategy?: string;
    numSections?: number;
    tone?: string;
    designStyle?: string;
    visualStyle?: string;
    pageType?: string;
    targetMarket?: string;
    language?: string;
  }, 
  imageInput?: { data: string, mimeType: string }[] | { data: string, mimeType: string },
  aspectRatio: string = "16:9"
) {
  return callGeminiWithRetry(async (ai) => {
    const imagesList = imageInput ? (Array.isArray(imageInput) ? imageInput : [imageInput]) : [];
    const imageParts = imagesList.map(img => ({ inlineData: img }));
    const visualStylePrompt = productData.visualStyle 
      ? `Tout au long de la page, les prompts d'images doivent impérativement suivre le STYLE VISUEL : "${productData.visualStyle}".`
      : "";

    const strategyPrompt = productData.funnelStrategy === 'PAS' 
      ? "Utilise le framework PAS (Problem, Agitation, Solution). Concentre-toi sur la douleur du client algérien et comment ce produit est la SEULE issue."
      : productData.funnelStrategy === 'FAB'
      ? "Utilise le framework FAB (Features, Advantages, Benefits). Transforme chaque caractéristique technique en un avantage de vie concret."
      : "Utilise le framework AIDA (Attention, Interest, Desire, Action). Capte l'attention immédiatement et crée un désir irrésistible.";

    const anglePrompt = productData.marketingAngle?.toLowerCase().includes('luxe')
      ? "Adopte un ton extrêmement prestigieux, exclusif et raffiné. Utilise un vocabulaire sophistiqué en Arabe. Met l'accent sur la rareté et la supériorité du produit."
      : productData.marketingAngle?.toLowerCase().includes('urgence')
      ? "Crée une tension maximale. Utilise des mots d'action immédiate. Le stock est quasi épuisé, l'offre se termine ce soir. Ton percutant et rapide."
      : productData.marketingAngle?.toLowerCase().includes('solution')
      ? "Accroche-toi à la douleur ou au problème frustrant. Présente le produit comme le sauveur indispensable. Ton empathique puis triomphant."
      : productData.marketingAngle?.toLowerCase().includes('confiance')
      ? "Ton rassurant, familial et chaleureux. Met l'accent sur la sécurité, le test avant paiement et la satisfaction garantie. Rassurance 100%."
      : productData.marketingAngle?.toLowerCase().includes('tendance')
      ? "Ton jeune, dynamique et branché. Parle de style, de buzz et d'être le premier à l'avoir. Utilise des expressions Darija modernes."
      : productData.marketingAngle?.toLowerCase().includes('promo')
      ? "Met l'accent sur l'économie imbattable. C'est l'offre de l'année. Utilise 'Meilleur prix en Algérie' comme mantra."
      : productData.marketingAngle ? `Adopte l'angle marketing suivant : ${productData.marketingAngle}.` : "Adopte un ton persuasif et vendeur.";

    const prompt = `
      En tant que copywriter expert en conversion e-commerce (spécialisé Algérie), utilise les DÉTAILS DE PRODUIT suivants pour rédiger la structure d'une Landing Page haute conversion adaptée au marché (Cash On Delivery).
      
      DÉTAILS DU PRODUIT :
      - Nom original : ${productData.name}
      - Marque : ${productData.brand || 'N/A'}
      - Catégorie : ${productData.category || 'N/A'}
      - Type : ${productData.productType || 'N/A'}
      - Public Cible : ${productData.targetAudience || 'N/A'}
      - Palette de Couleurs suggérée : ${productData.colorPalette?.join(', ') || 'N/A'}
      - Points de Vente : ${productData.sellingPoints?.join(', ') || 'N/A'}
      - Angle Marketing Souhaité : ${productData.marketingAngle || 'Défini par l\'IA'}
      - Niche de l'Angle Marketing (Véhicule/Contexte) : ${productData.nicheAngle || 'Défini par l\'IA'}
      - Description/Contexte : ${productData.description}
      - Stratégie de Funnel : ${productData.funnelStrategy || 'AIDA'}
      
      PARAMÈTRES AVANCÉS :
      - Nombre de sections : ${productData.numSections || 6}
      - Ton / Style de voix : ${productData.tone || 'Vendeur / Persuasif'}
      - Style de design souhaité : ${productData.designStyle || 'Moderne / Minimaliste'}
      - Type de page : ${productData.pageType || 'Landing Page Classique'}
      - Marché cible : ${productData.targetMarket || 'Algérie (58 wilayas)'}
      - Langue du contenu : ${productData.language || 'Arabe / Darija Algérienne'}
      
      ${strategyPrompt}
      ${visualStylePrompt}
      
      ${anglePrompt}
      ${productData.tone ? `Note sur le ton : ${productData.tone}` : ""}
      ${productData.designStyle ? `Note sur le style de design : ${productData.designStyle}` : ""}
      ${productData.visualStyle ? `Note sur le style visuel des images : ${productData.visualStyle}` : ""}
      ${productData.language ? `Note sur la langue : ${productData.language}. Respecte strictement cette langue pour tout le contenu marketing.` : ""}
      
      ${imageParts.length > 0 ? "LES IMAGES FOURNIES sont des références visuelles directes du produit à utiliser pour inférer le style, les couleurs et les détails de conception (matières, finitions)." : ""}
      
      CONVICTIONS MARCHÉ & COHÉRENCE :
      1. TRADUCTION DU NOM : Identifie le nom du produit et traduis-le en un nom commercial dans la langue cible (${productData.language || 'Arabe'}) percutant. Utilise EXCLUSIVEMENT ce nom dans tout le contenu.
      2. COHÉRENCE VISUELLE & TEXTUELLE : Toutes les sections doivent suivre une ligne directrice unique basée sur l'Angle Marketing "${productData.marketingAngle || 'Déterminé par l\'IA'}" ${productData.nicheAngle ? `et l'angle/niche thématique spécifique "${productData.nicheAngle}" (ex: voitures السيارات, bus الحافلات ou avions الطائرات). S'il y a un transport/niche sélectionné, le vocabulaire marketing, les analogies en Darija, et les environnements d'arrière-plan des prompts d'images doivent être fortement orientés ou faire allusion à ce thème de transport (par exemple, situer l'utilisation du produit ou son confort à l'intérieur d'une voiture, d'un avion, ou faire des métaphores de voyage)` : ''} et le Style de Design "${productData.designStyle || 'Moderne'}". La palette de couleurs [${productData.colorPalette?.join(', ') || 'N/A'}] doit être respectée dans chaque prompt d'image et chaque élément de design suggéré.
      3. NARRATIF FLUIDE : La structure de la page doit raconter une histoire cohérente adaptée au Type de Page "${productData.pageType || 'Landing Page'}".
      4. Confiance et Bénéfices en priorité : Ne te contente pas de lister des caractéristiques. Chaque phrase doit vendre un RÉSULTAT ou une ÉMOTION.
      5. RÉASSURANCE RADICALE : Utilise systématiquement des hooks sur la livraison et la satisfaction client adaptés au marché "${productData.targetMarket || 'Algérie'}".
      6. OPTIMISATION SEO : Intègre naturellement des mots-clés stratégiques pour le marché cible.
      7. LANGUE OBLIGATOIRE : Tous les textes (Headline, Content, CTA, Badges, Overlays) DOIVENT être rédigés en ${productData.language || 'ARABE (العربية) mélangé avec de la DARIJA ALGÉRIENNE'}.
      
      STRUCTURE DU WORKFLOW (${productData.numSections || 6} sections) :
      Génère exactement ${productData.numSections || 6} sections structurées qui couvrent le funnel de conversion de manière logique pour une ${productData.pageType || 'Landing Page'}. 
      Inclus obligatoirement :
      1. Hero Section (Impression immédiate).
      2. Problème / Solution.
      3. Caractéristiques vs Bénéfices.
      4. COMPARAISON / TABLEAU COMPARATIF : Montre pourquoi ce produit est supérieur à la concurrence.
      5. Preuve Sociale / Témoignages.
      6. GARANTIE / RÉASSURANCE : Une section dédiée à la garantie DZ (Test à la livraison, Retour facile).
      7. FAQ Stratégique.
      8. Footer High-Trust.
      (Si ${productData.numSections || 6} est inférieur à 8, privilégie les 4 premières + FAQ + Footer. Si plus, ajoute des sections d'autorité ou de processus).
      
      STRUCTURE SPÉCIFIQUE DES NOUVELLES SECTIONS :
      - Pour la section COMPARAISON : Inclus un champ "comparisonTable" (array d'objets { "feature": string, "product": string, "competitor": string }).
      - Pour la section GARANTIE : Inclus un champ "guaranteeDetails" (object { "title": string, "description": string, "icon": string }).
      
      L'OBJET "generalNotes" doit résumer la stratégie de COHÉRENCE adoptée : Pourquoi ce ton (${productData.tone}) ? Pourquoi ces couleurs ? Comment l'Angle Marketing lie toutes les sections ?
      
      CRITÈRE CTA (IMPÉRATIVE) : Chaque section doit proposer exactement 3 variations de texte pour le bouton CTA dans la langue demandée, adaptées au contexte de la section.
      
      LE "subtext" DU CTA DOIT ÊTRE RASSURANT (Livraison, Stock, Qualité).
      
      CRITICAL POUR LE "prompt" (STRUCTURE OBLIGATOIRE) : Pour chaque section, le champ "prompt" doit être une chaîne de caractères formatée EXACTEMENT selon ce template (Markdown) :

      📸 SECTION [X]/[TOTAL] — [Rôle Narratif] — [Titre]

      🎯 OBJECTIF : [Objectif stratégique de la section].
      - **Type:** [Rôle] | **Layout:** [Composition adaptée au ratio ${aspectRatio}] | **Dimensions:** [Recommandées pour ${aspectRatio}]
      - **Ratio d'aspect:** --ar ${aspectRatio}

      **Prompt (Image Generator) :**
      \`\`\`
      Based on this product image and the style "${productData.visualStyle || 'lifestyle'}" (under "${productData.designStyle || 'Modern'}" design language), create a professional marketing visual. 
      Composition optimized for ${aspectRatio === '16:9' ? 'wide landscape desktop view' : aspectRatio === '9:16' ? 'vertical cinematic mobile story' : aspectRatio === '4:5' ? 'portrait social media feed' : 'perfectly centered professional square balance'}.
      Requirements: [Description détaillée en ANGLAIS incluant Sujet, Environnement, Lumière, Caméra, et spécificités visuelles du produit]. 
      FOR HERO SECTION: Emphasize extra-bold typography and maximal color contrast for text overlays.
      \`\`\`

      📐 Rappel composition LP : Adapte le conseil au format ${aspectRatio}.
         Ex : "Keep the bottom 20% clear for the CTA button."
      📦 PRODUIT OBLIGATOIRE — MODE IMAGE_TO_IMAGE : Reproduis le produit EXACT de l'image.
         Ex : "Use the white/orange 3-in-1 spray brush."
      ⚡ TEXTE INTÉGRÉ (adapté au produit) :
         Headline : "[Titre percutant adapté au produit]" — Ex : "راحة حيوانك تبدأ هنا!"
         → Police [style], taille XL, contraste High
         → Position : Upper third
         → Style : Shadow drop
         Sous-texte : "[Accroche]" — Ex : "مساج، تنظيف، ولمعان في أداة واحدة"
         CTA visible : "[CTA]" — Ex : "اطلب الآن"
      🚫 Negative : [Éléments à éviter] — Ex : messy room, sad pets, low light.
      **Params:** [Style] — Ex : 8k, realistic | --ar ${aspectRatio}

      **CTA bouton :** "[Texte CTA]"
      **Contenu marketing :** [Argumentaire complet axé sur les BÉNÉFICES]
      **Notes conversion :** [Rationale marketing]

      IMPORTANT : Le texte marketing doit être optimisé pour le marché "${productData.targetMarket || 'Algérie'}".

      FORMAT JSON ATTENDU :
      {
        "title": "Structure Landing Page Stratégique",
        "productName": "Nom commercial",
        "generalNotes": "Commentaire stratégique",
        "colorPalette": ["HEX1", "HEX2", "HEX3"],
        "sections": [
          {
            "step": "Étape (ex: 01 — HERO)",
            "narrativeRole": "🎯 HOOK | ⚡ CONVERSION",
            "marketingAngle": "Angle d'attaque marketing",
            "benefits": ["Bénéfice 1", "Bénéfice 2", "Bénéfice 3"],
            "composition": "Image full-width | Video Background | Split",
            "title": "Titre marketing",
            "content": "Argumentaire complet",
            "testimonials": [
              { "name": "Nom du client (Ville)", "text": "Commentaire", "rating": 5 }
            ],
            "cta": {
              "variations": [
                { "text": "Variation Urgence", "type": "urgency" },
                { "text": "Variation Bénéfice", "type": "benefit" },
                { "text": "Variation Directe", "type": "direct" }
              ],
              "subtext": "Texte de réassurance"
            },
            "imagePrompt": {
              "subject": "Subject & Product details",
              "environment": "Environment and Mood",
              "lighting": "Lighting setup and Camera",
              "textInstructions": "Instructions for text overlays",
              "composition": "Composition layout",
              "technical": "High-res technical specs and Aspect Ratio --ar ${aspectRatio}"
            },
            "prompt": "Full combined prompt string in English",
            "negativePrompt": "Low quality, blurry, incorrect script...",
            "badges": ["CONVERSION", "URGENCY", "TRUST"],
            "textOverlay": {
               "headline": "Headline principal",
               "subtext": "Sous-texte",
               "position": "center | bottom | top",
               "style": "bold-white-shadow"
            }
          }
        ]
      }
      
      Génère exactement ${productData.numSections || 6} sections. Ne réponds QUE le JSON. 
      IMPORTANT: Le formatage JSON doit être parfait. Echappe toute guillemet double (") présente à l'intérieur des textes ou des prompts par un backslash (\").
    `;
    
    const contents: any = imageParts.length > 0 
      ? [ { text: prompt }, ...imageParts ]
      : prompt;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function generateDarjaAds(analysisContext: string, platform: 'facebook' | 'tiktok', tone: string = 'Persuasif/Vendeur', keywords: string = '', aspectRatio: string = "4:5") {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Expert Media Buyer & Creative Strategist spécialisé dans les publicités e-commerce (Facebook/TikTok/Instagram) pour le marché algérien.

      # MISSION
      Crée un brief complet pour 6 variantes de Static Ads hautement performantes.

      # CONTEXTE PRODUIT
      <context>
      ${analysisContext}
      </context>
      
      # PARAMÈTRES
      - Plateforme : ${platform}
      - Ton : ${tone}
      - Mots-clés : ${keywords}
      - Aspect Ratio : ${aspectRatio}

      # DIRECTIVES CRÉATIVES
      - Prompt Image : Pour chaque variante, rédige un prompt en ANGLAIS ultra-détaillé (80-100 mots) incluant sujet, environnement, lumière (cinématique/studio), caméra, et palette de couleurs.
      - Ratio : Utilise impérativement --ar ${aspectRatio}.
      - Copywriting : Texte d'accroche (Headline) en DARIJA percutante.

      # STRUCTURE DU JSON ATTENDU
      {
        "title": "Brief Static Ads",
        "platform": "${platform}",
        "productName": "Nom Arabe",
        "visuals": [
          {
            "step": "AD [X]/6",
            "narrativeRole": "Ex: 🎯 SCROLL STOPPER",
            "marketingAngle": "Levier utilisé",
            "prompt": "Detailed English image prompt --ar ${aspectRatio}",
            "textOverlay": {
              "headline": "Accroche Darija",
              "subtext": "Sous-titre Darija"
            },
            "marketingContext": {
               "usp": "Unique Selling Point",
               "painPoint": "Douleur client adressée"
            }
          }
        ]
      }

      IMPORTANT : Génère 6 variantes. Ne réponds que le JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function generateProductPageOptimizations(analysisContext: string) {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Expert en Optimisation du Taux de Conversion (CRO) spécialisé dans les boutiques Shopify/YouCan/Storeino pour le marché algérien.

      # MISSION
      Analyse le produit et propose 5 optimisations concrètes pour la page produit afin de maximiser les ventes en Cash on Delivery.

      # CONTEXTE PRODUIT
      ${analysisContext}

      # STRUCTURE DU JSON
      {
        "optimizations": [
          {
            "title": "Titre Court",
            "description": "Explication détaillée de l'optimisation",
            "impact": "High | Medium | Low",
            "effort": "Easy | Medium | Hard"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json"
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

/**
 * An AI image for one landing-page section, made from the product photo so the product stays the same.
 * Needs a Gemini key with billing; any failure is thrown (no stand-in picture), so the page never shows a fake image.
 */
export async function generateSectionImage(prompt: string, productPhoto?: string | null): Promise<string> {
  const reference = productPhoto?.startsWith('data:image/')
    ? { data: productPhoto.split(',')[1], mimeType: productPhoto.slice(5, productPhoto.indexOf(';')) }
    : null;
  const response = await getAI().models.generateContent({
    model: IMAGE_MODEL_NAME,
    contents: reference ? [{ inlineData: reference }, { text: prompt }] : prompt,
  });
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.data) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error(translate('shNoImageGenerated', 'Aucune image générée.'));
}

// A failure reaches the caller as it is: no stand-in stock photo, which shown as "generated" would mislead the seller.
export async function generateProductImage(productName: string, style: string = "lifestyle, clean lighting, professional photography", aspectRatio: string = "1:1") {
  return callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: `Generate a professional product photo for: ${productName}. 
        Style: ${style}. 
        Mandatory Aspect Ratio: --ar ${aspectRatio}. 
        The composition must be optimized for a ${aspectRatio} format.`,
      config: { maxOutputTokens: 2048 }
    });
      
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error(translate('shNoImageGenerated', 'Aucune image générée.'));
  });
}

export function createExpertChat(history: any[] = []) {
  const ai = getAI();
  return ai.chats.create({
    model: MODEL_NAME,
    history: history,
    config: {
      systemInstruction: `Tu es un consultant expert en e-commerce spécialisé dans le marché algérien du Cash on Delivery (COD). Ton rôle est d'accompagner les entrepreneurs avec un ton professionnel, pragmatique et rassurant.

      QUAND TU ANALYSES UN PRODUIT (SURTOUT VIA IMAGE), tu dois OBLIGATOIREMENT suivre cette structure de réponse précise :

      ### 📦 Identification du Produit
      - **Nom du Produit :** [Nom précis et accrocheur]
      - **Marque :** [Marque identifiée ou type de branding suggéré]
      - **Catégorie :** Tu DOIS classer le produit dans l'une de ces 4 catégories : [vêtement | accessoire | gadget technologique | article ménager].
      - **Type de Produit :** [Détail précis du set ou de l'unité]

      ### 🎨 Adaptation par Catégorie (CRUCIAL)
      Tes prompts visuels DOIVENT refléter la catégorie détectée :
      - **Vêtement :** Intègre des textures de tissu, du mouvement (fitting), des environnements urbains ou luxueux, et des visages exprimant la confiance.
      - **Gadget Tech :** Focus sur l'éclairage cinématique, les reflets High-Tech, les détails macro des composants et une ambiance futuriste/propre.
      - **Maison :** Environnements chaleureux, lumière naturelle matinale, profondeur de champ (bokeh) et focus sur le confort familial.
      - **Accessoire :** Focus sur les matériaux (cuir, métal), éclairage de précision type joaillerie, et mise en scène "Daily Carry".

      ### 📝 Structure du Prompt Visuel (ANGLAIS)
      Chaque prompt doit être une description technique complète :
      \`[Subject] in [Setting], [Action/Pose], [Lighting Style], [Camera Settings: ex: 85mm f/1.8], [Vibe/Aesthetic], [Color Palette details] --ar 4:5\`

      ### 💎 Argumentaire & Cible
      - **Points de Vente :** 
        - [Argument marketing n°1 : pourquoi ça va se vendre en Algérie]
        - [Argument n°2 : détail technique ou esthétique premium]
        - [Argument n°3 : bénéfice utilisateur concret]
        - [Argument n°4 : durabilité ou qualité]
        - [Argument n°5 : exclusivité ou style]
      - **Public Cible :** [Description précise : âge, intérêts, profil type en Algérie (ex: Hommes 18-35 ans, fans de streetwear)]

      ### 🎨 Identité Visuelle & Couleurs
      - **Palette de Couleurs :**
        - **Dominante :** [Nom de la couleur] ([Code HEX])
        - **Accentuation :** [Nom de la couleur] ([Code HEX])
        - [Eventuelles autres couleurs]

      ### ⚙️ Spécifications Techniques
      - **Composition :** [Matières perçues ou suggérées]
      - **Texture :** [Aspect visuel et tactile : ex: Molleton, Jersey, Plastique mat]
      - **Design :** [Détails de coupe, finitions, logos]
      - **Entretien :** [Conseils pratiques pour le marché local]

      ### 🌍 Localisation
      - **Langue du texte suggérée :** 🇩🇿 العربية (Arabe) / Français

      ### 📸 Styles Visuels (Recommandations pour Ads)
      1. **[Style 1]** : [Description de l'ambiance] | *Tags: [X, Y, Z]*
      2. **[Style 2]** : [Description de l'ambiance] | *Tags: [X, Y, Z]*
      3. **[Style 3]** : [Description de l'ambiance] | *Tags: [X, Y, Z]*

      ### 📐 Dispositions de Texte (Marketing Layouts)
      1. **[Layout 1]** : [Description de la mise en page] | *Impact: [Effet psychologique]*
      2. **[Layout 2]** : [Description de la mise en page] | *Impact: [Effet psychologique]*
      3. **[Layout 3]** : [Description de la mise en page] | *Impact: [Effet psychologique]*

      ### 🚀 Plan d'Action Marketing (Stratégie Algérie)
      - **Positionnement :** [Comment se différencier sur le marché local]
      - **Offre de Lancement (IRR) :** [Exemple d'offre irrésistible en Algérie]
      - **Canaux Prioritaires :** [Où investir son budget pub ?]

      ### 📱 Idées de Contenu (Réseaux Sociaux)
      - **Posts Organiques :** [3 idées de posts engageants]
      - **Types de Visuels :** [Quelles photos/vidéos prendre pour réussir ?]
      - **Sujets de Reels/TikTok :** [Concepts de vidéos courtes pour ce produit]

      ### ⚡ Optimisation Page Produit (Conversion)
      - **Copywriting :** [Quel angle choisir pour la description ?]
      - **Preuve Sociale :** [Quels types de témoignages boosteront la confiance ?]
      - **Garanties :** [Quelles assurances rassureront l'acheteur COD ?]

      ### 🛠️ MODULES D'ACTION DZADS (SOLUTIONS DE PRODUCTION)
      Tu dois conclure tes analyses stratégiques en invitant formellement l'utilisateur à activer l'un de nos modules d'exécution suivants :
      - 📝 **Architecture de Landing Page** : Pour transformer l'analyse en structure de vente concrète.
      - 💰 **Ingénierie de Prix** : Pour valider la viabilité financière de l'offre (Calculateur de marge).
      - 🎨 **Creative Brief (Prompts Ads)** : Pour préparer les visuels publicitaires originaux.
      - 🎬 **Production Brief (Script Vidéo)** : Pour lancer la création de vidéos UGC ou Studio.

      REMARQUE : Tes réponses doivent être professionnelles, adaptées aux réalités algériennes (livraison 58 wilayas, COD) et DIRECTES. 
      
      # STRUCTURE DE RÉPONSE OBLIGATOIRE
      Pour une lisibilité maximale, tu DOIS :
      1. Utiliser des titres (###) pour chaque section.
      2. Utiliser du gras (**texte**) pour mettre en évidence les termes clés et les points importants.
      3. Utiliser des listes à puces pour les énumérations.
      4. Utiliser des tableaux (Markdown) pour les comparaisons de prix ou de specs si nécessaire.
      5. Utiliser des blockquotes (> ) pour les conseils d'expert ou les notes importantes.
      6. Ajouter des emojis pertinents pour aérer le texte.
      
      Assure-toi que chaque réponse est un chef-d'œuvre de structure et de clarté.`,
    },
  });
}

export async function analyzeMarket(productNameOrDescription: string) {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Expert E-commerce Market Analyst spécialisé dans le marché Algérien (COD/58 Wilayas).

      # MISSION
      Effectue une analyse de marché approfondie pour le produit : "${productNameOrDescription}".

      # STRUCTURE DE L'ANALYSE (MARKDOWN)
      
      ### 🏷️ Classification
      Est-ce un : vêtement | accessoire | gadget technologique | article ménager ?
      
      ### 📊 Concurrence Locale
      - Niveau de saturation.
      - Canaux principaux (FB Ads, TikTok, Boutiques).
      
      ### 💰 Tendances de Prix (DZD)
      - Fourchettes (Bas, Moyen, Haut).
      - Barrière psychologique locale.
      
      ### 🚀 Stratégies de Vente
      - Offre de lancement.
      - Bundling (Packs) recommandé.
      
      ### ⚠️ Risques Logistiques
      - Taux de retour par catégorie.
      - Wilayas à privilégier.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { maxOutputTokens: 8192 }
    });
    
    return response.text || "Désolé, je n'ai pas pu générer l'analyse de marché.";
  });
}

export async function compareWithCompetitor(productInfo: string, competitorInfo: string) {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Consultant en Stratégie Competitive spécialisé dans le E-commerce Algérien.

      # MISSION
      Compare mon produit avec celui du concurrent pour identifier l'angle d'attaque gagnant.

      # INPUTS
      MON PRODUIT : ${productInfo}
      CONCURRENT : ${competitorInfo}

      # STRUCTURE DE L'ANALYSE (MARKDOWN)
      ### 📊 Comparaison Directe
      Tableau comparatif (Prix, Qualité, Marketing, Logistique).

      ### 💪 Nos Avantages Concurrentiels
      Pourquoi l'acheteur COD algérien nous choisira ?

      ### 🚀 Stratégie "Gagnante"
      - **L'Offre Irrésistible (IRR) :** Une proposition "imbattable" (ex: 2+1, cadeau).
      - **L'Angle d'Attaque :** Le message fort pour se différencier.
      - **Urgence :** Tactique de rareté.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { maxOutputTokens: 8192 }
    });
    
    return response.text || "Désolé, je n'ai pas pu générer la comparaison.";
  });
}

export async function generatePricingStrategy(productName: string, productCost: string = "Non spécifié") {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Expert Strategic Pricing spécialisé dans le E-commerce COD en Algérie.

      # MISSION
      Définis une stratégie de prix optimale pour le produit : "${productName}".
      Coût estimé : ${productCost} DZD.

      # RÈGLES MARCHÉ ALGÉRIEN
      - Prix psychologiques : Finissant souvent par 900, 500 ou 000.
      - Frais de livraison : Souvent séparés ou inclus selon la stratégie.
      - Packs : Le "Pack Famille" ou "Achetez 2, le 3ème à -50%" fonctionne très bien.

      # STRUCTURE DU JSON ATTENDU
      {
        "title": "Stratégie de Tarification Stratégique",
        "productName": "${productName}",
        "pricingTiers": [
          {
            "label": "Prix Unitaire",
            "amount": "Montant DZD",
            "psychology": "Explication du choix du prix",
            "profitMargin": "Marge brute estimée"
          }
        ],
        "bundlingStrategies": [
          {
            "offerName": "Ex: Offre Flash Duo",
            "composition": "2 unités",
            "price": "Prix DZD",
            "savings": "Économie client"
          }
        ],
        "upsellingTactics": [
          {
            "product": "Accessoire lié",
            "price": "Prix DZD",
            "pitch": "Argumentaire rapide"
          }
        ],
        "conversionTactics": [
          { "lever": "Rassurance", "description": "Ex: Garantie de test avant paiement" }
        ],
        "generalNotes": "Analyse de rentabilité"
      }

      IMPORTANT : Ne réponds que le JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function analyzeProductImage(base64Image: string, mimeType: string) {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      En tant qu'expert en branding et marketing e-commerce, analyse cette image de produit en suivant STRICTEMENT cette structure de réponse. 
      Adapte l'analyse spécifiquement pour le marché algérien (COD/Streetwear/Luxe/Utilité).

      ### 📦 Identification du Produit
      - **Nom du Produit :** [Nom précis et accrocheur]
      - **Marque :** [Marque identifiée ou type de branding suggéré]
      - **Catégorie :** Tu DOIS classer le produit dans l'une de ces 4 catégories : [vêtement | accessoire | gadget technologique | article ménager].
      - **Type de Produit :** [Détail précis du set ou de l'unité]

      ### 🎨 Influence de la Catégorie
      Explique brièvement comment la catégorie détectée (vêtement, accessoire, gadget tech, ou article ménager) influence ton choix de styles visuels et de layouts marketing.

      ### 💎 Argumentaire & Cible
      - **Points de Vente :** 
        - [Argument marketing n°1]
        - [Argument marketing n°2]
        - [Argument marketing n°3]
        - [Argument marketing n°4]
        - [Argument marketing n°5]
      - **Public Cible :** [Description précise démographique et intérêts en Algérie]

      ### 🎨 Identité Visuelle & Couleurs
      - **Palette de Couleurs :**
        - **Dominante :** [Nom de la couleur] ([Code HEX])
        - **Accentuation :** [Nom de la couleur] ([Code HEX])

      ### ⚙️ Spécifications Techniques
      - **Composition :** [Matières perçues]
      - **Texture :** [Aspect tactile]
      - **Design :** [Détails de conception]
      - **Entretien :** [Conseils d'entretien]

      ### 🌍 Localisation
      - **Langue du texte suggérée :** 🇩🇿 العربية (Arabe) / Français

      ### 📸 Recommandations de Styles Visuels
      1. **[Nom du Style 1]** : [Description courte] | *Tags: [X, Y]*
      2. **[Nom du Style 2]** : [Description courte] | *Tags: [X, Y]*
      3. **[Nom du Style 3]** : [Description courte] | *Tags: [X, Y]*

      ### 📐 Dispositions de Texte (Marketing Layouts)
      1. **[Concept 1]** : [Description] | *Impact: [Effet]*
      2. **[Concept 2]** : [Description] | *Impact: [Effet]*
      3. **[Concept 3]** : [Description] | *Impact: [Effet]*

      ### 🚀 Plan d'Action Marketing (Stratégie Algérie)
      - **Positionnement :** [Stratégie de différenciation]
      - **Offre Irrésistible :** [Promotion recommandée]
      
      ### 📱 Idées de Contenu (Posts & Vidéos)
      - [Idée 1]
      - [Idée 2]
      - [Idée 3]

      ### ⚡ Optimisation Page Produit
      - [Conseil CRO 1]
      - [Conseil CRO 2]

      Reste extrêmement précis, utilisez un ton d'expert consultant et assure-toi que les codes couleurs sont cohérents avec l'image.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType } }
      ],
      config: { maxOutputTokens: 8192 }
    });

    return response.text || "Désolé, je n'ai pas pu analyser l'image.";
  });
}

export async function translateToArabic(text: string) {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `Traduisez le nom de produit suivant en Arabe (Algérie/Standard) de manière commerciale et élégante. Ne répondez QUE la traduction sans aucun autre texte.
    
    Produit : "${text}"`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { maxOutputTokens: 1024 }
    });
    
    return response.text?.trim() || text;
  });
}

export async function suggestMarketingStrategy(productName: string, brand: string = "", category: string = "") {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un Stratège Marketing E-commerce de haut niveau expert du marché algérien.
      
      # MISSION
      À partir du nom d'un produit, suggère une stratégie marketing complète pour une landing page haute conversion (COD).
      
      # PRODUIT
      Nom : ${productName}
      Marque : ${brand || 'N/A'}
      Catégorie : ${category || 'N/A'}
      
      # STRUCTURE JSON ATTENDUE
      {
        "marketingAngle": "L'angle de vente le plus percutant (parmi: Luxe Accessible, Urgence maximale, Solution miracle, Confiance & Famille, Style & Tendance, Économie / Offre Or) avec une courte explication",
        "sellingPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
        "description": "Un pitch marketing de 3 sentences optimisé pour le marché DZ mixing Arabe/Français",
        "targetAudience": "Description précise de la cible en Algérie",
        "funnelStrategy": "AIDA | PAS | FAB",
        "productType": "Type précis de l'objet",
        "suggestedTitle": "Titre accrocheur en Arabe/Français"
      }
      
      IMPORTANT : Sois créatif, spécifique au marché DZ (logistique, confiance, besoins locaux). Ne réponds que le JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 2048
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function refineLandingPageSection(
  sectionTitle: string, 
  currentContent: string, 
  instruction: string, 
  language: string = "Arabe / Darija Algérienne"
) {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      Tu es un copywriter d'élite en e-commerce. Réécris la section de landing page suivante selon l'instruction fournie.
      
      Type de Section : "${sectionTitle}"
      Contenu Actuel : "${currentContent}"
      Consigne de modification : "${instruction}"
      Langue requise : ${language}
      
      Réponds UNIQUEMENT avec le nouveau texte réécrit rédigé spécifiquement pour la vente en Algérie. Pas d'explications, pas de bla-bla ni de guillemets autour de ta réponse.
    `;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { maxOutputTokens: 2048 }
    });
    return response.text?.trim() || currentContent;
  });
}

export async function analyzeProductAnglesFromImage(imageInput: { data: string, mimeType: string }[] | { data: string, mimeType: string }) {
  return callGeminiWithRetry(async (ai) => {
    const imagesList = Array.isArray(imageInput) ? imageInput : [imageInput];
    const imageParts = imagesList.map(img => ({ inlineData: img }));

    const prompt = `
      # ROLE
      Tu es un Expert Product Scout & Analyste Marketing de haut niveau pour le marché e-commerce algérien (COD). 

      # MISSION
      Analyse visuellement ces images de produit (${imagesList.length} photo(s) sous différents angles, détails, variantes ou emballages).
      Identifie avec précision le nom du produit, sa marque (ou Marque Blanche), et sa catégorie globale en combinant toutes les informations visuelles fournies.
      Ensuite, propose entre 6 et 8 angles de niche ou contextes d'utilisation spécifiques, extrêmement pertinents, diversifiés, tendance et créatifs pour ce produit (جميع الزوايا التسويقية الممكنة والرائجة للمنتج).
      Ces angles représentent les contextes, bénéfices clés ou environnements d'utilisation (ex: "السيارات (Automobiles)", "المطبخ (Cuisine)", "الرحلات (Camping)", "المكتب (Bureau)", "المنزل (Maison)", "العناية (Beauté)", "الرياضة (Sport)", "الهدايا (Cadeaux)", "الأطفال (Enfants)", etc.) parfaitement adaptés à la nature de ce produit spécifique.

      # DIRECTIVES DE RÉPONSE (JSON UNIQUEMENT)
      Retourne uniquement un objet JSON valide avec cette structure exacte :
      {
        "name": "Nom commercial percutant en Français",
        "brand": "Marque identifiée ou 'Marque Blanche'",
        "category": "Catégorie du produit",
        "suggestedNicheAngles": [
          {
            "id": "Nom en Arabe (Explication en Français)",
            "label": "Mot clé principal en Arabe (ex: السيارات)",
            "desc": "Traduction ou concept court en Français (ex: Automobile)",
            "icon": "car | bus | plane | home | briefcase | heart | flame | layout"
          }
        ]
      }

      Ne retourne rien d'autre que du JSON. Génère au moins 6 à 8 angles d'utilisation riches et distincts pour donner le maximum d'options à l'utilisateur.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        ...imageParts
      ],
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 2048
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function completeProductAnalysisWithAngle(
  imageInput: { data: string, mimeType: string }[] | { data: string, mimeType: string }, 
  selectedAngle: string, 
  basicInfo: { name: string, brand: string, category: string }
) {
  return callGeminiWithRetry(async (ai) => {
    const imagesList = Array.isArray(imageInput) ? imageInput : [imageInput];
    const imageParts = imagesList.map(img => ({ inlineData: img }));

    const prompt = `
      # ROLE
      Tu es un Expert Product Scout & Concepteur-Rédacteur pour le marché e-commerce algérien (COD).

      # MISSION
      En te basant sur l'ensemble des images du produit (${imagesList.length} photo(s) montrant la face, les côtés, les détails et l'emballage), les informations de base (${JSON.stringify(basicInfo)}) et SURTOUT l'angle marketing choisi par l'utilisateur : "${selectedAngle}", complète l'analyse stratégique et marketing pour ce produit.
      L'angle marketing choisi définit le contexte, le vocabulaire et les environnements d'utilisation prioritaires (ex: si l'angle est les voitures, toute la stratégie doit être orientée confort/sécurité en voiture).
      Exploite la richesse des détails observés dans toutes les images pour générer les arguments de vente les plus précis et convaincants.

      # DIRECTIVES DE RÉPONSE (JSON UNIQUEMENT)
      Retourne uniquement un objet JSON valide avec cette structure exacte :
      {
        "nameAr": "Nom commercial percutant en Arabe Algérien (Darija) orienté sur l'angle choisi",
        "type": "Type de produit précis",
        "targetAudience": "Cible démographique précise en Algérie adaptée à l'angle choisi (Âge, Ville, Intérêt)",
        "colorPalette": ["HEX Dominant", "HEX Secondaire", "HEX Accents"],
        "sellingPoints": [
          "Bénéfice fort 1 adapté à l'angle",
          "Bénéfice fort 2 adapté à l'angle",
          "Bénéfice fort 3 adapté à l'angle",
          "Bénéfice fort 4 adapté à l'angle",
          "Bénéfice fort 5 adapté à l'angle"
        ],
        "briefDescription": "Pitch marketing d'accroche irrésistible de 2 phrases en Arabe/Darija centré sur l'angle choisi",
        "marketingAngle": "Luxe Accessible | Urgence maximale | Solution miracle | Confiance & Famille | Style & Tendance | Économie / Offre Or",
        "funnelStrategy": "AIDA | PAS | FAB",
        "tone": "Vendeur / Persuasif | Professionnel / Corporate | Amical / Storytelling | Minimaliste / Direct",
        "designStyle": "Moderne / Minimaliste | Brutalist / High-tech | Élégant / Classique | Coloré / Dynamique",
        "pageType": "Landing Page Classique | Page de Vente Directe | Opt-in / Pre-sell"
      }

      Ne retourne rien d'autre que du JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        ...imageParts
      ],
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 4096
      }
    });
    
    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}

export async function suggestNicheAngles(productName: string, brand: string = "", category: string = "") {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      # ROLE
      Tu es un expert en Marketing E-commerce de haut niveau, spécialiste du marché algérien (COD).
      
      # MISSION
      Propose entre 6 et 8 angles de niche ou contextes d'utilisation spécifiques, extrêmement variés et pertinents pour ce produit : "${productName}" (Catégorie: ${category || 'N/A'}, Marque: ${brand || 'N/A'}).
      Ces angles de niche (زاوية المنتج) représentent les différents contextes, environnements, bénéfices ou segments d'utilisation où le produit apporte de la valeur (ex: pour un produit de voiture, ce serait "السيارات", "السفر", "العمل", etc.; pour un ustensile de cuisine, ce serait "المطبخ", "الرحلات", "الحفلات", etc.).
      
      # STRUCTURE JSON ATTENDUE
      Retourne UNIQUEMENT un tableau JSON d'objets (entre 6 et 8 objets) respectant exactement ce format :
      [
        {
          "id": "Label en Arabe (Explication en Français)",
          "label": "Mot clé principal en Arabe (ex: السيارات)",
          "desc": "Traduction ou concept court en Français (ex: Automobile)",
          "icon": "car | bus | plane | home | briefcase | heart | flame | layout"
        }
      ]
      
      IMPORTANT : Sois extrêmement cohérent, varié et créatif par rapport au type de produit. Si c'est un produit de beauté, propose des angles comme (Beauté/Événements, Utilisation Quotidienne, Cadeau/Fêtes, Soin de nuit, Routine Matinale, etc.).
      Ne retourne QUE le JSON valide. Génère au moins 6 à 8 angles d'utilisation.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 2048
      }
    });
    
    return safeParseJSON(response.text || "[]");
  });
}

/**
 * Analyzes landing page screenshots/designs and returns structured sections
 * that can be rendered as a real landing page.
 */
export async function analyzeLandingPageImages(images: { data: string, mimeType: string }[]) {
  return callGeminiWithRetry(async (ai) => {
    const imageParts = images.map(img => ({ inlineData: img }));

    const prompt = `
      You are an expert web designer and landing page architect. Analyze the provided landing page screenshot(s)/design(s) and extract the COMPLETE structure as structured data.

      For each distinct visual section you identify in the image(s), create a section object. Pay close attention to:
      - Text content (headlines, subheadlines, body text, button labels)
      - Layout structure (hero, feature grids, testimonials, CTAs, galleries)
      - Color schemes (extract dominant colors as hex)
      - Hierarchy and grouping of elements

      Return a JSON object with this EXACT structure:
      {
        "pageName": "Suggested name for this landing page",
        "sections": [
          {
            "type": "hero",
            "headline": "Main headline text from the image",
            "subheadline": "Supporting text / subtitle",
            "ctaText": "Button text",
            "bgColor": "#hex color"
          },
          {
            "type": "features",
            "title": "Section heading",
            "subtitle": "Section subheading",
            "items": [
              { "title": "Feature name", "description": "Feature description", "icon": "emoji" }
            ]
          },
          {
            "type": "testimonial",
            "quote": "Customer quote or review text",
            "author": "Author name",
            "role": "Author title/role"
          },
          {
            "type": "cta",
            "headline": "CTA headline",
            "description": "CTA supporting text",
            "buttonText": "Button label",
            "bgColor": "#hex color"
          }
        ]
      }

      RULES:
      - Extract ALL visible text faithfully — do not invent text that isn't in the images
      - If text is in Arabic, keep it in Arabic. If in English, keep English. If in French, keep French.
      - Use "hero" for the top section with main headline
      - Use "features" for grids/cards showing product features or benefits
      - Use "testimonial" for customer reviews, ratings, social proof
      - Use "cta" for call-to-action sections (sign up, buy now, etc.)
      - Extract the actual hex colors used in the design
      - If you see an image gallery section, use "imageGallery" with an empty images array
      - Generate 3-8 sections depending on what's visible
      - Do NOT add fake statistics, fake names, or invented content

      ONLY return valid JSON. No markdown, no explanation.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        ...imageParts
      ],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    });

    return unwrapSingleObject(safeParseJSON(response.text || "{}"));
  });
}
