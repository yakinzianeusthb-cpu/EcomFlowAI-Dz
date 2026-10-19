import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  Download, 
  Camera,
  Monitor,
  Maximize,
  Smartphone,
  Square as SquareIcon,
  Layout,
  X,
  Package,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateProductImage } from '../services/gemini';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { addToHistory } from '../lib/history';
import { preferencesApi } from '../services/api';
import PromptField from './PromptField';

export default function ProductImageGen() {
  const toast = useToast();
  const [productName, setProductName] = useState('');
  const [style, setStyle] = useState('lifestyle');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load last restored or generated image from the API on mount (localStorage as fallback)
  useEffect(() => {
    let cancelled = false;
    const applySaved = (parsed: any) => {
      setResult(parsed.result || parsed.img || (typeof parsed === 'string' ? parsed : null));
      if (parsed.productName) setProductName(parsed.productName);
      if (parsed.style) setStyle(parsed.style);
      if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
    };

    (async () => {
      try {
        const prefs = await preferencesApi.get();
        if (cancelled) return;
        if (prefs?.lastImage) {
          applySaved(prefs.lastImage);
          return;
        }
      } catch (e) {
        console.error('Failed to load last image from API', e);
      }
      // Fallback to localStorage
      const saved = localStorage.getItem('dzads_last_generated_image');
      if (saved) {
        try {
          applySaved(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const styles = [
    { 
      id: 'lifestyle', 
      name: 'Lifestyle', 
      desc: 'En situation réelle',
      longDesc: 'Met le produit en scène dans son environnement naturel. Idéal pour aider le client à se projeter.',
      icon: '🏠'
    },
    { 
      id: 'minimalist', 
      name: 'Minimaliste', 
      desc: 'Focus produit épuré',
      longDesc: 'Fond neutre et éclairage doux. Parfait pour les catalogues et une clarté maximale sans distraction.',
      icon: '✨'
    },
    { 
      id: 'high-tech', 
      name: 'Premium', 
      desc: 'Studio sophistiqué',
      longDesc: 'Éclairage contrasté, reflets maîtrisés et textures riches. Donne une image haut de gamme etluxueuse.',
      icon: '💎'
    },
    { 
      id: 'creative', 
      name: 'Créatif', 
      desc: 'Artistique & Coloré',
      longDesc: 'Compositions audacieuses et palettes de couleurs vibrantes pour capter l\'attention immédiatement.',
      icon: '🎨'
    },
  ];

  const currentStyle = styles.find(s => s.id === style);

  const handleGenerate = async () => {
    if (!productName) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const stylePrompt = styles.find(s => s.id === style)?.desc || "";
      const img = await generateProductImage(productName, stylePrompt, aspectRatio);
      setResult(img);
      toast.success("Image produit générée avec succès ! 🎨");
      
      // Store to centralized history
      addToHistory('image', productName, img, `Style: ${stylePrompt} | Aspect Ratio: ${aspectRatio}`, {
        productName,
        style,
        aspectRatio,
      });

      // Update active cache
      localStorage.setItem('dzads_last_generated_image', JSON.stringify({
        result: img,
        productName,
        style,
        aspectRatio
      }));
      // Persist to the server API (fire-and-forget)
      preferencesApi.update({ lastImage: { result: img, productName, style, aspectRatio } }).catch(() => {});
    } catch (err: any) {
      console.error(err);
      toast.error("Échec de la génération de l'image.");
      const errorStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      const isQuota = 
        errorStr.includes("429") || 
        errorStr.includes("RESOURCE_EXHAUSTED") || 
        errorStr.includes("quota") ||
        errorStr.toLowerCase().includes("exceeded") ||
        errorStr.includes("QUOTA_EXCEEDED") ||
        err?.status === "RESOURCE_EXHAUSTED" ||
        errorStr.toLowerCase().includes("limit reached");
      
      if (isQuota) {
        setError("Quota Gemini épuisé. L'IA a besoin d'une pause ou votre limite est atteinte (429). Réessayez dans quelques minutes.");
      } else {
        setError(err.message || "Erreur lors de la génération de l'image. Veuillez vérifier votre connexion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `${productName.replace(/\s+/g, '_')}_dzads.png`;
    link.click();
    toast.success("Téléchargement lancé ! 📥");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <ImageIcon className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-fg">Photos de Produit IA</h2>
          <p className="text-fg-muted">Générez des visuels professionnels pour vos publicités</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="ui-card p-6 space-y-6">
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
          <PromptField
            label="Quel produit / Prompt ?"
            icon={<Package size={12} className="text-purple-400" />}
            value={productName}
            onChange={setProductName}
            placeholder="Ex: Montre intelligente noire, Sac à main en cuir, Appareil photo..."
            badgeText="PROMPT"
          />

          <div>
            <label className="block text-xs font-semibold text-fg-faint mb-3 flex items-center gap-2">
              <Palette size={10} className="text-purple-500" />
              Style Visuel
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "p-4 rounded-2xl border text-start transition-all relative overflow-hidden group",
                    style === s.id 
                      ? "bg-purple-600/20 border-purple-500 text-fg shadow-xl shadow-purple-500/20" 
                      : "bg-fg/[0.03] border-fg/10 text-fg-muted hover:bg-fg/10 hover:text-fg"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold">{s.name}</p>
                    <span className="text-lg">{s.icon}</span>
                  </div>
                  <p className="text-xs opacity-60 leading-tight">{s.desc}</p>
                  {style === s.id && (
                    <motion.div 
                      layoutId="active-bg"
                      className="absolute inset-0 bg-fg/10 pointer-events-none"
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {currentStyle && (
                <motion.div
                  key={currentStyle.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={cn(
                    "p-4 rounded-xl border relative overflow-hidden transition-all duration-300",
                    style === 'lifestyle' && "bg-orange-500/10 border-orange-500/20",
                    style === 'minimalist' && "bg-gray-500/10 border-gray-500/20",
                    style === 'high-tech' && "bg-primary/10 border-dz-emerald/20",
                    style === 'creative' && "bg-pink-500/10 border-pink-500/20"
                  )}
                >
                  {/* Decorative Mood element */}
                  <div className={cn(
                    "absolute -end-4 -top-4 w-16 h-16 blur-2xl opacity-40 rounded-full",
                    style === 'lifestyle' && "bg-orange-500",
                    style === 'minimalist' && "bg-white",
                    style === 'high-tech' && "bg-primary",
                    style === 'creative' && "bg-pink-500"
                  )} />

                  <div className="flex items-start gap-3 relative z-10">
                    <div className={cn(
                      "p-2 rounded-lg bg-fg/5",
                      style === 'lifestyle' && "text-orange-400",
                      style === 'minimalist' && "text-fg-muted",
                      style === 'high-tech' && "text-dz-emerald",
                      style === 'creative' && "text-pink-400"
                    )}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-fg-muted mb-1">Guide Style : {currentStyle.name}</p>
                      <p className="text-xs text-fg leading-relaxed font-medium">{currentStyle.longDesc}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4 pt-4 border-t border-fg/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-purple-500/10 rounded-lg text-purple-400">
                <Layout size={14} />
              </div>
              <label className="text-xs font-semibold text-fg-muted">Format de l'image (AI)</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '16:9', label: 'Paysage', icon: Monitor },
                { id: '1:1', label: 'Carré', icon: SquareIcon },
                { id: '4:5', label: 'Portrait', icon: Maximize },
                { id: '9:16', label: 'Story', icon: Smartphone }
              ].map((ratio) => {
                const Icon = ratio.icon;
                return (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all border ${
                      aspectRatio === ratio.id
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-fg/5 border-fg/10 text-fg-muted hover:bg-fg/10'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="text-xs font-semibold">{ratio.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !productName}
            className="w-full btn-dz-primary"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Générer la Photo Sensationnelle
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className={cn(
            "relative w-full transition-all duration-300 overflow-hidden",
            aspectRatio === '1:1' && 'aspect-square',
            aspectRatio === '16:9' && 'aspect-[16/9]',
            aspectRatio === '4:5' && 'aspect-[4/5]',
            aspectRatio === '9:16' && 'aspect-[9/16]'
          )}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 ui-card flex flex-col items-center justify-center text-center p-8 z-10"
                >
                  <div className="w-16 h-16 relative mb-4">
                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-fg font-medium">L'IA prépare votre visuel...</p>
                  <p className="text-xs text-fg-muted mt-2 italic">Format {aspectRatio} en cours...</p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full relative group shadow-2xl shadow-purple-500/20"
                >
                  <img
                    src={result}
                    alt={productName}
                    className="w-full h-full object-cover rounded-2xl border border-fg/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold transition-transform"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger HD
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-full ui-card border-dashed flex flex-col items-center justify-center p-8 text-center text-fg-faint">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-fg-muted font-medium mb-1">Format {aspectRatio}</h3>
                  <p className="text-xs max-w-[200px]">Prêt à générer votre photo parfaite</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
