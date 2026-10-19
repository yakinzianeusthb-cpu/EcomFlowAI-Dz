/**
 * Builds the context and rules the Telegram product scout sends to the AI.
 *
 * Live mode hands the model the real channel messages and tells it to use nothing else.
 * Simulation mode says plainly that no real data was read, so the model cannot pass its
 * ideas off as things seen on Telegram. The prompt text is French on purpose: it is an
 * instruction to the model, not interface text.
 */

export interface TelegramTrendPayload {
  mode?: string;
  channels?: string[];
  lastPulse?: string;
  error?: string;
  sampleMessages?: { channel: string; text: string }[];
}

export interface ScoutContext {
  mode: "live" | "simulation";
  context: string;
  rules: string;
}

/** Enough messages to find trends, few enough to keep the prompt cheap. */
export const MAX_PROMPT_MESSAGES = 40;

export function buildScoutContext(data: TelegramTrendPayload | null): ScoutContext {
  const channels = (data?.channels ?? []).join(", ");
  const messages = (data?.sampleMessages ?? [])
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .slice(0, MAX_PROMPT_MESSAGES);

  if (data?.mode === "live" && messages.length > 0) {
    return {
      mode: "live",
      context: [
        `TELEGRAM RÉEL — canaux DZ surveillés : ${channels}. Dernière lecture : ${data.lastPulse ?? "inconnue"}.`,
        "Messages récents :",
        ...messages.map((m) => `[${m.channel}] ${m.text.trim()}`),
      ].join("\n"),
      rules:
        "Base-toi UNIQUEMENT sur les messages ci-dessus. N'invente ni produit ni canal. " +
        "Pour chaque produit, sourceChannel est le canal d'où vient le message. " +
        "Si tu identifies moins de 6 produits, retourne-en moins.",
    };
  }

  return {
    mode: "simulation",
    context:
      `SIMULATION — aucune donnée Telegram réelle n'a été lue.` +
      (data?.error ? ` Raison : ${data.error}` : "") +
      (channels ? ` Canaux ciblés : ${channels}.` : ""),
    rules:
      "Tu n'as aucune donnée Telegram réelle : propose des idées de produits plausibles pour le marché algérien COD, " +
      'sans jamais prétendre qu\'elles viennent de messages réels. Mets "Simulation" dans sourceChannel pour chaque produit.',
  };
}
