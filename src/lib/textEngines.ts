/**
 * The AI that writes the texts (landing pages, video scripts, analyses), chosen by each seller in Paramètres.
 * Gemini by default; the others run on the seller's own key for that service (stored encrypted, used only by the
 * server, see src/lib/textEngineCall.ts). Points (src/lib/credits.ts) pay only for Gemini on the platform's key.
 * Shared by the browser (the settings cards) and the server.
 *
 * Model names change every few months, so each engine has a default here and the settings page can load the
 * service's own current list ("Charger les modèles").
 */

export type TextProvider = 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'deepseek' | 'xai' | 'openrouter';

export const TEXT_PROVIDERS: readonly TextProvider[] = ['gemini', 'openai', 'anthropic', 'mistral', 'deepseek', 'xai', 'openrouter'];
export const DEFAULT_TEXT_PROVIDER: TextProvider = 'gemini';

export const isTextProvider = (value: unknown): value is TextProvider => TEXT_PROVIDERS.includes(value as TextProvider);

export interface TextEngineInfo {
  name: string;
  /** the settings field that holds its key (OpenAI shares its key with the image service) */
  keyField: 'geminiApiKey' | 'openaiApiKey' | 'anthropicApiKey' | 'mistralApiKey' | 'deepseekApiKey' | 'xaiApiKey' | 'openrouterApiKey';
  /** used when the seller has not picked a model */
  defaultModel: string;
  /** reads the product photos sent with a request; DeepSeek's chat model reads text only */
  vision: boolean;
  /** where to create a key */
  keyUrl: string;
  keyPlaceholder: string;
}

export const TEXT_ENGINES: Record<TextProvider, TextEngineInfo> = {
  gemini: { name: 'Google Gemini', keyField: 'geminiApiKey', defaultModel: 'gemini-3-flash-preview', vision: true, keyUrl: 'https://aistudio.google.com/app/apikey', keyPlaceholder: 'AIza…' },
  openai: { name: 'OpenAI', keyField: 'openaiApiKey', defaultModel: 'gpt-6-luna', vision: true, keyUrl: 'https://platform.openai.com/api-keys', keyPlaceholder: 'sk-…' },
  anthropic: { name: 'Anthropic Claude', keyField: 'anthropicApiKey', defaultModel: 'claude-opus-5-5', vision: true, keyUrl: 'https://platform.claude.com/settings/keys', keyPlaceholder: 'sk-ant-…' },
  mistral: { name: 'Mistral AI', keyField: 'mistralApiKey', defaultModel: 'mistral-large-latest', vision: true, keyUrl: 'https://console.mistral.ai/api-keys', keyPlaceholder: '…' },
  deepseek: { name: 'DeepSeek', keyField: 'deepseekApiKey', defaultModel: 'deepseek-chat', vision: false, keyUrl: 'https://platform.deepseek.com/api_keys', keyPlaceholder: 'sk-…' },
  xai: { name: 'xAI Grok', keyField: 'xaiApiKey', defaultModel: 'grok-4.3', vision: true, keyUrl: 'https://console.x.ai', keyPlaceholder: 'xai-…' },
  openrouter: { name: 'OpenRouter', keyField: 'openrouterApiKey', defaultModel: 'openrouter/auto', vision: true, keyUrl: 'https://openrouter.ai/settings/keys', keyPlaceholder: 'sk-or-…' },
};

/** Model ids: letters, digits and . _ : / - (OpenRouter's are "vendor/model"); nothing that could reach a URL or header. */
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
export const isModelId = (value: unknown): value is string => typeof value === 'string' && MODEL_ID.test(value);

/** The model to use: the seller's choice when valid, otherwise the engine's default. */
export const modelFor = (provider: TextProvider, chosen: unknown): string => (isModelId(chosen) ? chosen : TEXT_ENGINES[provider].defaultModel);

/** French messages (translated on the way out, see src/i18n/serverMessages.ts). */
export const TEXT_ENGINE_ERRORS = {
  noKey: "Ajoute la clé du moteur IA choisi dans Paramètres (ou choisis Google Gemini).",
  badKey: "La clé du moteur IA choisi est refusée : vérifie-la dans Paramètres.",
  noCredit: "Le moteur IA choisi refuse : plus de crédit ou facturation à activer sur ton compte chez ce service.",
  busy: "Le moteur IA choisi est surchargé ou ton quota est atteint. Réessaie dans un moment.",
  model: "Ce modèle n'existe pas chez le moteur IA choisi, ou ta clé n'y a pas accès : choisis-en un autre dans Paramètres.",
  failed: "Le moteur IA choisi n'a pas pu répondre. Réessaie.",
  refused: "Le moteur IA a refusé cette demande. Reformule-la.",
  provider: "Moteur IA inconnu.",
  modelId: "Nom de modèle invalide.",
} as const;
