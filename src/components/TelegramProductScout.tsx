import { useState, useEffect, useRef } from 'react';
import { Search, Send, TrendingUp, ShoppingBag, Radio, ExternalLink, Loader2, Sparkles, AlertCircle, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scoutTelegramProducts, ScoutedProduct } from '../services/telegramService';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

// Helper for Browser Notifications
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

const sendTrendNotification = (product: ScoutedProduct) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  
  new Notification("🔥 Nouvelle Tendance Détectée !", {
    body: `${product.name} - Score de tendance de ${product.trendingScore}/100 sur Telegram.`,
    icon: `https://loremflickr.com/100/100/${product.name.replace(/\s+/g, ',')}`,
    tag: product.name,
  });
};

function ImageWithFallback({ keywords, alt, className }: { keywords: string, alt: string, className?: string }) {
  const [src, setSrc] = useState(`https://loremflickr.com/600/400/${keywords.replace(/\s+/g, ',')}`);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleImageError = () => {
    if (!error) {
      setError(true);
      // Fallback to a high-quality unsplash image if loremflickr fails
      setSrc(`https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600&h=400`);
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-fg/5 flex items-center justify-center overflow-hidden", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="animate-spin text-fg-faint" size={24} />
        </div>
      )}
      <img 
        src={src} 
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          loading ? "opacity-0 scale-110" : "opacity-100 scale-100",
          !error && "group-hover:scale-110"
        )}
        onLoad={() => setLoading(false)}
        onError={handleImageError}
        referrerPolicy="no-referrer"
      />
      {error && !loading && (
        <div className="absolute top-2 end-2">
          <AlertCircle size={12} className="text-fg-faint" />
        </div>
      )}
    </div>
  );
}

export default function TelegramProductScout() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [products, setProducts] = useState<ScoutedProduct[]>([]);
  const [isFirstSearch, setIsFirstSearch] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Check notification status on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  // Fetch whether the Telegram backend is in live (MTProto) or simulation mode
  useEffect(() => {
    fetch('/api/telegram-trends')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data) setIsLive(data.mode === 'live'); })
      .catch(() => setIsLive(false));
  }, []);

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      if (granted) setNotificationsEnabled(true);
    }
  };
  
  const TRENDING_SUGGESTIONS = [
    { term: "Hachoir Manuel 3 Lames", category: "Cuisine", popularity: "Explosive" },
    { term: "Abaya Dubai Luxe", category: "Mode", popularity: "High" },
    { term: "Smart Watch Ultra 2", category: "High-Tech", popularity: "Trending" },
    { term: "Mixeur Plongeant DZ", category: "Cuisine", popularity: "Stable" },
    { term: "Pack Eclairage Solaire", category: "Maison", popularity: "Very High" },
    { term: "Aspirateur de Voiture", category: "Accessoires", popularity: "Rising" },
    { term: "Sneakers Jordan DZ", category: "Mode", popularity: "Active" },
    { term: "Machine à Café Expresso", category: "Cuisine", popularity: "High" },
  ];

  const filteredSuggestions = TRENDING_SUGGESTIONS.filter(item => 
    item.term.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  // True when the server reports a live MTProto connection (vs labeled simulation).
  const [isLive, setIsLive] = useState(false);

  const loadingSteps = [
    "Connexion sécurisée aux passerelles Telegram...",
    "Scanning des hubs Grossistes (Hamiz, El Eulma, Sétif)...",
    "Filtrage par volume de commandes réels (COD)...",
    "Analyse IA des visuels et descriptions marketing...",
    "Calcul des scores de profitabilités du marché DZ...",
    "Extraction des fiches produits à fort potentiel...",
    "Optimisation des hooks marketing en Darija...",
    "Finalisation du dashboard de scouting..."
  ];

  const loadingTips = [
    "Saviez-vous ? Le marché du Hamiz est le plus grand hub électronique d'Afrique du Nord.",
    "Astuce : Les produits 'Maison' ont le taux de retour le plus bas en Algérie.",
    "Tendance : Le paiement à la livraison (COD) représente 95% des transactions locales.",
    "Conseil : Un bon hook en Darija augmente le CTR de 40% sur Facebook Ads.",
    "Info : Les hubs d'El Eulma sont spécialisés dans l'électroménager et le textile.",
    "Stratégie : Testez toujours votre produit via Telegram avant de lancer de grosses ads."
  ];

  const [currentTipIdx, setCurrentTipIdx] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setCurrentTipIdx(prev => (prev + 1) % loadingTips.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent, searchQuery?: string) => {
    e?.preventDefault();
    const finalQuery = searchQuery ?? query;
    setQuery(finalQuery);
    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    setProgress(0);
    setLoadingStep(0);
    setIsFirstSearch(false);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const next = prev + (Math.random() * 15);
        
        // Update loading step based on progress
        const step = Math.floor((next / 100) * loadingSteps.length);
        setLoadingStep(Math.min(step, loadingSteps.length - 1));
        
        return next;
      });
    }, 400);

    try {
      const data = await scoutTelegramProducts(finalQuery);
      setProgress(100);
      setProducts(data);
      if (data.length > 0) {
        toast.success(`${data.length} produits tendance détectés avec succès ! 🚀`);
      }
      
      // Notify for top trending product if enabled
      if (notificationsEnabled && data.length > 0) {
        const topProduct = data.reduce((prev, current) => 
          (current.trendingScore > prev.trendingScore) ? current : prev
        );
        sendTrendNotification(topProduct);
      }

      if (data.length === 0) {
        setError("Aucun produit trouvé pour cette recherche. Essayez d'autres mots-clés.");
      }
    } catch (err: any) {
      console.error("Scouting failed", err);
      const errorStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      const isQuota = 
        errorStr.includes("429") || 
        errorStr.includes("RESOURCE_EXHAUSTED") || 
        errorStr.includes("quota") ||
        err?.status === "RESOURCE_EXHAUSTED";
        
      if (isQuota) {
        setError("Quota Gemini épuisé ou limite de débit atteinte (Erreur 429). L'IA a besoin d'une pause ou votre forfait a atteint sa limite. Réessayez dans quelques minutes.");
      } else {
        setError(err.message || "Une erreur est survenue lors du scouting. Vérifiez votre connexion ou réessayez plus tard.");
      }
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    // Initial scout for trending products
    handleSearch();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-1 justify-between items-center w-full md:w-auto">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight flex items-center gap-3">
              <span className="p-2 bg-dz-emerald/20 text-dz-emerald rounded-xl">
                <Send size={24} />
              </span>
              Telegram Product Scout <span className="text-dz-emerald">AI</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-fg-muted text-sm font-medium">Scannez les tendances Telegram Algérie en temps réel.</p>
              <div className={cn(
                "px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1.5",
                isLive ? "bg-dz-emerald/10 text-dz-emerald border border-dz-emerald/20" : "bg-fg/5 text-fg-faint border border-fg/5"
              )}>
                <div className={cn("w-1 h-1 rounded-full", isLive ? "bg-primary animate-pulse" : "bg-fg/20")} />
                {isLive ? "API Connectée" : "Simulation Active"}
              </div>
            </div>
          </div>

          <button
            onClick={toggleNotifications}
            className={cn(
              "p-3 rounded-xl border transition-all flex items-center gap-2",
              notificationsEnabled 
                ? "bg-primary/10 border-dz-emerald/30 text-dz-emerald" 
                : "bg-fg/5 border-fg/10 text-fg-muted hover:bg-fg/10"
            )}
            title={notificationsEnabled ? "Notifications Activées" : "Activer les notifications push"}
          >
            {notificationsEnabled ? <Bell size={20} className="animate-bounce" /> : <BellOff size={20} />}
            <span className="text-xs font-semibold hidden sm:inline">
              {notificationsEnabled ? "Alertes ON" : "Alertes OFF"}
            </span>
          </button>
        </div>

        <div className="w-full md:w-auto relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative group">
            <div className="relative">
              <input 
                type="text" 
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Rechercher par niche (ex: Cuisine, Sneakers...)"
                className="w-full md:w-80 bg-fg/5 border border-fg/10 rounded-2xl py-3 ps-12 pe-4 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald/50 transition-all placeholder:text-fg-faint"
              />
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-fg-faint group-focus-within:text-dz-emerald transition-colors" size={18} />
              
              {/* Discrete Progress Bar on Input */}
              {loading && (
                <div className="absolute bottom-0 start-4 end-4 h-[1px] bg-fg/5 overflow-hidden rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          </form>

          <AnimatePresence>
            {showSuggestions && query.length > 0 && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full start-0 end-0 mt-2 bg-black/60 border border-fg/10 rounded-2xl py-2 overflow-hidden z-50 shadow-2xl"
              >
                <div className="px-4 py-1 pb-2 border-b border-fg/5 mb-1">
                  <p className="text-xs font-semibold text-fg-faint">Tendances du Marché DZ</p>
                </div>
                {filteredSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(undefined, suggestion.term)}
                    className="w-full px-4 py-2 hover:bg-dz-emerald/10 flex items-center justify-between group/item transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-fg/5 flex items-center justify-center text-fg-faint group-hover/item:text-dz-emerald transition-colors">
                        <TrendingUp size={14} />
                      </div>
                      <div className="text-start">
                        <p className="text-sm font-bold text-fg group-hover/item:text-dz-emerald transition-colors">{suggestion.term}</p>
                        <p className="text-xs text-fg-faint font-semibold">{suggestion.category}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-dz-emerald/60 bg-dz-emerald/5 px-2 py-0.5 rounded border border-dz-emerald/10">
                      {suggestion.popularity}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Market Pulse Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="ui-card p-6 border border-fg/10">
            <h3 className="text-xs font-semibold text-fg-muted mb-4 flex items-center gap-2">
              <Radio size={14} className="text-dz-emerald animate-pulse" />
              Direct de Telegram
            </h3>
            <div className="space-y-4">
              {[
                { channel: "Grossistes Algiers", status: "Hot", color: "text-orange-400" },
                { channel: "DZ Import Luxury", status: "Actif", color: "text-dz-emerald" },
                { channel: "Constantine Tech", status: "Nouveau", color: "text-dz-emerald" }
              ].map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-fg-muted font-semibold">{c.channel}</span>
                  <span className={cn("px-1.5 py-0.5 rounded-sm bg-fg/5 font-semibold tracking-tighter", c.color)}>{c.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-fg/5">
              <p className="text-xs text-fg-faint italic leading-relaxed">
                "Analyse basée sur le volume de messages et l'engagement des membres dans les groupes de vente DZ."
              </p>
            </div>
          </div>

          <div className="ui-card p-6 border border-fg/10 bg-gradient-to-br from-dz-emerald/5 to-transparent">
            <h3 className="text-xs font-semibold text-fg-muted mb-4">Top Catégories Actuelles</h3>
            <div className="space-y-2">
              {['Smart Home', 'Summer Fashion', 'Kitchen Hack', 'Beauty Tech'].map((cat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-fg-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {cat}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center py-20 px-8 ui-card border border-dz-emerald/10 relative overflow-hidden"
              >
                {/* Background Animation */}
                <div className="absolute inset-0 bg-dz-emerald/5 overflow-hidden pointer-events-none">
                  <motion.div 
                    animate={{ 
                      x: ['-100%', '100%'],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-dz-emerald/10 to-transparent skew-x-12"
                  />
                </div>

                <div className="relative z-10 w-full max-w-md space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-dz-emerald/20 blur-2xl rounded-full" />
                      <div className="relative bg-fg/[0.04] p-5 rounded-2xl border border-dz-emerald/20 shadow-2xl">
                        <Send size={40} className="text-dz-emerald animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-fg tracking-tight">Analyse des flux Telegram DZ</h3>
                      <p className="text-dz-emerald/60 text-xs font-bold mt-1">IA Product Scout v4.0</p>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                      <div className="flex flex-col">
                        <AnimatePresence mode="wait">
                          <motion.span 
                            key={loadingStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-xs font-semibold text-dz-emerald"
                          >
                            {loadingSteps[loadingStep]}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-xs text-fg-faint font-bold mt-1">Status: Recherche active...</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-fg tabular-nums tracking-tighter">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-4 w-full bg-fg/[0.04] rounded-full border border-fg/10 p-1 overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "circOut", duration: 0.5 }}
                        className="h-full bg-linear-to-r from-dz-emerald to-dz-emerald rounded-full relative overflow-hidden"
                      >
                        <motion.div 
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-linear-to-r from-transparent via-fg/30 to-transparent w-1/2 -skew-x-12"
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Tips Carousel */}
                  <div className="bg-fg/5 border border-fg/5 rounded-2xl p-4 relative overflow-hidden group">
                    <div className="absolute top-0 start-0 w-1 h-full bg-dz-emerald/50" />
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-dz-emerald/10 rounded-lg text-dz-emerald shrink-0">
                        <TrendingUp size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-fg-faint">Conseil Expert</p>
                        <AnimatePresence mode="wait">
                          <motion.p 
                            key={currentTipIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-xs font-medium text-fg-muted leading-relaxed italic"
                          >
                            {loadingTips[currentTipIdx]}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="grid grid-cols-2 gap-2">
                    {loadingSteps.map((step, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border",
                          loadingStep > idx ? "bg-dz-emerald/10 border-dz-emerald/20 text-dz-emerald" :
                          loadingStep === idx ? "bg-fg/5 border-dz-emerald/30 text-fg shadow-lg shadow-dz-emerald/5" :
                          "bg-transparent border-fg/5 text-fg-faint"
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          loadingStep > idx ? "bg-primary" :
                          loadingStep === idx ? "bg-dz-emerald animate-pulse" : "bg-fg/10"
                        )} />
                        <span className="truncate">{step.split('...')[0]}</span>
                        {loadingStep === idx && (
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 size={10} className="text-dz-emerald" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 ui-card border border-red-500/10 text-center px-6"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-fg mb-2 underline decoration-red-500/30">Erreur de Scouting</h3>
                <p className="text-fg-muted font-medium max-w-md mx-auto">{error}</p>
                <button 
                  onClick={() => handleSearch()}
                  className="mt-8 px-6 py-3 bg-fg/5 hover:bg-fg/10 text-fg rounded-xl font-bold transition-all border border-fg/5 flex items-center gap-2"
                >
                  <Search size={18} />
                  Réessayer la recherche
                </button>
              </motion.div>
            ) : products.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {products.map((product, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="ui-card p-6 flex flex-col group hover:border-dz-emerald/30 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden">
                      <ImageWithFallback 
                        keywords={product.imageKeywords || 'gadget,tech'} 
                        alt={product.name}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 start-4">
                        <span className="text-xs font-semibold text-fg-muted bg-fg/[0.04] px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <div className="absolute top-0 end-0 p-4 z-10">
                      <div className="px-2 py-1 bg-primary text-white rounded text-xs font-semibold shadow-xl">
                        Top Win
                      </div>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 gap-2 flex items-center">
                        <div className="p-2 bg-dz-emerald/10 rounded-lg">
                          <ShoppingBag size={16} className="text-dz-emerald" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-fg-faint font-medium tracking-tighter">{product.sourceChannel}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-orange-400">
                          <TrendingUp size={14} />
                          <span className="text-xs font-bold tracking-tight">{product.trendingScore}% Trend</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-fg leading-tight">{product.name}</h3>
                        <span className="text-xs font-semibold text-dz-emerald/60">{product.category}</span>
                      </div>
                      
                      <p className="text-xs text-fg-muted leading-relaxed line-clamp-2">{product.description}</p>
                      
                      <div className="p-3 bg-dz-emerald/5 border border-dz-emerald/10 rounded-xl space-y-1">
                        <p className="text-xs font-semibold text-dz-emerald">Why it's hot DZ</p>
                        <p className="text-xs text-dz-emerald/80 leading-relaxed">{product.whyTrending}</p>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs font-semibold text-fg-faint mb-1">Hook Marketing Perçu</p>
                        <p className="text-sm font-bold text-fg font-arabic text-end leading-relaxed" dir="rtl">{product.marketingHook}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-fg/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-fg-faint">Estim. Price DZ</span>
                        <span className="text-lg font-bold text-fg">{product.estimatedPrice}</span>
                      </div>
                      <button className="p-2.5 bg-fg/5 hover:bg-fg/10 rounded-full text-fg-muted hover:text-fg transition-all">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : !isFirstSearch && (
              <div className="flex flex-col items-center justify-center py-20 ui-card border border-fg/5 text-center px-6">
                <Search size={40} className="text-fg-faint mb-4" />
                <p className="text-fg-muted font-medium">Aucun signal trouvé pour cette niche.</p>
                <p className="text-xs text-fg-faint max-w-xs mt-2">Essayez des termes plus larges comme "Cuisine", "Beauté" ou "Outils".</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
