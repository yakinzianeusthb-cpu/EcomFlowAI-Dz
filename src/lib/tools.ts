import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Clapperboard,
  Wand2,
  Layers,
  Camera,
  Calculator,
  TrendingUp,
  MessageSquare,
  ShoppingBag,
  Radar,
  Calendar,
  Megaphone,
} from 'lucide-react';

export interface AiTool {
  /** NavItem tab id (AppShell / Sidebar). */
  id: string;
  /** Short French label (icon chip carries the visuals). */
  label: string;
  /** One-line description shown under the label. */
  blurb: string;
  icon: LucideIcon;
  /** Whether an active plan is required to use it. */
  paid: boolean;
}

/** All tools surfaced on the dashboard launcher. Order = display order. */
export const AI_TOOLS: AiTool[] = [
  { id: 'analyzer', label: 'Consultant Expert IA', blurb: "Analyse ton produit et reçois des recommandations d'expert.", icon: Bot, paid: true },
  { id: 'video', label: 'Créatifs Pubs Vidéo', blurb: 'Génère des publicités vidéo TikTok/Facebook à fort potentiel.', icon: Clapperboard, paid: true },
  { id: 'landing', label: 'Tunnel de Vente & LP', blurb: 'Crée des tunnels de vente et des copies de landing page.', icon: Wand2, paid: true },
  { id: 'ads', label: 'Publicités', blurb: 'Concepts, textes et visuels publicitaires prêts pour Meta.', icon: Megaphone, paid: true },
  { id: 'assembler', label: 'Constructeur de LP', blurb: 'Assemble visuellement ta landing page section par section.', icon: Layers, paid: true },
  { id: 'images', label: 'Studio Photos', blurb: 'Génère des visuels produit professionnels pour tes annonces.', icon: Camera, paid: true },
  { id: 'darja', label: 'Annonces Darja', blurb: "Rédige des annonces en darja qui parlent à ton audience.", icon: MessageSquare, paid: true },
  { id: 'scout', label: 'Scout Telegram', blurb: 'Découvre des produits gagnants depuis Telegram.', icon: Radar, paid: true },
  { id: 'trends', label: 'Produits Gagnants', blurb: 'Repère les tendances et les produits gagnants du marché.', icon: TrendingUp, paid: true },
  { id: 'calendar', label: 'Calendrier Contenu', blurb: 'Planifie ton calendrier de contenu et garde le cap.', icon: Calendar, paid: true },
  { id: 'catalog', label: 'Catalogue Produits', blurb: 'Gère ton catalogue et suis tes produits.', icon: ShoppingBag, paid: false },
  { id: 'calculator', label: 'Marge COD & Profit', blurb: "Calcule tes marges et ton profit net COD.", icon: Calculator, paid: false },
];

export const findTool = (id: string): AiTool | undefined => AI_TOOLS.find(t => t.id === id);

/**
 * The 4 tools surfaced in the sidebar (video, landing, assembler, calculator).
 * The dashboard launcher mirrors exactly these — not the full AI_TOOLS list.
 */
export const CORE_TOOLS: AiTool[] = AI_TOOLS.filter(t =>
  ['video', 'landing', 'assembler', 'calculator'].includes(t.id)
);
