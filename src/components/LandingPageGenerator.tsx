import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  FileText,
  Wand2,
  Download,
  Layout, 
  Image as ImageIcon, 
  X,
  ChevronDown,
  ChevronUp,
  Settings2,
  ListOrdered,
  Mic2,
  Palette,
  Flag,
  Languages,
  Maximize,
  Monitor,
  Smartphone,
  Square as SquareIcon,
  RotateCcw,
  Target,
  Zap,
  History,
  MessageSquare,
  Search,
  Trash2,
  Plus,
  Archive,
  ChevronRight,
  GripVertical,
  Tag,
  User,
  Package,
  PenTool,
  Car,
  Bus,
  Plane,
  Briefcase,
  Heart,
  Flame,
  Home,
  Star,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CopyCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generateLandingPageCopy, translateToArabic, analyzeProductAnglesFromImage, completeProductAnalysisWithAngle } from '../services/gemini';
import LPVisualMockup from './LPVisualMockup';

const LandingPublisher = lazy(() => import('./LandingPublisher'));
import { cn } from '../lib/utils';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { useToast } from '../context/ToastContext';
import { addToHistory } from '../lib/history';
import { lpSessionsApi, preferencesApi } from '../services/api';
import PromptField from './PromptField';
import RichText from './RichText';
import PageHeader from './PageHeader';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/funnels';
import { formatDate } from '../i18n/dates';

interface LPSession {
  id: string;
  title: string;
  updatedAt: number;
  state: {
    productName: string;
    productNameAr: string;
    brand: string;
    category: string;
    productType: string;
    targetAudience: string;
    colorPalette: string;
    selectedPaletteId: string | null;
    sellingPoints: string;
    description: string;
    marketingAngle: string;
    nicheAngle?: string;
    funnelStrategy: string;
    numSections: number;
    tone: string;
    designStyle: string;
    visualStyle: string;
    pageType: string;
    targetMarket: string;
    language: string;
    aspectRatio: string;
    lpData: any | null;
  }
}

// Normalise server/localStorage sessions and ensure all restored sections have IDs for dnd-kit.
// Guards every field the archive UI reads (id/title/updatedAt/brand/category) so a
// malformed or legacy session can never produce NaN dates or crash the list.
function migrateLpSessions(list: any[]): LPSession[] {
  return list.map((session: any) => {
    const rawUpdatedAt = session.updatedAt;
    const parsedUpdatedAt =
      typeof rawUpdatedAt === 'number'
        ? rawUpdatedAt
        : new Date(rawUpdatedAt).getTime();
    return {
      ...session,
      id: session.id || `lp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: session.title || 'Sans Titre',
      updatedAt: Number.isNaN(parsedUpdatedAt) ? Date.now() : parsedUpdatedAt,
      state: {
        ...session.state,
        brand: session.state?.brand || '',
        category: session.state?.category || '',
        lpData: session.state?.lpData ? {
          ...session.state.lpData,
          sections: session.state.lpData.sections?.map((s: any, idx: number) => ({
            ...s,
            id: s.id || `restored-${idx}-${Date.now()}`
          })) || []
        } : null
      }
    };
  });
}

interface SortableSectionProps {
  id: string;
  section: any;
  index: number;
  totalSections?: number;
  updateSectionField: (index: number, field: string, value: any) => void;
  selectedCtaIndex: Record<number, number>;
  handleCtaChange: (sectionIndex: number, variationIndex: number) => void;
  deleteSection: (index: number) => void;
  moveSection?: (index: number, direction: 'up' | 'down') => void;
  duplicateSection?: (index: number) => void;
}

const SortableSection = ({
  id,
  section,
  index,
  totalSections = 0,
  updateSectionField,
  selectedCtaIndex,
  handleCtaChange,
  deleteSection,
  moveSection,
  duplicateSection
}: SortableSectionProps) => {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const toast = useToast();
  const s = section;
  const i = index;
  const isHero = i === 0 || s.step?.toLowerCase().includes('hero') || s.narrativeRole?.toLowerCase().includes('hook');

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      <div className={`overflow-hidden group transition-all rounded-2xl sm:rounded-2xl border ${
        isHero 
          ? 'bg-dz-emerald/10 border-dz-emerald/40 shadow-2xl shadow-dz-emerald/10' 
          : 'bg-fg/5 border-fg/10 hover:border-dz-emerald/30'
      }`}>
        {/* controls on the first line, the editable title on its own full-width line below */}
        <div className={`p-3.5 sm:p-5 flex flex-wrap items-center gap-x-3 gap-y-3 border-b ${
          isHero ? 'bg-dz-emerald/10 border-dz-emerald/20' : 'bg-fg/5 border-fg/5'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button 
              {...attributes} 
              {...listeners}
              className="p-1.5 text-fg-faint hover:text-dz-emerald transition-colors cursor-grab active:cursor-grabbing shrink-0"
              title={t('pbDragHint', 'Glisser pour réorganiser')}
            >
              <GripVertical size={18} />
            </button>

            {/* Section Number Badge */}
            <div className="flex items-center justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 bg-surface border border-line rounded-xl text-primary-ink font-bold text-xs shrink-0">
              <span className="text-xs font-sans font-extrabold me-1 text-dz-emerald">{t('lpgSection', 'Section')}</span>
              <span>#{i + 1}</span>
            </div>

            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isHero ? 'bg-primary text-white shadow-lg' : 'bg-dz-emerald/20 text-dz-emerald'
            }`}>
              <Layout size={16} />
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-dz-emerald">{s.step?.split('—').pop()?.trim() || t('lpgSection', 'Section')}</span>
              {s.narrativeRole && (
                <span className={`text-xs font-semibold px-1.5 rounded ${isHero ? 'bg-surface text-primary-ink' : 'bg-fg/10 text-fg-muted'}`}>{s.narrativeRole}</span>
              )}
              {isCollapsed && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t('lpgReduit', 'Réduit')}
                </span>
              )}
            </div>
          </div>
          
          <div className="ms-auto flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Up/Down controls for mobile */}
            {moveSection && (
              <div className="flex items-center gap-0.5 bg-fg/5 border border-fg/10 rounded-xl p-0.5">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveSection(i, 'up')}
                  className="p-1.5 text-fg-muted hover:text-dz-emerald disabled:opacity-20 rounded-lg hover:bg-fg/10 transition-all"
                  title={t('lpgMonterSection', 'Monter la section')}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={totalSections > 0 && i === totalSections - 1}
                  onClick={() => moveSection(i, 'down')}
                  className="p-1.5 text-fg-muted hover:text-dz-emerald disabled:opacity-20 rounded-lg hover:bg-fg/10 transition-all"
                  title={t('lpgDescendreSection', 'Descendre la section')}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            )}

            {duplicateSection && (
              <button
                type="button"
                onClick={() => duplicateSection(i)}
                className="p-1.5 text-fg-muted hover:text-dz-emerald hover:bg-fg/10 rounded-xl transition-all border border-fg/10"
                title={t('lpgDupliquerSection', 'Dupliquer la section')}
              >
                <CopyCheck size={14} />
              </button>
            )}

            {/* Collapse / Expand Button */}
            <button 
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 text-xs font-bold border ${
                isCollapsed 
                  ? 'bg-dz-emerald/20 border-dz-emerald/40 text-dz-emerald hover:bg-dz-emerald/30 shadow-md' 
                  : 'bg-fg/5 border-fg/10 text-fg-muted hover:text-fg hover:bg-fg/10'
              }`}
              title={isCollapsed ? t('lpgAgrandirChamp', 'Agrandir le champ') : t('lpgReduireChamp', 'Réduire le champ')}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown size={14} className="text-dz-emerald" />
                  <span className="text-xs sm:text-xs font-bold">{t('lpgAgrandir', 'Agrandir')}</span>
                </>
              ) : (
                <>
                  <ChevronUp size={14} className="text-dz-emerald" />
                  <span className="text-xs sm:text-xs font-bold">{t('lpgReduire', 'Réduire')}</span>
                </>
              )}
            </button>

            <button
              onClick={() => deleteSection(i)}
              className="p-1.5 sm:p-2 text-fg-faint hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title={t('lpgSupprimerCetteSection', 'Supprimer cette section')}
            >
              <Trash2 size={15} />
            </button>
          </div>

          <h3 className={`basis-full font-bold tracking-tight ${isHero ? 'text-fg text-base sm:text-xl font-arabic drop-shadow-sm' : 'text-fg text-sm sm:text-base'}`}>
            <input
              value={s.title}
              onChange={(e) => updateSectionField(i, 'title', e.target.value)}
              dir="auto"
              aria-label={t('lpgSection', 'Section') + ` #${i + 1}`}
              className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-dz-emerald/20 rounded px-1 -ms-1 w-full placeholder:text-fg-faint text-start truncate"
            />
          </h3>
        </div>

        {!isCollapsed && (
          <div className="p-3 sm:p-5 md:p-6">
            <div className="space-y-3 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 bg-fg/[0.04] rounded-lg sm:rounded-xl border border-fg/5 gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs sm:text-xs font-semibold text-fg-muted">{t('lpgPromptIaSection', 'Prompt IA de la Section')}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const promptToCopy = s.prompt || (typeof s.imagePrompt === 'object' ? JSON.stringify(s.imagePrompt, null, 2) : '');
                      navigator.clipboard.writeText(promptToCopy);
                      toast.success(t('lpgPromptCopie', 'Prompt copié !'));
                    }}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md sm:rounded-lg text-xs sm:text-xs transition-all flex items-center justify-center gap-1 shadow-md shadow-dz-emerald/15 active:scale-95 shrink-0"
                  >
                    <Copy size={11} className="sm:size-[12px]" /> {t('lpgCopierPrompt', 'Copier le Prompt')}
                  </button>
                </div>

                {s.cta && (
                  <div className="p-2.5 sm:p-4 bg-dz-emerald/5 border border-dz-emerald/20 rounded-xl sm:rounded-2xl space-y-2.5 sm:space-y-3.5 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-xs text-dz-emerald font-semibold">{t('lpgOptimisationConversion', 'Optimisation de la conversion')}</p>
                        <h4 className="text-fg font-bold text-xs sm:text-xs">{t('lpgChoisissezAngleCta', 'Choisissez votre angle de CTA')}</h4>
                      </div>
                      <div className="flex p-0.5 bg-black/50 rounded-lg border border-fg/10 overflow-x-auto max-w-full">
                        {(s.cta.variations || []).map((v: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleCtaChange(i, idx)}
                            className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-md text-xs sm:text-xs font-semibold transition-all flex items-center gap-1 shrink-0 ${
                              (selectedCtaIndex[i] || 0) === idx 
                                ? 'bg-primary text-white shadow-md shadow-dz-emerald/30' 
                                : 'bg-transparent text-fg-muted hover:text-fg-muted'
                            }`}
                          >
                            {v.type === 'urgency' ? '⚡ Urgence' : v.type === 'benefit' ? t('lpgBenefice', 'Bénéfice') : '✅ Direct'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-center py-0.5">
                      <motion.div 
                        key={selectedCtaIndex[i] || 0}
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="w-full max-w-xs sm:max-w-sm px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-dz-emerald to-dz-emerald text-fg font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-md shadow-dz-emerald/20 text-center cursor-pointer active:scale-95 transition-transform"
                      >
                        <span className="font-arabic relative z-10 leading-snug">
                          {s.cta.variations ? s.cta.variations[selectedCtaIndex[i] || 0]?.text : (s.cta.text || s.cta)}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function LandingPageGenerator() {
  const { t, tf, language: uiLanguage } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [sessions, setSessions] = useState<LPSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  // IDs already known to exist on the server — used to pick create vs update.
  const apiKnownIds = useRef<Set<string>>(new Set());
  // Local IDs with a create request currently in flight — prevents duplicate creates.
  const pendingCreates = useRef<Set<string>>(new Set());
  const [historySearch, setHistorySearch] = useState('');
  const [productName, setProductName] = useState('');
  const [productNameAr, setProductNameAr] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null);
  const [sellingPoints, setSellingPoints] = useState('');
  const [description, setDescription] = useState('');
  const [marketingAngle, setMarketingAngle] = useState('');
  const [nicheAngle, setNicheAngle] = useState('');
  const [suggestedNicheAngles, setSuggestedNicheAngles] = useState<Array<{id: string, label: string, desc: string, icon: string}>>([
    { id: 'السيارات (Automobiles)', label: 'السيارات', desc: 'Voitures', icon: 'car' },
    { id: 'الحافلات (Transport)', label: 'الحافلات', desc: 'Autobus', icon: 'bus' },
    { id: 'الطائرات (Aviation)', label: 'الطائرات', desc: 'Avions', icon: 'plane' },
    { id: 'المنزل (Maison)', label: 'المنزل', desc: 'Maison', icon: 'home' }
  ]);
  const [funnelStrategy, setFunnelStrategy] = useState<string>('AIDA');
  
  // Advanced parameters
  const [numSections, setNumSections] = useState(8);
  const [tone, setTone] = useState('Vendeur / Persuasif');
  const [designStyle, setDesignStyle] = useState('Moderne / Minimaliste');
  const [visualStyle, setVisualStyle] = useState('Lifestyle');
  const [pageType, setPageType] = useState('Landing Page Classique');
  const [targetMarket, setTargetMarket] = useState('Algérie (58 wilayas)');
  const [language, setLanguage] = useState('Arabe / Darija Algérienne');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetAdvanced = () => {
    setNumSections(6);
    setTone('Vendeur / Persuasif');
    setDesignStyle('Moderne / Minimaliste');
    setVisualStyle('Lifestyle');
    setPageType('Landing Page Classique');
    setTargetMarket('Algérie (58 wilayas)');
    setLanguage('Arabe / Darija Algérienne');
  };

  const [images, setImages] = useState<Array<{ data: string, mimeType: string }>>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [storedImagesData, setStoredImagesData] = useState<Array<{ data: string, mimeType: string }>>([]);

  // Getters for backwards compatibility
  const imagePreview = imagePreviews[0] || null;
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingAngleSelection, setPendingAngleSelection] = useState(false);
  const [completingAnalysis, setCompletingAnalysis] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [result, setResult] = useState('');
  const [lpData, setLpData] = useState<any>(null);
  const [mobileViewTab, setMobileViewTab] = useState<'settings' | 'result'>('settings');
  const [layoutMode, setLayoutMode] = useState<'structure' | 'mockup' | 'page'>('structure');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedCtaIndex, setSelectedCtaIndex] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLpData((prev: any) => {
        if (!prev) return prev;
        
        const oldIndex = prev.sections.findIndex((s: any) => (s.id || s.title) === active.id);
        const newIndex = prev.sections.findIndex((s: any) => (s.id || s.title) === over.id);
        
        const newSections = arrayMove(prev.sections, oldIndex, newIndex);
        
        // Update steps and prompts dynamically
        const updatedSections = newSections.map((section: any, index: number) => {
          const total = newSections.length;
          const displayIndex = index + 1;
          const paddedIndex = displayIndex.toString().padStart(2, '0');
          
          // Update step label (e.g., "Étape 01 — HERO")
          let newStep = section.step || "";
          if (newStep.includes("Étape")) {
            newStep = newStep.replace(/Étape \d+/, `Étape ${paddedIndex}`);
          } else {
            // Fallback if step doesn't follow pattern
            const parts = newStep.split('—');
            if (parts.length > 1) {
              newStep = `Étape ${paddedIndex} — ${parts[1].trim()}`;
            }
          }

          // Update prompt (e.g., "SECTION [1]/[6]")
          let newPrompt = section.prompt || "";
          newPrompt = newPrompt.replace(/SECTION \d+\/\d+/, `SECTION ${displayIndex}/${total}`);
          newPrompt = newPrompt.replace(/SECTION \[\d+\]\/\[\d+\]/, `SECTION [${displayIndex}]/[${total}]`);
          
          // Update technical params in prompt if any mapping to index exists
          newPrompt = newPrompt.replace(/SECTION \[\d+\]\/\[\d+\]/g, `SECTION [${displayIndex}]/[${total}]`);

          return {
            ...section,
            step: newStep,
            prompt: newPrompt
          };
        });

        return { ...prev, sections: updatedSections };
      });
    }
  };

  // Load sessions on mount (server API first, localStorage as fallback)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded = false;
      try {
        const res = await lpSessionsApi.list();
        if (cancelled) return;
        const list: any[] = Array.isArray(res) ? res : ((res as any)?.sessions ?? []);
        if (Array.isArray(list)) {
          const migrated = migrateLpSessions(list);
          setSessions(migrated);
          migrated.forEach(s => apiKnownIds.current.add(s.id));
          loaded = true;

          // Restore the last active session (preferences first, then localStorage)
          let lastActiveId: string | null = null;
          try {
            const prefs = await preferencesApi.get();
            if (cancelled) return;
            lastActiveId = prefs?.lastLpActiveId || null;
          } catch (e) {
            console.error("Failed to load last active LP from API", e);
          }
          if (!lastActiveId) {
            lastActiveId = localStorage.getItem('dzads_lp_last_active_id');
          }
          if (lastActiveId) {
            const lastSession = migrated.find((s: LPSession) => s.id === lastActiveId);
            if (lastSession) restoreSession(lastSession);
          }
          return;
        }
      } catch (e) {
        console.error("Failed to load sessions from API", e);
      }
      if (cancelled || loaded) return;

      // Fallback to localStorage
      const saved = localStorage.getItem('dzads_lp_sessions');
      const lastActiveId = localStorage.getItem('dzads_lp_last_active_id');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const migrated = migrateLpSessions(parsed);
          setSessions(migrated);
          if (lastActiveId) {
            const lastSession = migrated.find((s: LPSession) => s.id === lastActiveId);
            if (lastSession) restoreSession(lastSession);
          }
        } catch (e) {
          console.error("Failed to load sessions", e);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Save sessions whenever they change (localStorage stays for offline resilience)
  useEffect(() => {
    localStorage.setItem('dzads_lp_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Persist the last active session id (dual-write)
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('dzads_lp_last_active_id', currentSessionId);
      preferencesApi.update({ lastLpActiveId: currentSessionId }).catch(() => {});
    }
  }, [currentSessionId]);

  // Periodic auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentSession();
    }, 30000);
    return () => clearInterval(interval);
  }, [productName, lpData, brand, category, description]); // Trigger auto-save on main field changes

  const saveCurrentSession = () => {
    if (!productName && !brand && !lpData) return;

    const sessionId = currentSessionId || Date.now().toString();
    if (!currentSessionId) setCurrentSessionId(sessionId);

    const newState: LPSession['state'] = {
      productName, productNameAr, brand, category, productType, 
      targetAudience, colorPalette, selectedPaletteId, sellingPoints,
      description, marketingAngle, nicheAngle, funnelStrategy, numSections,
      tone, designStyle, visualStyle, pageType, targetMarket, 
      language, aspectRatio, lpData
    };

    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      return [{
        id: sessionId,
        title: productName || "Sans Titre",
        updatedAt: Date.now(),
        state: newState
      }, ...filtered];
    });

    // Persist the session to the server API (fire-and-forget)
    const payload = { title: productName || "Sans Titre", state: newState };
    if (apiKnownIds.current.has(sessionId)) {
      lpSessionsApi.update(sessionId, payload).catch(() => {});
    } else if (!pendingCreates.current.has(sessionId)) {
      pendingCreates.current.add(sessionId);
      lpSessionsApi.create(payload)
        .then((res: any) => {
          const serverSession = res?.session || res;
          const serverId = serverSession?.id;
          if (serverId && serverId !== sessionId) {
            // Re-key the local session to the server-generated id
            apiKnownIds.current.add(serverId);
            setCurrentSessionId(prev => (prev === sessionId ? serverId : prev));
            setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, id: serverId } : s)));
          } else {
            apiKnownIds.current.add(sessionId);
          }
        })
        .catch(() => {})
        .finally(() => pendingCreates.current.delete(sessionId));
    }
  };

  const restoreSession = (session: LPSession) => {
    const s = session.state;
    setProductName(s.productName || '');
    setProductNameAr(s.productNameAr || '');
    setBrand(s.brand || '');
    setCategory(s.category || '');
    setProductType(s.productType || '');
    setTargetAudience(s.targetAudience || '');
    setColorPalette(s.colorPalette || '');
    setSelectedPaletteId(s.selectedPaletteId);
    setSellingPoints(s.sellingPoints || '');
    setDescription(s.description || '');
    setMarketingAngle(s.marketingAngle || '');
    setNicheAngle(s.nicheAngle || '');
    setFunnelStrategy(s.funnelStrategy || 'AIDA');
    setNumSections(s.numSections || 6);
    setTone(s.tone || 'Vendeur / Persuasif');
    setDesignStyle(s.designStyle || 'Moderne / Minimaliste');
    setVisualStyle(s.visualStyle || 'Lifestyle');
    setPageType(s.pageType || 'Landing Page Classique');
    setTargetMarket(s.targetMarket || 'Algérie (58 wilayas)');
    setLanguage(s.language || 'Arabe / Darija Algérienne');
    setAspectRatio(s.aspectRatio || '16:9');
    setLpData(s.lpData);
    setCurrentSessionId(session.id);
  };

  const loadSession = (session: LPSession) => {
    restoreSession(session);
    setActiveTab('editor');
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    apiKnownIds.current.delete(id);
    pendingCreates.current.delete(id);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
    lpSessionsApi.delete(id).catch(() => {});
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setProductName('');
    setProductNameAr('');
    setBrand('');
    setCategory('');
    setProductType('');
    setTargetAudience('');
    setColorPalette('');
    setSelectedPaletteId(null);
    setSellingPoints('');
    setDescription('');
    setMarketingAngle('');
    setNicheAngle('');
    setFunnelStrategy('AIDA');
    resetAdvanced();
    setLpData(null);
    removeAllImages();
    setActiveTab('editor');
  };

  const PALETTE_PRESETS = [
    { id: 'luxe', name: 'Luxe / Premium', colors: ['#000000', '#C5A059', '#FFFFFF'], label: 'Premium Noir & Or' },
    { id: 'dz-royal', name: 'DZ Royal', colors: ['#02774B', '#FFFFFF', '#D11028'], label: 'Identité Algérienne' },
    { id: 'tech', name: 'High-Tech', colors: ['#020617', '#06B6D4', '#FFFFFF'], label: 'Futuriste Cyber' },
    { id: 'natural', name: 'Bio / Naturel', colors: ['#064E3B', '#F5F5DC', '#78350F'], label: 'Éco-Responsable' },
    { id: 'vibrant', name: 'DTC / Pop', colors: ['#7C3AED', '#EC4899', '#FFFFFF'], label: 'Jeune & Dynamique' },
    { id: 'oasis', name: 'Oasis Desert', colors: ['#D97706', '#3B82F6', '#10B981'], label: 'Sable & Eau' },
    { id: 'midnight', name: 'Rose Midnight', colors: ['#111827', '#E11D48', '#F3F4F6'], label: 'Vibe Nocturne' },
    { id: 'minimal', name: 'Minimaliste', colors: ['#F9FAFB', '#111827', '#6B7280'], label: 'Clean Modern' },
    { id: 'urgency', name: 'Flash Sale', colors: ['#DC2626', '#000000', '#F97316'], label: 'Conversion Rapide' },
  ];

  const handleSelectPalette = (palette: typeof PALETTE_PRESETS[0]) => {
    setSelectedPaletteId(palette.id);
    setColorPalette(palette.colors.join(', '));
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const currentCount = images.length;
    const maxAllowed = 5 - currentCount;

    if (maxAllowed <= 0) {
      toast.error(t('lpgVousAvezAtteintLimite', 'Vous avez atteint la limite (5 images maximum). Supprimez une image pour en ajouter une autre.'));
      return;
    }

    const filesToProcess = fileArray.slice(0, maxAllowed);
    if (fileArray.length > maxAllowed) {
      toast.info(t('lpgSeulesMaxallowedPremieresImage', 'Seules les {maxAllowed} premières images ont été retenues : la limite est de 5 images.', { maxAllowed }));
    }

    try {
      // Large phone photos are shrunk first; the mime type comes from the result because a photo becomes a JPEG.
      const readPromises = filesToProcess.map(async (file) => {
        const preview = await fileToUploadDataUrl(file);
        const mimeType = preview.slice(5, preview.indexOf(';'));
        return { imageData: { data: preview.split(',')[1], mimeType }, preview };
      });

      const results = await Promise.all(readPromises);
      const newImageDataList = results.map(r => r.imageData);
      const newPreviewList = results.map(r => r.preview);

      const updatedImages = [...images, ...newImageDataList];
      const updatedPreviews = [...imagePreviews, ...newPreviewList];

      setImages(updatedImages);
      setImagePreviews(updatedPreviews);

      // Start auto-analysis (Step 1: Detect basic details and suggest niche marketing angles using ALL uploaded images)
      setAnalyzing(true);
      setPendingAngleSelection(false);
      setCompletingAnalysis(false);
      setError(null);

      toast.success(t('lpgLengthImagesChargeesL', "{length} images chargées pour l'analyse complète par l'IA", { length: updatedImages.length }));

      const analysis = await analyzeProductAnglesFromImage(updatedImages);
      if (analysis) {
        setProductName(analysis.name || '');
        setBrand(analysis.brand || '');
        setCategory(analysis.category || '');
        if (analysis.suggestedNicheAngles && Array.isArray(analysis.suggestedNicheAngles) && analysis.suggestedNicheAngles.length > 0) {
          setSuggestedNicheAngles(analysis.suggestedNicheAngles);
        }
        
        // Save image data to state and wait for user selection
        setStoredImagesData(updatedImages);
        setPendingAngleSelection(true);
        toast.success(t('lpgToutesImagesOntEte', "Toutes les images ont été analysées ! Choisissez l'angle marketing adapté pour continuer la création de la landing page."));
      } else {
        setError(t('lpgLAnalysePreliminaireImages', "L'analyse préliminaire des images a échoué (Quota Gemini épuisé ou erreur technique)."));
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      const errorStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err) || "");
      const isQuota = 
        errorStr.includes("429") || 
        errorStr.includes("RESOURCE_EXHAUSTED") || 
        errorStr.includes("quota") ||
        errorStr.toLowerCase().includes("exceeded") ||
        errorStr.includes("QUOTA_EXCEEDED") ||
        err?.status === "RESOURCE_EXHAUSTED" ||
        errorStr.toLowerCase().includes("limit reached");
      
      if (isQuota) {
        setError(t('lpgQuotaGeminiEpuiseL', "Quota Gemini épuisé. L'IA est surchargée ou vous avez atteint votre limite temporaire (Erreur 429). Veuillez patienter 1 minute ou remplir manuellement."));
      } else {
        setError(err.message || t('lpgErreurLorsLAnalyse', "Erreur lors de l'analyse des images. Veuillez vérifier votre connexion."));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectNicheAngleAndComplete = async (angleId: string) => {
    if (storedImagesData.length === 0) return;
    setNicheAngle(angleId);
    setPendingAngleSelection(false);
    setCompletingAnalysis(true);
    setError(null);
    try {
      const basicInfo = { name: productName, brand, category };
      const fullAnalysis = await completeProductAnalysisWithAngle(storedImagesData, angleId, basicInfo);
      if (fullAnalysis) {
        if (fullAnalysis.nameAr) {
          setProductNameAr(fullAnalysis.nameAr);
        } else if (productName) {
          try {
            const translated = await translateToArabic(productName);
            setProductNameAr(translated);
          } catch (e) {
            setProductNameAr(productName);
          }
        }
        setProductType(fullAnalysis.type || '');
        setTargetAudience(fullAnalysis.targetAudience || '');
        setColorPalette(fullAnalysis.colorPalette?.join(', ') || '');
        setSellingPoints(fullAnalysis.sellingPoints?.join('\n') || '');
        setDescription(fullAnalysis.briefDescription || '');
        if (fullAnalysis.marketingAngle) setMarketingAngle(fullAnalysis.marketingAngle);
        if (fullAnalysis.funnelStrategy) setFunnelStrategy(fullAnalysis.funnelStrategy);
        if (fullAnalysis.tone) setTone(fullAnalysis.tone);
        if (fullAnalysis.designStyle) setDesignStyle(fullAnalysis.designStyle);
        if (fullAnalysis.pageType) setPageType(fullAnalysis.pageType);
        
        toast.success(t('lpgAnalyse360TermineeToutes', 'Analyse 360° terminée ! Toutes les données ont été optimisées selon vos photos et votre angle.'));
      } else {
        setError(t('lpgLaFinalisationLAnalyse', "La finalisation de l'analyse a échoué."));
      }
    } catch (err: any) {
      console.error("Complete analysis failed:", err);
      setError(err.message || t('lpgUneErreurEstSurvenue', "Une erreur est survenue lors de la finalisation de l'analyse."));
    } finally {
      setCompletingAnalysis(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!analyzing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (analyzing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(updatedImages);
    setImagePreviews(updatedPreviews);
    setStoredImagesData(updatedImages);

    if (updatedImages.length === 0) {
      setPendingAngleSelection(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setMainImage = (index: number) => {
    if (index === 0 || index >= images.length) return;
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    const [selectedImg] = newImages.splice(index, 1);
    const [selectedPrev] = newPreviews.splice(index, 1);

    newImages.unshift(selectedImg);
    newPreviews.unshift(selectedPrev);

    setImages(newImages);
    setImagePreviews(newPreviews);
    setStoredImagesData(newImages);
    toast.success(t('lpgCetteImageEstMaintenant', "Cette image est maintenant l'image principale (n°1)"));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const newPreviews = [...imagePreviews];

    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    [newPreviews[index], newPreviews[targetIndex]] = [newPreviews[targetIndex], newPreviews[index]];

    setImages(newImages);
    setImagePreviews(newPreviews);
    setStoredImagesData(newImages);
    toast.success(t('lpgPositionLImageModifiee', "Position de l'image modifiée"));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!lpData) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lpData.sections.length) return;

    const newSections = [...lpData.sections];
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setLpData({ ...lpData, sections: newSections });
    toast.success(t('lpgPositionSectionModifiee', 'Position de la section modifiée'));
  };

  const duplicateSection = (index: number) => {
    if (!lpData) return;
    const sectionToClone = lpData.sections[index];
    const clonedSection = {
      ...sectionToClone,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${sectionToClone.title} (نسخة)`
    };
    const newSections = [...lpData.sections];
    newSections.splice(index + 1, 0, clonedSection);
    setLpData({ ...lpData, sections: newSections });
    toast.success(t('lpgSectionDupliquee', 'Section dupliquée'));
  };

  const removeAllImages = () => {
    setImages([]);
    setImagePreviews([]);
    setStoredImagesData([]);
    setPendingAngleSelection(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!productName) return;
    setLoading(true);
    setError(null);
    try {
      const productData = {
        name: productName,
        brand,
        category,
        productType,
        targetAudience,
        colorPalette: colorPalette.split(',').map(c => c.trim()).filter(c => c),
        sellingPoints: sellingPoints.split('\n').map(s => s.trim()).filter(s => s),
        description,
        marketingAngle,
        nicheAngle,
        funnelStrategy,
        numSections,
        tone,
        designStyle,
        visualStyle,
        pageType,
        targetMarket,
        language
      };
      const data = await generateLandingPageCopy(productData, images.length > 0 ? images : undefined, aspectRatio);
      if (data && data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
        // Add unique IDs to sections for dnd-kit
        const sectionsWithIds = data.sections.map((section: any, idx: number) => ({
          ...section,
          id: `section-${idx}-${Date.now()}`
        }));
        const finalData = { ...data, sections: sectionsWithIds };
        setLpData(finalData);
        setResult(JSON.stringify(finalData, null, 2));
        setMobileViewTab('result');
        toast.success(t('lpgLandingPageGenereeAvec', 'Landing page générée avec succès !'));

        // Record to centralized history
        const sessionId = currentSessionId || Date.now().toString();
        const historyPayload = {
          id: sessionId,
          title: productName,
          updatedAt: Date.now(),
          state: {
            productName, productNameAr, brand, category, productType, 
            targetAudience, colorPalette, selectedPaletteId, sellingPoints,
            description, marketingAngle, nicheAngle, funnelStrategy, numSections,
            tone, designStyle, visualStyle, pageType, targetMarket, 
            language, aspectRatio, lpData: finalData
          }
        };

        addToHistory(
          'landing_page',
          productName,
          historyPayload,
          `Marque: ${brand || 'N/A'} | Catégorie: ${category || 'Générique'}`,
          {
            productName,
            brand,
            category,
          }
        );
      } else {
        throw new Error(t('lpgImpossibleGenererContenuPertin', 'Impossible de générer un contenu pertinent, ou quota atteint. Réessayez.'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('lpgErreurGenerationVeuillezEssaye', 'Erreur de génération. Veuillez essayer de nouveau.'));
      const errorStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err) || "");
      const isQuota = 
        errorStr.includes("429") || 
        errorStr.includes("RESOURCE_EXHAUSTED") || 
        errorStr.includes("quota") ||
        errorStr.toLowerCase().includes("exceeded") ||
        errorStr.includes("QUOTA_EXCEEDED") ||
        err?.status === "RESOURCE_EXHAUSTED" ||
        errorStr.toLowerCase().includes("limit reached");
      
      if (isQuota || errorStr.includes("QUOTA_EXCEEDED")) {
        setError(t('lpgQuotaGeminiEpuiseL2', "Quota Gemini épuisé. L'API est surchargée ou vous avez atteint votre limite temporaire. Veuillez patienter 1 à 2 minutes avant de réessayer."));
      } else {
        setError(err.message || t('lpgUneErreurEstSurvenue2', 'Une erreur est survenue lors de la génération. Veuillez vérifier votre connexion et réessayer.'));
      }
    } finally {
      setLoading(false);
      saveCurrentSession();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t('lpgStructureCopieePressePapiers', 'Structure copiée dans le presse-papiers !'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(lpData, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `DzAds_Landing_${productName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(element);
    element.click();
    toast.success(t('lpgFichierJsonExporte', 'Fichier JSON exporté !'));
  };

  const updateSectionField = (index: number, field: string, value: any) => {
    if (!lpData) return;
    const newSections = [...lpData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setLpData({ ...lpData, sections: newSections });
  };

  const deleteSection = (index: number) => {
    if (!lpData) return;
    const newSections = lpData.sections.filter((_: any, idx: number) => idx !== index);
    setLpData({ ...lpData, sections: newSections });
  };

  const addSection = () => {
    if (!lpData) return;
    const newSection = {
      id: `custom-${Date.now()}`,
      step: `Section ${lpData.sections.length + 1} — NOUVELLE`,
      narrativeRole: '⚡ CONVERSION',
      title: 'قسم جديد مخصص للتحويل',
      content: 'اكتب محتوى القسم التسويقي الخاص بك هنا لجذب اهتمام زوار موقعك...',
      cta: {
        variations: [
          { text: 'اضغط هنا للطلب المباشر', type: 'direct' },
          { text: 'استفد من العرض اليوم', type: 'urgency' },
          { text: 'أريد الحصول على المنتج', type: 'benefit' }
        ],
        subtext: 'الدفع عند الاستلام | الشحن مجاني لـ 58 ولاية'
      },
      prompt: 'High resolution product commercial shot, clean design aesthetic --ar 16:9',
      badges: ['NOUVEAU', 'CONVERSION']
    };
    setLpData({ ...lpData, sections: [...lpData.sections, newSection] });
  };

  const handleCtaChange = (sectionIndex: number, variationIndex: number) => {
    if (!lpData) return;
    
    const section = lpData.sections[sectionIndex];
    if (!section.cta || !section.cta.variations) return;
    
    const newCtaText = section.cta.variations[variationIndex].text;
    
    // Update local state for selection index
    setSelectedCtaIndex(prev => ({ ...prev, [sectionIndex]: variationIndex }));

    // Prepare updated sections
    const newSections = [...lpData.sections];
    let newPrompt = section.prompt || '';
    
    // Use regex to replace the CTA text in the structured prompt
    // 1. CTA visible : "..."
    newPrompt = newPrompt.replace(/CTA visible : ".*?"/g, `CTA visible : "${newCtaText}"`);
    // 2. **CTA bouton :** "..."
    newPrompt = newPrompt.replace(/\*\*CTA bouton :\*\* ".*?"/g, `**CTA bouton :** "${newCtaText}"`);
    // 3. Pattern inside the Image Generator prompt "CTA: '...'"
    newPrompt = newPrompt.replace(/CTA: ".*?"/g, `CTA: "${newCtaText}"`);

    // Update section object
    newSections[sectionIndex] = { 
      ...section, 
      prompt: newPrompt,
      // Also update imagePrompt if structured fields exist
      imagePrompt: section.imagePrompt ? {
        ...section.imagePrompt,
        textInstructions: section.imagePrompt.textInstructions?.replace(/CTA: ".*?"/g, `CTA: "${newCtaText}"`) 
                          || section.imagePrompt.textInstructions
      } : section.imagePrompt
    };
    
    setLpData({ ...lpData, sections: newSections });
  };

  return (
    <div className="mixed-dir space-y-8">
      <PageHeader
        icon={Wand2}
        title={t('menuLanding', 'Landing pages')}
        subtitle={t('lpgStructurezPagesVenteMaximiser', 'Structurez vos pages de vente pour maximiser les commandes COD.')}
        actions={<>
          <div className="flex bg-fg/5 p-0.5 sm:p-1 rounded-lg sm:rounded-2xl border border-fg/10 shrink-0">
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2 text-xs sm:text-xs font-semibold transition-all rounded sm:rounded-xl whitespace-nowrap cursor-pointer",
                activeTab === 'editor' 
                  ? "bg-primary text-white shadow-lg shadow-dz-emerald/20" 
                  : "text-fg-muted hover:text-fg-muted"
              )}
            >
              <Zap className="size-2.5 sm:size-3.5" />
              <span>{t('lpgGenerateur', 'Générateur')}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2 text-xs sm:text-xs font-semibold transition-all rounded sm:rounded-xl whitespace-nowrap cursor-pointer",
                activeTab === 'history' 
                  ? "bg-primary text-white shadow-lg shadow-dz-emerald/20" 
                  : "text-fg-muted hover:text-fg-muted"
              )}
            >
              <History className="size-2.5 sm:size-3.5" />
              <span>{t('lpgHistory', 'Historique ({count})', { count: sessions.length })}</span>
            </button>
          </div>
          
          <button
            onClick={startNewSession}
            className="px-2 py-1 sm:p-2.5 bg-fg/5 hover:bg-fg/10 text-fg-muted hover:text-dz-emerald rounded-lg sm:rounded-2xl border border-fg/10 transition-all flex items-center gap-1 sm:gap-1.5 group cursor-pointer whitespace-nowrap shrink-0"
            title={t('lpgNouveauProjet', 'Nouveau projet')}
          >
            <Plus className="size-3 sm:size-4 group-hover:rotate-90 transition-transform" />
            <span className="text-xs sm:text-xs font-semibold">{t('lpgNouveau', 'Nouveau')}</span>
          </button>
        </>}
      />

      <AnimatePresence mode="wait">
        {activeTab === 'history' ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="ui-card p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-fg">{t('lpgVosArchivesStrategiques', 'Vos archives stratégiques')}</h2>
                  <p className="text-xs text-fg-muted">{t('lpgRetrouvezToutesStructuresLandi', 'Retrouvez toutes vos structures de landing pages passées.')}</p>
                </div>
                <div className="relative w-full max-w-md">
                  <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-fg-faint" size={16} />
                  <input 
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder={t('lpgRechercherParProduitMarque', 'Rechercher par produit, marque ou catégorie...')}
                    className="w-full bg-fg/5 border border-fg/10 rounded-2xl ps-12 pe-4 py-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50"
                  />
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-6 bg-fg/5 rounded-full">
                    <Archive size={48} className="text-fg-faint" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-fg font-bold">{t('lpgAucuneArchiveDisponible', 'Aucune archive disponible')}</p>
                    <p className="text-fg-faint text-sm">{t('lpgCommencezGenererStructuresVoir', 'Commencez à générer des structures pour les voir apparaître ici.')}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-dz-emerald/20"
                  >
                    {t('lpgCreerMaPremiereLp', 'Créer ma première LP')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions
                    .filter(s => {
                      const q = historySearch.toLowerCase();
                      return (s.title || '').toLowerCase().includes(q) ||
                        (s.state?.brand || '').toLowerCase().includes(q) ||
                        (s.state?.category || '').toLowerCase().includes(q);
                    })
                    .map((session) => (
                      <motion.div
                        key={session.id}
                        layoutId={session.id}
                        onClick={() => loadSession(session)}
                        className={cn(
                          "ui-card p-5 cursor-pointer group hover:border-dz-emerald/50 transition-all relative overflow-hidden",
                          currentSessionId === session.id ? "border-dz-emerald/50 ring-1 ring-dz-emerald/20" : "border-fg/10"
                        )}
                      >
                        <div className="flex flex-col h-full space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="p-2 bg-dz-emerald/10 rounded-xl text-dz-emerald">
                              <Layout size={20} />
                            </div>
                            <button
                              onClick={(e) => deleteSession(session.id, e)}
                              className="p-2 text-fg-faint hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="text-fg font-bold truncate group-hover:text-dz-emerald transition-colors tracking-tight text-sm">
                              {session.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-fg-muted font-semibold">
                                {session.state.brand || t('lpgMarqueInconnue', 'Marque inconnue')}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-fg/10" />
                              <span className="text-xs text-primary-ink font-semibold">
                                {session.state.category || "DIVERS"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-fg/5 mt-auto">
                            <div className="flex items-center gap-2">
                              <History size={12} className="text-fg-faint" />
                              <span className="text-xs text-fg-faint">
                                {formatDate(session.updatedAt, uiLanguage, { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <ChevronRight size={16} className="text-fg-faint group-hover:text-dz-emerald group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                        
                        {currentSessionId === session.id && (
                          <div className="absolute top-0 end-0 p-2">
                            <div className="bg-primary w-2 h-2 rounded-full shadow-lg shadow-dz-emerald/50" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col space-y-4"
          >
            {/* Mobile View Tab Switcher - Strictly for mobile screens (< lg), desktop stays untouched */}
            <div className="lg:hidden flex bg-black/60 p-0.5 sm:p-1 rounded-lg sm:rounded-2xl border border-fg/10 text-xs font-bold gap-0.5 sm:gap-1 shadow-xl sticky top-0 z-30">
              <button
                type="button"
                onClick={() => setMobileViewTab('settings')}
                className={`flex-1 py-1 sm:py-2.5 px-1.5 sm:px-3 rounded sm:rounded-xl transition-all flex items-center justify-center gap-1 text-xs sm:text-xs font-arabic ${
                  mobileViewTab === 'settings' 
                    ? 'bg-gradient-to-r from-dz-emerald to-dz-emerald text-fg font-bold shadow-md shadow-dz-emerald/20' 
                    : 'text-fg-muted hover:text-fg bg-fg/5'
                }`}
              >
                <Sparkles size={11} className={mobileViewTab === 'settings' ? 'text-yellow-300' : ''} />
                <span>{t('lpgN1ParametresProduitPrompt', '1. Paramètres du produit et prompt')}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewTab('result')}
                className={`flex-1 py-1 sm:py-2.5 px-1.5 sm:px-3 rounded sm:rounded-xl transition-all flex items-center justify-center gap-1 text-xs sm:text-xs font-arabic ${
                  mobileViewTab === 'result' 
                    ? 'bg-gradient-to-r from-dz-emerald to-dz-emerald text-fg font-bold shadow-md shadow-dz-emerald/20' 
                    : 'text-fg-muted hover:text-fg bg-fg/5'
                }`}
              >
                <Layout size={11} className={mobileViewTab === 'result' ? 'text-dz-emerald' : ''} />
                <span>{t('lpgTabPreview')} {lpData?.sections?.length ? `(${lpData.sections.length})` : ''}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8">
              <div className={`lg:col-span-5 ui-card p-3 sm:p-6 space-y-3 sm:space-y-6 h-fit ${mobileViewTab === 'settings' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center gap-2.5 mb-1 sm:mb-2">
            <div className="p-1.5 bg-dz-emerald/10 rounded-lg text-dz-emerald shrink-0">
              <Sparkles size={16} className="sm:size-[18px]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-fg">{t('lpgParametresProduit', 'Paramètres du Produit')}</h2>
          </div>
          <div className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium relative group"
              >
                <button 
                  onClick={() => setError(null)}
                  className="absolute top-2 end-2 opacity-20 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
                <p className="pe-6">{error}</p>
              </motion.div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-fg-muted">
                    {t('lpgImagesProduitJusqu5', "Images du produit (jusqu'à 5 pour une analyse complète)")}
                  </label>
                  {imagePreviews.length > 0 && (
                    <span className="text-xs font-semibold bg-dz-emerald/20 text-dz-emerald px-2 py-0.5 rounded-full border border-dz-emerald/30">
                      {t('lpgImageCount', undefined, { count: imagePreviews.length })}
                    </span>
                  )}
                </div>
                {imagePreviews.length > 0 && (
                  <button
                    type="button"
                    onClick={removeAllImages}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {t('lpgToutEffacer', 'Tout effacer')}
                  </button>
                )}
              </div>
              
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative overflow-hidden border-2 border-dashed rounded-xl sm:rounded-2xl transition-all duration-300 p-2 sm:p-4 ${
                  isDragging ? 'border-dz-emerald bg-dz-emerald/10 scale-[1.01] shadow-2xl shadow-dz-emerald/20' : 
                  imagePreviews.length > 0 ? 'border-dz-emerald/30 bg-fg/[0.04] shadow-xl shadow-black/50' : 'border-fg/5 hover:border-dz-emerald/30 bg-fg/5 cursor-pointer'
                } ${(analyzing || completingAnalysis) ? 'opacity-80 cursor-wait' : ''}`}
                onClick={() => {
                  if (imagePreviews.length === 0 && !analyzing && !completingAnalysis) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {/* Background Shimmer Effect */}
                <div className="absolute inset-0 bg-linear-to-br from-dz-emerald/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />
                
                {analyzing && (
                  <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center gap-2 sm:gap-4 p-2">
                    <div className="relative">
                      <Loader2 className="animate-spin text-dz-emerald size-6 sm:size-8" />
                      <div className="absolute inset-0 blur-lg bg-dz-emerald/20 animate-pulse" />
                    </div>
                    <div className="text-center space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-xs font-semibold text-fg animate-pulse">{t('lpgAnalysingImages', undefined, { count: imagePreviews.length })}</p>
                      <p className="text-xs sm:text-xs text-fg-muted font-bold tracking-tighter">{t('lpgExtractionDetailsAnglesMarketi', 'Extraction des détails et des angles marketing tendance')}</p>
                    </div>
                  </div>
                )}

                {completingAnalysis && (
                  <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center gap-2 sm:gap-4 p-2">
                    <div className="relative">
                      <Loader2 className="animate-spin text-blue-400 size-6 sm:size-8" />
                      <div className="absolute inset-0 blur-lg bg-blue-400/20 animate-pulse" />
                    </div>
                    <div className="text-center space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-xs font-semibold text-fg animate-pulse">{t('lpgOptimisationEtape2', 'Optimisation (Étape 2)...')}</p>
                      <p className="text-xs sm:text-xs text-fg-muted font-bold tracking-tighter">{t('lpgCreationStructureSelonL', "Création de la structure selon l'angle choisi")}</p>
                    </div>
                  </div>
                )}

                {imagePreviews.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-3 relative z-10">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group/img aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-black/60 border border-fg/10 shadow-lg">
                          <img 
                            src={preview} 
                            alt={`Product preview ${index + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                          />
                          
                          {/* Always-visible Main Photo Badge if index === 0 */}
                          <div className="absolute top-1 start-1 sm:top-2 sm:start-2 z-10 group-hover/img:opacity-0 transition-opacity">
                            <span className={`text-xs sm:text-xs font-semibold px-1.5 py-0.5 sm:px-2 rounded-md sm:rounded-lg shadow-md flex items-center gap-0.5 sm:gap-1 font-arabic ${
                              index === 0 
                                ? 'bg-primary text-white font-extrabold border border-dz-emerald' 
                                : 'bg-black/80 text-fg-muted border border-fg/10'
                            }`}>
                              {index === 0 ? t('lpgPrincipale', 'Principale') : `#${index + 1}`}
                            </span>
                          </div>

                          {/* Hover action bar for quick controls */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity p-1 sm:p-2 flex flex-col justify-between z-20">
                            <div className="flex items-center justify-between">
                              {index > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMainImage(index);
                                  }}
                                  className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-xs rounded sm:rounded-lg shadow-md flex items-center gap-0.5 font-arabic transition-all"
                                  title={t('lpgDefinirCommeImagePrincipale', 'Définir comme image principale de la page')}
                                >
                                  <Star size={8} className="fill-white" />
                                  <span>{t('lpgPrincipale', 'Principale')}</span>
                                </button>
                              ) : (
                                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-primary text-white font-semibold text-xs sm:text-xs rounded sm:rounded-lg shadow-md flex items-center gap-0.5 font-arabic">
                                  <Star size={8} className="fill-white" />
                                  <span>{t('lpgPrincipale', 'Principale')}</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(index);
                                }}
                                className="p-1 sm:p-1.5 bg-red-500/80 hover:bg-red-600 text-fg hover:text-white rounded sm:rounded-lg transition-all shadow-md"
                                title={t('lpgSupprimerCetteImage', 'Supprimer cette image')}
                              >
                                <X size={10} />
                              </button>
                            </div>

                            {/* Move Left / Move Right buttons for instant swapping */}
                            <div className="flex items-center justify-between bg-black/80 rounded-lg p-0.5 sm:p-1 border border-fg/10">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveImage(index, 'left');
                                }}
                                className="p-0.5 sm:p-1 bg-fg/10 hover:bg-dz-emerald/50 text-fg disabled:opacity-20 rounded transition-all"
                                title={t('lpgDeplacerVersGauche', 'Déplacer vers la gauche')}
                              >
                                <ArrowLeft size={10} />
                              </button>

                              <span className="text-xs sm:text-xs text-dz-emerald font-semibold">#{index + 1}</span>

                              <button
                                type="button"
                                disabled={index === imagePreviews.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveImage(index, 'right');
                                }}
                                className="p-0.5 sm:p-1 bg-fg/10 hover:bg-dz-emerald/50 text-fg disabled:opacity-20 rounded transition-all"
                                title={t('lpgDeplacerVersDroite', 'Déplacer vers la droite')}
                              >
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {imagePreviews.length < 5 && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed border-dz-emerald/30 hover:border-dz-emerald bg-dz-emerald/5 hover:bg-dz-emerald/10 flex flex-col items-center justify-center p-1 sm:p-2 cursor-pointer transition-all text-dz-emerald group/add"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-dz-emerald/20 flex items-center justify-center group-hover/add:scale-110 transition-transform">
                            <Plus size={14} className="sm:size-[18px]" />
                          </div>
                          <span className="text-xs sm:text-xs font-semibold mt-0.5 sm:mt-1 text-center">{t('lpgAjouterImage', 'Ajouter une image')}</span>
                          <span className="text-xs sm:text-xs text-fg-muted">{t('lpgImagesLeft', undefined, { count: 5 - imagePreviews.length })}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-xs text-fg-muted pt-1 border-t border-fg/5 px-1">
                      <span>{t('lpgAnalysedCount', undefined, { count: imagePreviews.length })}</span>
                      {imagePreviews.length < 5 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-dz-emerald hover:underline font-bold"
                        >
                          {t('lpgAjouter', '+ Ajouter')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 text-center p-3 sm:p-6 space-y-1.5 sm:space-y-3">
                    <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-linear-to-br from-dz-emerald/20 to-dz-emerald/5 border border-dz-emerald/20 flex items-center justify-center text-dz-emerald mx-auto shadow-xl group-hover/dropzone:scale-110 transition-transform duration-300">
                      <ImageIcon className="size-4 sm:size-7" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-xs font-semibold text-fg">{t('lpgGlissezJusqu5Images', "Glissez jusqu'à 5 images de votre produit ici")}</p>
                      <p className="text-xs sm:text-xs text-fg-muted font-bold leading-tight sm:leading-relaxed max-w-[280px] mx-auto">
                        {t('lpgLIaAnalyseraTous', "L'IA analysera tous les angles et détails pour en tirer la meilleure stratégie marketing")}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-dz-emerald/10 border border-dz-emerald/20 rounded-full text-xs sm:text-xs text-dz-emerald font-semibold">
                      <Sparkles size={9} className="sm:size-[10px]" />
                      <span>{t('lpgAnalyse360SousPlusieurs', "Analyse 360° sous plusieurs angles (jusqu'à 5 images)")}</span>
                    </div>
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleImageChange}
                  className="hidden" 
                />
              </div>
            </div>

            {pendingAngleSelection && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-bg border-2 border-blue-500 rounded-2xl space-y-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-fg animate-fade-in relative overflow-hidden"
              >
                {/* Decorative background gradients */}
                <div className="absolute top-0 end-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 start-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col items-center text-center space-y-2 relative z-10">
                  <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-1">
                    <Sparkles size={12} className="animate-pulse text-blue-400" />
                    {t('lpgEtape2DefinirL', "Étape 2 : définir l'angle marketing du produit")}
                  </div>
                  <h3 className="text-sm font-bold text-fg tracking-wide">
                    {t('lpgChoisissezMeilleurePerspective', 'Choisissez la meilleure perspective pour votre produit :')}
                  </h3>
                  <p className="text-xs text-fg-muted max-w-md leading-relaxed">
                    {t('lpgAngleExplain')}
                  </p>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3 flex gap-3 items-start relative z-10">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <Target size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-blue-300">{t('lpgCommentChoisirGuideRapide', 'Comment choisir ? (guide rapide)')}</p>
                    <p className="text-xs text-fg-muted leading-normal">
                      <RichText text={t('lpgAngleExample')} strongClassName="text-fg" />
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pe-1 relative z-10 scrollbar-thin scrollbar-thumb-white/10">
                  {suggestedNicheAngles.map((n) => {
                    let IconComponent = Sparkles;
                    let iconColorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                    let hoverGlowClass = "hover:border-blue-400 hover:shadow-blue-500/10";
                    
                    const iName = n.icon?.toLowerCase();
                    if (iName === 'car') {
                      IconComponent = Car;
                      iconColorClass = "text-sky-400 bg-sky-500/10 border-sky-500/20";
                      hoverGlowClass = "hover:border-sky-400 hover:shadow-sky-500/10";
                    } else if (iName === 'bus') {
                      IconComponent = Bus;
                      iconColorClass = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                      hoverGlowClass = "hover:border-cyan-400 hover:shadow-cyan-500/10";
                    } else if (iName === 'plane') {
                      IconComponent = Plane;
                      iconColorClass = "text-dz-emerald bg-primary/10 border-dz-emerald/20";
                      hoverGlowClass = "hover:border-dz-emerald hover:shadow-primary/10";
                    } else if (iName === 'home') {
                      IconComponent = Home;
                      iconColorClass = "text-dz-emerald bg-dz-emerald/10 border-dz-emerald/20";
                      hoverGlowClass = "hover:border-dz-emerald hover:shadow-dz-emerald/10";
                    } else if (iName === 'briefcase') {
                      IconComponent = Briefcase;
                      iconColorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                      hoverGlowClass = "hover:border-amber-400 hover:shadow-amber-500/10";
                    } else if (iName === 'heart') {
                      IconComponent = Heart;
                      iconColorClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                      hoverGlowClass = "hover:border-rose-400 hover:shadow-rose-500/10";
                    } else if (iName === 'flame') {
                      IconComponent = Flame;
                      iconColorClass = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                      hoverGlowClass = "hover:border-orange-400 hover:shadow-orange-500/10";
                    }

                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNicheAngleAndComplete(n.id);
                        }}
                        className={`p-3.5 bg-slate-900/90 border border-line text-fg rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] group/btn shadow-md hover:bg-slate-800/80 cursor-pointer ${hoverGlowClass}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover/btn:scale-110 ${iconColorClass}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="text-start flex-1 min-w-0">
                          <p className="text-[12px] font-bold font-arabic leading-snug text-fg group-hover/btn:text-blue-200 truncate">
                            {n.label}
                          </p>
                          <p className="text-xs text-fg-muted font-medium truncate">
                            {n.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center pt-2 flex justify-center relative z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingAngleSelection(false);
                    }}
                    className="text-xs font-bold text-fg-muted hover:text-fg transition-colors bg-fg/5 hover:bg-fg/10 px-5 py-2 rounded-full border border-fg/10 cursor-pointer"
                  >
                    {t('lpgPasserLEtapeUtiliser', "Passer l'étape et utiliser les valeurs génériques")}
                  </button>
                </div>
              </motion.div>
            )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PromptField
                  label={t('lpgNomProduitFrancaisPrompt', 'Nom du produit (Français) / Prompt')}
                  icon={<Package size={12} className="text-dz-emerald" />}
                  value={productName}
                  onChange={setProductName}
                  placeholder={t('lpgExHachoirPro3000w', 'Ex: Hachoir Pro 3000w - Le hacheur multifonction ultime')}
                  badgeText={t('shBadgePrompt', 'PROMPT')}
                />

                <PromptField
                  label={t('lpgNomProduitArabeDarija', 'Nom du produit (Arabe/Darija)')}
                  icon={<Languages size={12} className="text-blue-500" />}
                  value={productNameAr}
                  onChange={setProductNameAr}
                  placeholder={t('lpgNomCompletProduitEx', 'Nom complet du produit (ex : hachoir électrique professionnel - original)')}
                  dir="rtl"
                  badgeText={t('lpgBadgeDarija', 'DARIJA')}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PromptField
                  label={t('lpgImageMarqueMarque', 'Image de marque / Marque')}
                  icon={<Flag size={12} className="text-dz-emerald" />}
                  value={brand}
                  onChange={setBrand}
                  placeholder={t('lpgExSilvercrestTibaImportation', "Ex: SilverCrest, Tiba, ou 'Importation Premium'")}
                />

                <PromptField
                  label={t('lpgCategorieMarche', 'Catégorie de Marché')}
                  icon={<Tag size={12} className="text-dz-emerald" />}
                  value={category}
                  onChange={setCategory}
                  placeholder={t('lpgExCuisineMaisonBeaute', 'Ex: Cuisine & Maison, Beauté, Bricolage...')}
                />
             </div>

             <PromptField
                label={t('lpgFormatProduitBundlePack', 'Format du Produit (Bundle / Pack)')}
                icon={<Layout size={12} className="text-dz-emerald" />}
                value={productType}
                onChange={setProductType}
                placeholder={t('lpgExAppareilElectromenagerPack', 'Ex: Appareil Électroménager, Pack de 2-3 pièces, Kit complet avec accessoires...')}
             />

             <PromptField
                label={t('lpgPublicCibleAvatarClient', 'Public cible & avatar client idéal')}
                icon={<User size={12} className="text-orange-400" />}
                value={targetAudience}
                onChange={setTargetAudience}
                placeholder={t('lpgExFemmesFoyer30', 'Ex: Femmes au foyer (30-50 ans), Jeunes technophiles, Amateurs de cuisine...')}
             />

             <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-semibold text-fg-muted">{t('lpgPaletteCouleursHex', 'Palette de Couleurs (HEX)')}</label>
                  <div className="flex items-center gap-2">
                    {colorPalette.split(',').map((c, i) => (
                      <div 
                        key={i} 
                        className="w-3 h-3 rounded-full border border-fg/20 shadow-sm"
                        style={{ backgroundColor: c.trim() }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PALETTE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPalette(p)}
                      className={cn(
                        "p-2 rounded-xl border transition-all flex flex-col items-center gap-1.5 group relative overflow-hidden",
                        selectedPaletteId === p.id 
                          ? "bg-fg/10 border-fg/20 ring-1 ring-fg/20" 
                          : "bg-fg/5 border-fg/5 hover:bg-fg/10 hover:border-fg/10"
                      )}
                    >
                      <div className="flex -space-x-1">
                        {p.colors.map((c, idx) => (
                          <div 
                            key={idx} 
                            className="w-4 h-4 rounded-full border border-black/40 ring-1 ring-fg/10 shadow-lg" 
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className={cn(
                        "text-xs font-semibold tracking-tighter transition-colors text-center px-1",
                        selectedPaletteId === p.id ? "text-fg" : "text-fg-muted group-hover:text-fg-muted"
                      )}>
                        {tf(p.label)}
                      </span>
                      {selectedPaletteId === p.id && (
                        <motion.div 
                          layoutId="activePalette"
                          className="absolute inset-0 bg-fg/5 pointer-events-none"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input 
                    value={colorPalette}
                    onChange={(e) => {
                      setColorPalette(e.target.value);
                      setSelectedPaletteId(null);
                    }}
                    placeholder={t('lpgEx000000Ffd700Ffffff', 'Ex : #000000, #FFD700, #FFFFFF')}
                    className="w-full bg-fg/5 border border-fg/10 rounded-xl px-4 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all placeholder:text-fg-faint pe-10"
                  />
                  <div className="absolute end-3 top-1/2 -translate-y-1/2 text-fg-faint">
                    <Palette size={14} />
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-fg-muted ms-1">{t('lpgStrategieFunnelFramework', 'Stratégie de Funnel (Framework)')}</label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { id: 'AIDA', label: 'AIDA', desc: 'Attention/Désir' },
                  { id: 'PAS', label: 'PAS', desc: 'Problème/Solution' },
                  { id: 'FAB', label: 'FAB', desc: 'Bénéfices/Vantage' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFunnelStrategy(s.id)}
                    className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                      funnelStrategy === s.id 
                        ? 'bg-primary border-dz-emerald text-white shadow-lg' 
                        : 'bg-fg/5 border-fg/10 text-fg-muted hover:bg-fg/10'
                    }`}
                  >
                    <span className="text-xs sm:text-xs font-semibold">{s.label}</span>
                    <span className="text-xs sm:text-xs tracking-tighter opacity-60 text-center truncate w-full">{tf(s.desc)}</span>
                  </button>
                ))}
              </div>
            </div>

            <PromptField
              label={t('lpgPointsFortsStrategiquesPar', 'Points Forts Stratégiques (Un par ligne)')}
              icon={<Target size={12} className="text-dz-emerald" />}
              value={sellingPoints}
              onChange={setSellingPoints}
              placeholder={t('lpgExLamesAcierInoxydable', 'Ex: Lames en acier inoxydable 304\nNettoyage ultra-rapide\nMoteur silencieux & puissant')}
              isTextArea
              rows={3}
              badgeText={t('lpgBadgeBenefits', 'BÉNÉFICES')}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-fg-muted ms-1 flex items-center gap-2">
                  <Sparkles size={10} className="text-blue-500" />
                  {t('lpgAngleMarketingPsychologieVente', 'Angle Marketing (Psychologie de vente)')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Luxe Accessible', label: 'Luxe', desc: 'Prestige' },
                    { id: 'Urgence maximale', label: 'Urgence', desc: 'Dernière chance' },
                    { id: 'Solution miracle', label: 'Solution', desc: 'Résout un problème' },
                    { id: 'Confiance & Famille', label: 'Confiance', desc: 'Confiance/Famille' },
                    { id: 'Style & Tendance', label: 'Tendance', desc: 'Tendance/Ambiance' },
                    { id: 'Économie / Offre Or', label: 'Promo', desc: 'Meilleur prix' }
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setMarketingAngle(a.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                        marketingAngle === a.id 
                          ? 'bg-blue-500 border-blue-400 text-white shadow-lg' 
                          : 'bg-fg/5 border-fg/10 text-fg-muted hover:bg-fg/10'
                      }`}
                    >
                      <span className="text-xs font-semibold">{tf(a.label)}</span>
                      <span className="text-xs tracking-tighter opacity-60 text-center">{tf(a.desc)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <PromptField
                label={t('lpgJustificationAnglePrecisAccroc', 'Justification / angle précis (accroche)')}
                icon={<PenTool size={12} className="text-blue-500" />}
                value={marketingAngle}
                onChange={setMarketingAngle}
                placeholder={t('lpgExIdealFamillesNombreuses', 'Ex: Idéal pour les familles nombreuses qui veulent gagner du temps en cuisine...')}
                isTextArea
                rows={2}
                badgeText={t('lpgBadgeHook', 'ACCROCHE')}
              />
            </div>

            <PromptField
              label={t('lpgContexteMarketingBriefPrompt', 'Contexte marketing / brief (prompt)')}
              icon={<MessageSquare size={12} className="text-dz-emerald" />}
              value={description}
              onChange={setDescription}
              placeholder={t('lpgExCEstHachoir', "Ex: C'est le hachoir le plus puissant du marché algérien cette année, disponible en promo exclusive...")}
              isTextArea
              rows={3}
              badgeText={t('lpgBadgeBriefing', 'BRIEFING')}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-fg/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-blue-500/10 rounded-lg text-blue-400">
                <Palette size={14} />
              </div>
              <label className="text-xs font-semibold text-fg-muted">{t('lpgStyleVisuelImagesIa', 'Style Visuel des Images (IA)')}</label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'Lifestyle', label: 'Lifestyle', desc: 'Usage quotidien' },
                { id: 'Minimalist', label: 'Minimaliste', desc: 'Épuré & Zen' },
                { id: 'High-Tech', label: 'High-Tech', desc: 'Futuriste / Pro' },
                { id: 'Creative', label: 'Créatif', desc: 'Artistique / Wow' },
                { id: 'Natural', label: 'Naturel', desc: 'Extérieur / Bio' },
                { id: 'Studio', label: 'Studio', desc: 'Produit Pur' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setVisualStyle(style.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                    visualStyle === style.id 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                      : 'bg-fg/5 border-fg/10 text-fg-muted hover:bg-fg/10'
                  }`}
                >
                  <span className="text-xs font-semibold">{tf(style.label)}</span>
                  <span className="text-xs tracking-tighter opacity-60 text-center">{tf(style.desc)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-fg/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-dz-emerald/10 rounded-lg text-dz-emerald">
                <Layout size={14} />
              </div>
              <label className="text-xs font-semibold text-fg-muted">{t('lpgFormatVisuelsStrategiquesAi', 'Format des visuels stratégiques (AI)')}</label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: '16:9', label: 'Paysage', sub: 'Desktop', icon: Monitor },
                { id: '1:1', label: 'Carré', sub: 'Insta/FB', icon: SquareIcon },
                { id: '4:5', label: 'Portrait', sub: 'Feed Ads', icon: Maximize },
                { id: '9:16', label: 'Story', sub: 'TikTok/Reels', icon: Smartphone }
              ].map((ratio) => {
                const Icon = ratio.icon;
                return (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl flex flex-col items-center gap-1.5 sm:gap-2 transition-all border group relative ${
                      aspectRatio === ratio.id
                        ? 'bg-primary border-dz-emerald text-white shadow-xl shadow-dz-emerald/20'
                        : 'bg-fg/5 border-fg/10 text-fg-muted hover:bg-fg/10'
                    }`}
                  >
                    <Icon size={16} className={aspectRatio === ratio.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold leading-none">{ratio.id}</span>
                      <span className="text-xs tracking-tighter opacity-60 mt-0.5 font-bold">{tf(ratio.label)}</span>
                    </div>
                    {aspectRatio === ratio.id && (
                      <motion.div 
                        layoutId="activeRatio"
                        className="absolute inset-0 bg-fg/10 rounded-2xl pointer-events-none"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-fg-faint italic text-center">{t('lpgTousPromptsDImages', "Tous les prompts d'images seront optimisés pour ce ratio.")}</p>
          </div>

          <div className="pt-4 border-t border-fg/5">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-3 py-2 bg-fg/5 hover:bg-fg/10 rounded-xl transition-all group flex-1"
              >
                <Settings2 size={16} className="text-fg-muted group-hover:text-dz-emerald transition-colors" />
                <span className="text-xs font-semibold text-fg-muted">{t('lpgParametresAvances', 'Paramètres Avancés')}</span>
                <ChevronDown size={14} className={`text-fg-faint ms-auto transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              {showAdvanced && (
                <button 
                  onClick={resetAdvanced}
                  className="ms-2 p-2 text-fg-faint hover:text-red-400 transition-colors"
                  title={t('pbReset', 'Réinitialiser')}
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-1">
                    {/* Sections */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 ms-1">
                        <ListOrdered size={10} className="text-dz-emerald" />
                        <label className="text-xs font-semibold text-fg-muted">{t('lpgSections', 'Sections')}</label>
                      </div>
                      <input 
                        type="number"
                        min={3}
                        max={12}
                        value={numSections}
                        onChange={(e) => setNumSections(parseInt(e.target.value))}
                        className="w-full bg-fg/5 border border-fg/10 rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all"
                      />
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 ms-1">
                        <Mic2 size={10} className="text-purple-400" />
                        <label className="text-xs font-semibold text-fg-muted">{t('lpgTonStyle', 'Ton / style')}</label>
                      </div>
                      <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full bg-fg/5 border border-fg/10 rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all appearance-none"
                      >
                        <option value="Vendeur / Persuasif">📣 Persuasif</option>
                        <option value="Sophistiqué / Luxe">{t('lpgLuxeElite', 'Luxe / Élite')}</option>
                        <option value="Urgent / Direct">⚡ Flash / Urgence</option>
                        <option value="Amical / Proche">🤝 Familier</option>
                        <option value="Technique / Expert">🔬 Expert / Scientifique</option>
                        <option value="Minimaliste">🌑 Minimal</option>
                      </select>
                    </div>

                    {/* Design Style */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 ms-1">
                        <Palette size={10} className="text-blue-400" />
                        <label className="text-xs font-semibold text-fg-muted">{t('lpgStyleDesign', 'Style de design')}</label>
                      </div>
                      <select 
                        value={designStyle}
                        onChange={(e) => setDesignStyle(e.target.value)}
                        className="w-full bg-fg/5 border border-fg/10 rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all appearance-none"
                      >
                        <option value="Moderne / Minimaliste">{t('lpgModerne', 'Moderne')}</option>
                        <option value="Brutalisme / Bold">{t('lpgBrutaliste', 'Brutaliste')}</option>
                        <option value="Apple Style / Clean">{t('lpgAppleEpure', 'Apple épuré')}</option>
                        <option value="Retro / Vintage">{t('lpgVintage', 'Vintage')}</option>
                        <option value="Web3 / Futuriste">{t('lpgFuturiste', 'Futuriste')}</option>
                        <option value="DTC / Coloré">{t('lpgDtcDynamique', 'DTC dynamique')}</option>
                      </select>
                    </div>

                    {/* Page Type */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 ms-1">
                        <Layout size={10} className="text-orange-400" />
                        <label className="text-xs font-semibold text-fg-muted">{t('lpgTypePage', 'Type de Page')}</label>
                      </div>
                      <select 
                        value={pageType}
                        onChange={(e) => setPageType(e.target.value)}
                        className="w-full bg-fg/5 border border-fg/10 rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all appearance-none"
                      >
                        <option value="Landing Page Classique">{t('lpgLPClassique', 'L.P. classique')}</option>
                        <option value="Page de Vente Longue">{t('lpgPageVente', 'Page de vente')}</option>
                        <option value="Page de Capture (Lead)">{t('lpgPageCapture', 'Page de capture')}</option>
                        <option value="Advertorial / Article">{t('lpgAdvertorial', 'Advertorial')}</option>
                        <option value="One Page Checkout">{t('lpgPagePaiement', 'Page de paiement')}</option>
                      </select>
                    </div>

                    {/* Market */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 ms-1">
                        <Target size={10} className="text-red-400" />
                        <label className="text-xs font-semibold text-fg-muted">{t('lpgMarcheCible', 'Marché Cible')}</label>
                      </div>
                      <select 
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        className="w-full bg-fg/5 border border-fg/10 rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all appearance-none"
                      >
                        <option value="Algérie (58 wilayas)">{t('lpgAlgerie', 'Algérie')}</option>
                        <option value="Maroc">🇲🇦 Maroc</option>
                        <option value="Tunisie">🇹🇳 Tunisie</option>
                        <option value="France / Europe">🇪🇺 France / Europe</option>
                        <option value="Sénégal / Côte d'Ivoire">🌍 Afrique Ouest</option>
                        <option value="GCC (Arabie, UAE)">🇸🇦 GCC / Moyen Orient</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 ms-1">
                        <Languages size={10} className="text-sky-400" />
                        <label className="text-xs font-semibold text-fg-muted">{t('lpgLangue', 'Langue')}</label>
                      </div>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-fg/5 border border-fg/10 rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all appearance-none"
                      >
                        <option value="Arabe / Darija Algérienne">🇩🇿 Arabe / Darija</option>
                        <option value="Français">{t('lpgFrancais', 'Français')}</option>
                        <option value="Anglais">🇺🇸 Anglais</option>
                        <option value="Arabe Littéraire">🇸🇦 Arabe Classique</option>
                        <option value="Mixte (Français/Darija)">🗣️ Mixte Fr/Dz</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !productName}
            className="w-full btn-dz-primary"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform animate-pulse text-yellow-300" />
                <span>{t('lpgGenererLandingPageMagique', 'Générer la landing page magique')}</span>
              </>
            )}
          </button>
        </div>

        <div className={`lg:col-span-7 ui-card flex flex-col min-h-[350px] sm:min-h-[450px] overflow-hidden ${mobileViewTab === 'result' ? 'block' : 'hidden lg:block'}`}>
          <div className="p-2.5 sm:p-4 border-b border-fg/10 bg-fg/5 flex flex-wrap gap-2 sm:gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-xs font-bold text-fg-muted">{t('lpgStructureLandingPage', 'Structure de la landing page')}</span>
              {lpData && (
                <div className="flex bg-fg/[0.04] p-0.5 rounded-lg border border-fg/5 text-xs sm:text-xs font-bold">
                  <button 
                    onClick={() => setLayoutMode('structure')}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded transition-all ${layoutMode === 'structure' ? 'bg-primary text-white font-bold' : 'text-fg-muted hover:text-fg-muted font-bold'}`}
                  >
                    {t('lpgEditeurStructure', 'Éditeur de structure')}
                  </button>
                  <button 
                    onClick={() => setLayoutMode('mockup')}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded transition-all ${layoutMode === 'mockup' ? 'bg-primary text-white font-bold' : 'text-fg-muted hover:text-fg-muted font-bold'}`}
                  >
                    {t('vidMaquetteLive', 'Maquette live')}
                  </button>
                  <button 
                    onClick={() => setLayoutMode('page')}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded transition-all ${layoutMode === 'page' ? 'bg-primary text-white font-bold' : 'text-fg-muted hover:text-fg-muted font-bold'}`}
                  >
                    {t('lppTab', 'Page prête')}
                  </button>
                </div>
              )}
            </div>
            {result && (
              <div className="flex gap-1.5 sm:gap-2">
                <button 
                  onClick={handleExport}
                  className="text-fg-muted hover:text-fg transition-colors flex items-center gap-1 text-xs sm:text-xs bg-fg/5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-fg/10"
                >
                  <Download size={12} className="sm:size-[14px]" />
                  {t('vidExporter', 'Exporter')}
                </button>
                <button 
                  onClick={handleCopy}
                  className="text-fg-muted hover:text-fg transition-colors flex items-center gap-1 text-xs sm:text-xs bg-fg/5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-fg/10"
                >
                  {copied ? <Check size={12} className="text-dz-emerald sm:size-[14px]" /> : <Copy size={12} className="sm:size-[14px]" />}
                  {copied ? t('vidCopie', 'Copié') : t('copy', 'Copier')}
                </button>
              </div>
            )}
          </div>
          <div className="p-3 sm:p-6 md:p-8 flex-1 text-fg-muted overflow-y-auto leading-relaxed markdown-body">
            {lpData ? (
              <AnimatePresence mode="wait">
                {layoutMode === 'page' ? (
                  <motion.div key="ready-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <Suspense fallback={<div className="grid place-items-center p-10"><Loader2 className="animate-spin text-fg-faint" size={20} /></div>}>
                      <LandingPublisher lpData={lpData} productName={productNameAr || productName} photos={imagePreviews} language={language} />
                    </Suspense>
                  </motion.div>
                ) : layoutMode === 'mockup' ? (
                  <motion.div
                    key="visual-mockup"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LPVisualMockup 
                      productName={productNameAr || productName}
                      sections={lpData.sections}
                      colorPalette={lpData.colorPalette}
                      imagePreview={imagePreview}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="structure-editor"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-4 sm:space-y-6">
                      {imagePreview && (
                        <div className="relative w-full aspect-[16/7] sm:aspect-[16/6] rounded-xl sm:rounded-2xl bg-linear-to-br from-dz-emerald/10 via-purple-500/5 to-transparent border border-fg/10 overflow-hidden mb-4 sm:mb-8 group/hero-preview">
                          <div className="absolute inset-0 bg-dz-emerald/5 blur-3xl rounded-full scale-75 opacity-50 flex items-center justify-center p-4 sm:p-8 z-0" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent z-10" />
                          
                          <div className="relative z-20 w-full h-full flex items-center justify-center p-3 sm:p-6">
                             <img 
                              src={imagePreview} 
                              alt={t('lpgProduitAnalyse', 'Produit analysé')} 
                              className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover/hero-preview:scale-105 transition-transform duration-300" 
                            />
                          </div>
                          
                          <div className="absolute bottom-2 start-3 sm:bottom-4 sm:start-6 z-30 flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                              <Sparkles size={12} className="sm:size-[14px]" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-xs font-semibold text-fg">{lpData.productName}</p>
                              <p className="text-xs sm:text-xs text-fg-muted font-bold tracking-tighter">{t('lpgVisuelHeroSelectionne', 'Visuel hero sélectionné')}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-start justify-between border-b border-fg/5 pb-3 sm:pb-6 gap-3">
                        <div className="flex min-w-0 flex-1 basis-64 flex-col">
                          <h2 className="text-lg sm:text-2xl font-bold text-fg tracking-tight break-words">{lpData.productName}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 sm:mt-1">
                            <span className="text-xs text-fg-muted">{t('lpgParcoursConversionDz', 'Parcours de conversion DZ')}</span>
                            <div className="w-1 h-1 rounded-full bg-dz-emerald/40" />
                            <span className="text-xs text-primary-ink font-semibold">{t('lpgSectionsCount', '{count} sections', { count: lpData.sections.length })}</span>
                          </div>
                        </div>
                        <div className="flex items-center sm:items-end gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                          <span className="px-2 py-0.5 bg-dz-emerald/10 text-dz-emerald rounded text-xs sm:text-xs font-bold border border-dz-emerald/20">
                             {t('lpgStructureStrategique', 'Structure Stratégique')}
                          </span>
                          {lpData.colorPalette && (
                            <div className="flex items-center gap-2 sm:gap-3 bg-fg/5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-fg/10 group/colors">
                               <div className="flex -space-x-1">
                                 {lpData.colorPalette?.map((c: string, idx: number) => (
                                   <div 
                                     key={idx} 
                                     className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-black/40 ring-1 ring-fg/20 shadow-lg cursor-help relative group/swatch" 
                                     style={{ backgroundColor: c }}
                                     title={c}
                                   >
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/swatch:opacity-100 transition-opacity pointer-events-none bg-black text-xs px-2 py-1 rounded whitespace-nowrap border border-fg/10 z-50">
                                        {c}
                                      </div>
                                   </div>
                                 ))}
                               </div>
                               <div className="w-px h-3 bg-fg/10" />
                               <button
                                 onClick={() => {
                                   navigator.clipboard.writeText(lpData.colorPalette.join(', '));
                                 }}
                                 className="text-xs sm:text-xs text-fg-faint font-semibold hover:text-dz-emerald transition-colors flex items-center gap-1"
                               >
                                  <Copy size={9} className="sm:size-[10px]" /> <span className="hidden sm:inline">{t('lpgCopierPalette', 'Copier la palette')}</span>
                               </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {lpData.generalNotes && (
                        <div className="p-3 sm:p-4 bg-fg/5 border border-fg/10 rounded-xl sm:rounded-2xl">
                            <p className="text-xs sm:text-xs font-semibold text-primary-ink mb-1 sm:mb-2">{t('lpgDirectionArtistiqueMarketing', 'Direction artistique & marketing')}</p>
                            <p className="text-xs sm:text-xs text-fg-muted italic leading-relaxed">{lpData.generalNotes}</p>
                        </div>
                      )}
                      
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext 
                          items={lpData.sections.map((s: any) => s.id || s.title)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3 sm:space-y-6">
                            {lpData.sections.map((s: any, i: number) => (
                              <SortableSection 
                                key={s.id || i}
                                id={s.id || s.title}
                                section={s}
                                index={i}
                                totalSections={lpData.sections.length}
                                updateSectionField={updateSectionField}
                                selectedCtaIndex={selectedCtaIndex}
                                handleCtaChange={handleCtaChange}
                                deleteSection={deleteSection}
                                moveSection={moveSection}
                                duplicateSection={duplicateSection}
                              />
                            ))}

                            <button
                              onClick={addSection}
                              className="w-full bg-fg/5 hover:bg-fg/10 hover:border-dz-emerald/35 text-fg-muted hover:text-fg border border-dashed border-fg/10 py-3 sm:py-5 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 text-xs sm:text-xs font-semibold mt-3 sm:mt-4"
                            >
                              <Plus size={14} className="sm:size-[16px]" />
                              {t('lpgAjouterSectionVente', 'Ajouter une section de vente')}
                            </button>
                          </div>
                        </SortableContext>
                      </DndContext>

                      <div className="p-4 sm:p-8 bg-dz-emerald/10 border border-dz-emerald/20 rounded-xl sm:rounded-2xl relative overflow-hidden group text-end">
                          <div className="absolute top-0 end-0 p-4 sm:p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Sparkles size={40} className="sm:size-[80px] text-dz-emerald" />
                          </div>
                          <div className="relative z-10">
                            <h4 className="text-xs sm:text-xs font-semibold text-dz-emerald mb-1.5 sm:mb-3">{t('lpgNotesStrategiquesFinales', 'Notes stratégiques finales')}</h4>
                            <p className="text-xs sm:text-sm text-fg-muted italic leading-relaxed font-medium max-w-2xl font-arabic" dir="rtl">{lpData.generalNotes}</p>
                          </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center select-none">
                <FileText size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm text-fg-muted">{t('lpgLaStructureOptimiseeApparaitra', 'La structure optimisée apparaîtra ici.')}</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  </div>
);
}
