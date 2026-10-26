// The MTProto client ("telegram") is heavy, so it is imported inside getTelegramPulse(), and only once
// credentials exist: every other request and every serverless cold start skips it.
import type { TelegramClient as TelegramClientType } from "telegram";

export interface TelegramPulse {
  mode: "live" | "simulation";
  channels: string[];
  status: string;
  lastPulse: string;
  rawSnippet: string;
  sampleMessages?: { channel: string; text: string }[];
  error?: string;
}

// Algerian e-commerce channels to monitor (real @usernames the MTProto session must be able to access).
export const DZ_CHANNELS = [
  "import_algerie",
  "grossiste_dz_shop",
  "algiers_marketplace",
  "vente_gros_dz",
  "shopping_dz_store",
];

const MESSAGES_PER_CHANNEL = 5;
const SNIPPET_LENGTH = 200;

function simulationPulse(reason: string): TelegramPulse {
  return {
    mode: "simulation",
    channels: DZ_CHANNELS,
    status: "connected",
    lastPulse: new Date().toISOString(),
    rawSnippet:
      "Simulation de messages Telegram des canaux DZ (aucune connexion réelle). Configurez TELEGRAM_API_ID, TELEGRAM_API_HASH et TELEGRAM_SESSION pour activer le scouting réel.",
    error: reason,
  };
}

/**
 * Reads recent messages from the DZ channels using the MTProto client.
 * Falls back to a clearly-labeled simulation when credentials are missing or the connection fails.
 */
export async function getTelegramPulse(): Promise<TelegramPulse> {
  const apiId = Number(process.env.TELEGRAM_API_ID || "");
  const apiHash = process.env.TELEGRAM_API_HASH || "";
  const session = process.env.TELEGRAM_SESSION || "";

  if (!apiId || !apiHash || !session) {
    return simulationPulse("TELEGRAM_API_ID / TELEGRAM_API_HASH / TELEGRAM_SESSION manquants.");
  }

  let client: TelegramClientType | undefined;
  try {
    // Building the client is inside the try on purpose: a malformed TELEGRAM_SESSION must fall back
    // to the simulation like any other connection problem, not crash the request.
    const { TelegramClient } = await import("telegram");
    const { StringSession } = await import("telegram/sessions/index.js");
    client = new TelegramClient(new StringSession(session), apiId, apiHash, {
      connectionRetries: 1,
      requestRetries: 1,
      timeout: 15000,
      deviceModel: "DzAds AI Server",
    });
    await client.connect();
    if (!(await client.checkAuthorization())) {
      await client.disconnect();
      return simulationPulse("Session Telegram invalide ou expirée (StringSession non autorisée).");
    }

    const sampleMessages: { channel: string; text: string }[] = [];
    for (const channel of DZ_CHANNELS) {
      try {
        const entity = await client.getEntity(channel);
        const messages = await client.getMessages(entity, { limit: MESSAGES_PER_CHANNEL });
        for (const msg of messages) {
          const text = typeof msg.message === "string" ? msg.message.trim() : "";
          if (text) {
            sampleMessages.push({ channel, text: text.slice(0, SNIPPET_LENGTH) });
          }
        }
      } catch (err) {
        // Channel unreachable/private — skip it and continue with the rest.
      }
    }

    await client.disconnect();

    if (sampleMessages.length === 0) {
      return simulationPulse("Canaux DZ introuvables ou aucun message récent (vérifiez les @usernames).");
    }

    return {
      mode: "live",
      channels: DZ_CHANNELS,
      status: "connected",
      lastPulse: new Date().toISOString(),
      rawSnippet: sampleMessages.map((m) => `[${m.channel}] ${m.text}`).join("\n"),
      sampleMessages,
    };
  } catch (err: any) {
    try {
      await client?.disconnect();
    } catch {
      // ignore disconnect errors
    }
    return simulationPulse(`Erreur MTProto: ${err?.message || String(err)}`);
  }
}
