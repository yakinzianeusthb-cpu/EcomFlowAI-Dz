import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Package,
  Tag,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  DollarSign,
  Layers,
  Archive,
  Trash2,
  Eye,
  Camera,
  RefreshCcw,
  Calculator,
  Percent,
  Coins,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { catalogApi, CatalogProduct } from '../services/api';

interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  targetCPA: number;
  stock: number;
  status: 'active' | 'out_of_stock' | 'low_stock';
  image: string;
  countries: string;
  description: string;
  sales: number;
  euroRate: number;
  confRate: number;
  delivRate: number;
}

const AVAILABLE_COUNTRIES = [
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
];

// Map a server CatalogProduct to the local Product shape used by the UI.
const apiToProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  category: p.category,
  purchasePrice: Number(p.purchasePrice) || 0,
  sellingPrice: Number(p.sellingPrice) || 0,
  targetCPA: Number(p.targetCpa) || 0,
  stock: p.stock ?? 0,
  status: (p.status || 'active') as Product['status'],
  image: p.imageUrl || '',
  countries: p.countries || 'DZ',
  description: p.description || '',
  sales: p.sales || 0,
  euroRate: Number(p.euroRate) || 220,
  confRate: Number(p.confRate) || 0.8,
  delivRate: Number(p.delivRate) || 0.6,
});

// Map a local Product to the API CatalogProduct payload for create/update.
const productToApiPayload = (product: Product): Partial<CatalogProduct> => ({
  name: product.name,
  category: product.category,
  purchasePrice: product.purchasePrice,
  sellingPrice: product.sellingPrice,
  targetCpa: product.targetCPA,
  stock: product.stock,
  status: product.status,
  imageUrl: product.image,
  countries: product.countries,
  description: product.description,
  sales: product.sales,
  euroRate: product.euroRate,
  confRate: product.confRate,
  delivRate: product.delivRate,
});

export default function ProductCatalog() {
  // Only the seller's own products: no sample products dressed up as their inventory.
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from the server API on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await catalogApi.list();
        if (cancelled) return;
        const list: any[] = Array.isArray(res) ? res : ((res as any)?.products ?? []);
        if (Array.isArray(list) && list.length > 0) {
          setProducts(list.map(apiToProduct));
        }
      } catch (e) {
        console.error('Failed to load catalog from API', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'profit'; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const stockAlertProducts = useMemo(() => {
    return products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock');
  }, [products]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Electronique',
    purchasePrice: '',
    sellingPrice: '',
    targetCPA: '',
    stock: '',
    image: '',
    countries: 'DZ',
    description: '',
    euroRate: '220'
  });

  const categories = ['Tous', 'Electronique', 'Maison', 'Beauté', 'Mode', 'Cuisine', 'Fitness'];

  const toggleCountry = (code: string) => {
    setNewProduct({
      ...newProduct,
      countries: code
    });
  };

  const MARKET_METRICS: Record<string, { conf: number; deliv: number }> = {
    'Electronique': { conf: 0.85, deliv: 0.60 },
    'Maison': { conf: 0.80, deliv: 0.65 },
    'Beauté': { conf: 0.82, deliv: 0.58 },
    'Mode': { conf: 0.75, deliv: 0.52 },
    'Cuisine': { conf: 0.88, deliv: 0.68 },
    'Fitness': { conf: 0.80, deliv: 0.55 },
  };

  const profitability = useMemo(() => {
    const sale = parseFloat(newProduct.sellingPrice) || 0;
    const cost = parseFloat(newProduct.purchasePrice) || 0;
    const euroRate = parseFloat(newProduct.euroRate) || 220;
    
    const cpa_dzd = (parseFloat(newProduct.targetCPA) || 0) * euroRate;
    
    const metrics = MARKET_METRICS[newProduct.category] || { conf: 0.80, deliv: 0.55 };
    const confRate = metrics.conf;
    const delivRate = metrics.deliv;

    const grossProfitPerConfirmed = (sale - cost) * delivRate;
    const profit = grossProfitPerConfirmed - (cpa_dzd / confRate);
    
    const margin = sale > 0 ? (profit / sale) * 100 : 0;
    const roas = cpa_dzd > 0 ? sale / cpa_dzd : 0;

    return { profit, margin, roas, confRate, delivRate, euroRate };
  }, [newProduct.sellingPrice, newProduct.purchasePrice, newProduct.targetCPA, newProduct.category, newProduct.euroRate]);

  const handleGenerateWithAI = async () => {
    if (!newProduct.image && !newProduct.name) {
      alert("Veuillez d'abord ajouter une image ou un nom temporaire pour aider l'IA.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: newProduct.image,
          currentName: newProduct.name,
          purchasePrice: newProduct.purchasePrice,
          sellingPrice: newProduct.sellingPrice
        })
      });

      if (!response.ok) throw new Error('Failed to generate');
      
      const data = await response.json();
      setNewProduct(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        category: data.category || prev.category,
        targetCPA: data.targetCPA ? data.targetCPA.toString().replace(/[^\d.]/g, '') : prev.targetCPA
      }));
    } catch (error) {
      console.error('AI error:', error);
      alert(error?.message || "Erreur lors de la génération. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddProduct = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    // Basic validation
    if (!newProduct.name || !newProduct.sellingPrice || !newProduct.stock) {
      return;
    }

    const sellingPrice = parseInt(newProduct.sellingPrice) || 0;
    const stock = parseInt(newProduct.stock) || 0;
    
    const metrics = MARKET_METRICS[newProduct.category] || { conf: 0.80, deliv: 0.55 };
    
    const product: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name,
      category: newProduct.category,
      purchasePrice: parseInt(newProduct.purchasePrice) || 0,
      sellingPrice: sellingPrice,
      targetCPA: parseFloat(newProduct.targetCPA) || 0,
      stock: stock,
      status: stock > 10 ? 'active' : stock > 0 ? 'low_stock' : 'out_of_stock',
      image: newProduct.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
      countries: newProduct.countries,
      description: newProduct.description,
      sales: 0,
      euroRate: parseInt(newProduct.euroRate) || 220,
      confRate: metrics.conf,
      delivRate: metrics.deliv
    };
    setProducts([product, ...products]);
    // Persist to the server API (fire-and-forget — never block the UI on network errors)
    catalogApi.create(productToApiPayload(product)).catch((err) =>
      console.error('Failed to save product to API', err)
    );
    setIsModalOpen(false);
    setNewProduct({
      name: '', 
      category: 'Electronique', 
      purchasePrice: '', 
      sellingPrice: '', 
      targetCPA: '', 
      stock: '', 
      image: '', 
      countries: '', 
      description: '',
      euroRate: '220'
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    // Persist the deletion to the server API (fire-and-forget)
    catalogApi.delete(id).catch((err) =>
      console.error('Failed to delete product from API', err)
    );
  };

  const handleClearCatalog = () => {
    if (confirm('Voulez-vous vraiment vider tout le catalogue ?')) {
      setProducts([]);
      // No bulk-delete endpoint — remove each product via the API.
      products.forEach(p => catalogApi.delete(p.id).catch(() => {}));
    }
  };

  const handleSort = (key: keyof Product | 'profit') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const calculateProfit = (product: Product) => {
    const cpaDZD = (product.targetCPA || 0) * (product.euroRate || 220);
    const grossProfitPerConfirmed = (product.sellingPrice - product.purchasePrice) * (product.delivRate || 0.6);
    const profit = grossProfitPerConfirmed - (cpaDZD / (product.confRate || 0.8));
    return Math.round(profit);
  };

  const sortedProducts = useMemo(() => {
    return [...products]
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'profit') {
          aValue = calculateProfit(a);
          bValue = calculateProfit(b);
        } else {
          aValue = a[sortConfig.key as keyof Product];
          bValue = b[sortConfig.key as keyof Product];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, searchQuery, activeCategory, sortConfig]);

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'bg-dz-emerald/20 text-dz-emerald border-dz-emerald/30';
      case 'low_stock': return 'bg-dz-gold/20 text-dz-gold border-dz-gold/30';
      case 'out_of_stock': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
    }
  };

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'En Stock';
      case 'low_stock': return 'Stock Faible';
      case 'out_of_stock': return 'En Rupture';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-dz-gold/10 text-dz-gold text-xs font-semibold rounded-full border border-dz-gold/20 flex items-center gap-2">
                <Archive size={12} />
                Gestion Inventaire
             </div>
             <span className="text-fg-faint text-xs font-semibold whitespace-nowrap">V1.5 DZ-HUB</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-fg tracking-tight leading-none">
            Catalogue <span className="text-dz-gold italic">Produits</span>
          </h1>
          <p className="text-fg-muted font-bold max-w-xl">
            Gérez votre stock, analysez les performances de vos produits et préparez vos prochaines campagnes publicitaires sur le marché DZ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {products.length > 0 && (
            <button 
              onClick={handleClearCatalog}
              className="px-6 py-3.5 bg-fg/[0.03] hover:bg-rose-500/10 text-fg-muted hover:text-rose-500 rounded-xl text-xs font-semibold flex items-center gap-2 border border-fg/10 active:scale-95 transition-all"
            >
              <Trash2 size={16} /> 
              Vider
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-primary hover:bg-accent-hover text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl shadow-dz-gold/20 active:scale-95 transition-all group"
          >
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> 
            Ajouter un Produit
          </button>
        </div>
      </div>

      {/* Notifications de Stock */}
      {stockAlertProducts.length > 0 && (
        <div className="ui-panel px-6 py-4 rounded-2xl border-rose-500/10 bg-rose-500/[0.01] flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
              <AlertCircle size={14} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-fg">
                Alerte de Stock ({stockAlertProducts.length})
              </p>
              <p className="text-xs text-fg-muted">Certains articles requièrent votre attention immédiate.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {stockAlertProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreviewProduct(p)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all active:scale-98",
                  p.status === 'out_of_stock' 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40" 
                    : "bg-dz-gold/10 border-dz-gold/20 text-dz-gold hover:bg-dz-gold/20 hover:border-dz-gold/40"
                )}
              >
                <span>{p.name}</span>
                <span className="opacity-60 text-xs">
                  {p.status === 'out_of_stock' ? 'Rupture' : `${p.stock} unités`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="ui-panel p-6 rounded-2xl border-fg/10 flex flex-col md:flex-row gap-6 items-center justify-between shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
           {/* Search */}
           <div className="relative w-full md:w-80 group">
              <Search className="absolute start-5 top-1/2 -translate-y-1/2 text-fg-faint group-focus-within:text-dz-gold transition-colors" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full bg-fg/[0.03] border border-fg/10 rounded-2xl ps-14 pe-6 py-4 text-fg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-dz-gold/30 transition-all placeholder:text-fg-faint shadow-inner"
              />
           </div>

           {/* Category Filters */}
           <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap active:scale-95 border",
                    activeCategory === cat 
                      ? "bg-primary text-white border-dz-gold shadow-lg shadow-dz-gold/20" 
                      : "bg-fg/[0.02] border-fg/5 text-fg-faint hover:text-fg hover:bg-fg/5"
                  )}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Grid of products */}
      {sortedProducts.length > 0 ? (
        <div className="space-y-6">
          {/* Table Headers for sorting */}
          <div className="hidden lg:grid grid-cols-12 gap-8 px-10 py-4 bg-fg/5 rounded-2xl border border-fg/10 items-center">
            <button 
              onClick={() => handleSort('name')}
              className={cn(
                "col-span-3 flex items-center gap-2 text-xs font-semibold transition-colors text-start",
                sortConfig.key === 'name' ? "text-dz-gold" : "text-fg-muted hover:text-fg-muted"
              )}
            >
              Nom
              {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            <button 
              onClick={() => handleSort('category')}
              className={cn(
                "col-span-2 flex items-center gap-2 text-xs font-semibold transition-colors text-start",
                sortConfig.key === 'category' ? "text-dz-gold" : "text-fg-muted hover:text-fg-muted"
              )}
            >
              Catégorie
              {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            <button 
              onClick={() => handleSort('countries')}
              className={cn(
                "col-span-2 flex items-center gap-2 text-xs font-semibold transition-colors text-start",
                sortConfig.key === 'countries' ? "text-dz-gold" : "text-fg-muted hover:text-fg-muted"
              )}
            >
              Pays Cibles
              {sortConfig.key === 'countries' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            <button 
              onClick={() => handleSort('sellingPrice')}
              className={cn(
                "col-span-1.5 flex items-center gap-2 text-xs font-semibold transition-colors justify-center",
                sortConfig.key === 'sellingPrice' ? "text-dz-gold" : "text-fg-muted hover:text-fg-muted"
              )}
            >
              Prix Vente
              {sortConfig.key === 'sellingPrice' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            <button 
              onClick={() => handleSort('stock')}
              className={cn(
                "col-span-1.5 flex items-center gap-2 text-xs font-semibold transition-colors justify-center",
                sortConfig.key === 'stock' ? "text-dz-gold" : "text-fg-muted hover:text-fg-muted"
              )}
            >
              Stock
              {sortConfig.key === 'stock' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            <button 
              onClick={() => handleSort('profit')}
              className={cn(
                "col-span-2 flex items-center gap-2 text-xs font-semibold transition-colors justify-end",
                sortConfig.key === 'profit' ? "text-dz-gold" : "text-fg-muted hover:text-fg-muted"
              )}
            >
              Profit Est.
              {sortConfig.key === 'profit' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {sortedProducts.map((product, index) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="ui-card group border-fg/5 hover:border-fg/20 transition-all overflow-hidden"
              >
                {/* Product Image Wrapper */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                  
                  {/* Actions Overlay */}
                  <div className="absolute top-4 end-4 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                     <button 
                       onClick={() => setPreviewProduct(product)}
                       className="w-10 h-10 rounded-xl bg-fg/10 border border-fg/20 text-fg flex items-center justify-center hover:bg-primary-hover hover:text-white transition-all"
                     >
                        <Eye size={18} />
                     </button>
                     <button 
                       onClick={() => handleDeleteProduct(product.id)}
                       className="w-10 h-10 rounded-xl bg-fg/10 border border-fg/20 text-fg flex items-center justify-center hover:bg-rose-500/80 hover:text-fg transition-all"
                     >
                        <Trash2 size={18} />
                     </button>
                  </div>

                  <div className="absolute bottom-4 start-4 flex flex-col gap-2">
                     <div className={cn(
                       "px-3 py-1 rounded-full text-xs font-semibold border w-fit",
                       getStatusColor(product.status)
                     )}>
                       {getStatusLabel(product.status)}
                     </div>
                     <h3 className="text-lg font-bold text-fg truncate max-w-[200px] tracking-tight" dir="auto">{product.name}</h3>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-fg/5">
                     <div className="space-y-1">
                        <p className="text-xs font-semibold text-fg-faint">Prix Vente</p>
                        <p className="text-lg font-bold text-fg">{product.sellingPrice.toLocaleString()} <span className="text-xs text-fg-muted">DA</span></p>
                     </div>
                     <div className="space-y-1 text-end">
                        <p className="text-xs font-semibold text-fg-faint">Profit/U Est.</p>
                        <p className={cn(
                          "text-lg font-bold",
                          calculateProfit(product) > 0 ? "text-dz-emerald" : "text-rose-500"
                        )}>
                          {calculateProfit(product).toLocaleString()} <span className="text-xs opacity-40">DA</span>
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div className="p-2.5 rounded-xl bg-fg/[0.02] border border-fg/5">
                        <p className="text-xs font-semibold text-fg-faint mb-1">Stock</p>
                        <div className="flex items-center gap-1.5">
                           <Archive size={12} className={cn(product.stock <= 10 ? "text-dz-gold" : "text-fg-faint")} />
                           <p className={cn("text-xs font-bold", product.stock <= 10 ? "text-dz-gold" : "text-fg")}>{product.stock}</p>
                        </div>
                     </div>
                     <div className="p-2.5 rounded-xl bg-fg/[0.02] border border-fg/5">
                        <p className="text-xs font-semibold text-fg-faint mb-1">CPA Cible</p>
                        <div className="flex items-center gap-1.5">
                           <TrendingUp size={12} className="text-dz-gold" />
                           <p className="text-xs font-bold text-fg">{product.targetCPA}€</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                     <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                        {product.countries?.split(',').map((c, idx) => {
                           const country = AVAILABLE_COUNTRIES.find(ac => ac.code === c.trim().toUpperCase());
                           if (!country) return null;
                           return (
                              <div key={idx} className="flex items-center gap-1 bg-fg/5 border border-fg/10 px-1.5 py-0.5 rounded text-xs font-semibold text-fg-muted">
                                 <span>{country.flag}</span>
                                 <span>{country.code}</span>
                              </div>
                           );
                        })}
                        <div className="px-2 py-1 rounded bg-fg/5 border border-fg/10">
                           <p className="text-xs font-semibold text-fg-muted truncate max-w-[80px]">{product.category}</p>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-fg/10 shrink-0" />
                        <div className="flex items-center gap-1 shrink-0">
                           <ShoppingBag size={10} className="text-dz-emerald" />
                           <p className="text-xs font-bold text-fg">{product.sales}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setPreviewProduct(product)}
                          className="p-2 text-fg-faint hover:text-dz-gold transition-colors bg-fg/5 hover:bg-dz-gold/10 rounded-lg border border-fg/5"
                          title="Aperçu rapide"
                        >
                           <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-fg-faint hover:text-rose-500 transition-colors bg-fg/5 hover:bg-rose-500/10 rounded-lg border border-fg/5"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    ) : (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 ui-panel rounded-2xl border-fg/5"
      >
          <div className="w-24 h-24 rounded-2xl bg-fg/[0.03] border border-fg/10 flex items-center justify-center text-fg-faint mb-8 shadow-inner">
             <Package size={48} />
          </div>
          <h3 className="text-2xl font-semibold text-fg mb-2">Catalogue Vide</h3>
          <p className="text-fg-faint font-bold text-center max-w-sm mb-8">
            Vous n'avez pas encore ajouté de produits. Commencez à construire votre inventaire dès maintenant.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-10 py-4 bg-primary text-white rounded-2xl font-semibold text-[12px] shadow-2xl shadow-dz-gold/20 active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus size={20} strokeWidth={3} /> Créer mon premier produit
          </button>
        </motion.div>
      )}


      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl ui-panel-raised p-0 rounded-2xl border-fg/10 shadow-2xl max-h-[95vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-8 border-b border-fg/5 bg-fg/[0.02]">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-dz-gold/20">
                      <Plus size={32} strokeWidth={3} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold text-fg tracking-tighter">Nouveau Produit</h2>
                      <p className="text-xs font-semibold text-dz-gold">Configuration Catalogue Pro</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center bg-fg/5 hover:bg-fg/10 rounded-2xl transition-all text-fg-muted hover:text-fg"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-950/20">
                <form id="product-form" onSubmit={handleAddProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left Column: Media & Primary Info */}
                  <div className="lg:col-span-4 space-y-8">
                     <div className="space-y-4">
                        <label className="text-xs font-semibold text-fg-muted flex items-center gap-2">
                           <Camera size={14} className="text-dz-gold" /> Visuel du Produit
                        </label>
                        <div className="relative aspect-square rounded-2xl bg-fg/[0.02] border-2 border-dashed border-fg/10 overflow-hidden flex flex-col items-center justify-center group shadow-inner">
                           {newProduct.image ? (
                             <>
                               <img src={newProduct.image} className="w-full h-full object-cover" alt="Preview" />
                               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                 <button 
                                   type="button"
                                   onClick={() => document.getElementById('image-upload')?.click()}
                                   className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold shadow-xl"
                                 >
                                   Changer
                                 </button>
                                 <button 
                                   type="button"
                                   onClick={() => setNewProduct({...newProduct, image: ''})}
                                   className="px-4 py-2 bg-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold border border-rose-500/30"
                                 >
                                   Supprimer
                                 </button>
                               </div>
                             </>
                           ) : (
                             <button
                               type="button"
                               onClick={() => document.getElementById('image-upload')?.click()}
                               className="text-center p-8 w-full h-full flex flex-col items-center justify-center hover:bg-fg/[0.02] transition-colors"
                             >
                               <div className="w-16 h-16 rounded-2xl bg-fg/5 flex items-center justify-center mx-auto mb-4 text-fg-faint group-hover:text-dz-gold transition-colors">
                                  <Camera size={32} />
                               </div>
                               <p className="text-xs font-semibold text-fg-faint mb-1 group-hover:text-fg transition-colors">Cliquer pour ajouter</p>
                               <p className="text-xs font-bold text-fg-faint">JPG, PNG, WEBP</p>
                             </button>
                           )}
                           <input 
                             id="image-upload"
                             type="file"
                             accept="image/*"
                             className="hidden"
                             onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (!file) return;
                               try {
                                 // Catalog images are stored with the product, so keep them small.
                                 const image = await fileToUploadDataUrl(file, { maxDimension: 1200 });
                                 setNewProduct((prev) => ({ ...prev, image }));
                               } catch { /* unreadable file: keep the current image */ }
                             }}
                           />
                        </div>
                        <input 
                          type="text"
                          value={newProduct.image}
                          onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                          placeholder="Coller l'URL de l'image ici..."
                          className="w-full bg-fg/[0.03] border border-fg/10 rounded-2xl px-6 py-4 text-fg focus:outline-none focus:ring-2 focus:ring-dz-gold/50 transition-all text-xs shadow-inner"
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-xs font-semibold text-fg-muted flex items-center gap-2">
                           <Layers size={14} className="text-dz-gold" /> Catégorisation
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                           {categories.filter(c => c !== 'Tous').map(cat => (
                             <button
                               type="button"
                               key={cat}
                               onClick={() => setNewProduct({...newProduct, category: cat})}
                               className={cn(
                                 "px-4 py-3 rounded-xl text-xs font-semibold border transition-all",
                                 newProduct.category === cat 
                                   ? "bg-dz-gold/10 border-dz-gold text-dz-gold shadow-lg shadow-dz-gold/5" 
                                   : "bg-fg/[0.02] border-fg/5 text-fg-faint hover:bg-fg/5"
                               )}
                             >
                               {cat}
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Profitability Quick Preview */}
                     <div className="p-6 rounded-2xl bg-linear-to-br from-fg/[0.05] to-transparent border border-fg/10 space-y-4 relative overflow-hidden group">
                        <div className="absolute top-0 end-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Calculator size={48} />
                        </div>
                        <h4 className="text-xs font-semibold text-dz-gold flex items-center gap-2">
                           <Coins size={14} /> Prévision Profit (V1)
                        </h4>
                        <div className="space-y-4 relative z-10">
                           <div className="flex items-end justify-between">
                              <p className="text-xs font-semibold text-fg-faint">Profit Net /U</p>
                              <p className={cn(
                                "text-2xl font-bold tracking-tighter",
                                profitability.profit > 0 ? "text-dz-emerald" : "text-rose-500"
                              )}>
                                {Math.round(profitability.profit).toLocaleString()} <span className="text-xs font-bold opacity-40">DA</span>
                              </p>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4 py-3 border-y border-fg/5">
                              <div>
                                 <p className="text-xs font-semibold text-fg-faint mb-1">Confirmation</p>
                                 <p className="text-sm font-bold text-fg">{(profitability.confRate * 100).toFixed(0)}%</p>
                              </div>
                              <div className="text-end">
                                 <p className="text-xs font-semibold text-fg-faint mb-1">Livraison</p>
                                 <p className="text-sm font-bold text-fg">{(profitability.delivRate * 100).toFixed(0)}%</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                 <p className="text-xs font-semibold text-fg-faint mb-1">Marge %</p>
                                 <p className="text-lg font-bold text-fg">{profitability.margin.toFixed(1)}%</p>
                              </div>
                              <div>
                                 <p className="text-xs font-semibold text-fg-faint mb-1">E-ROAS</p>
                                 <p className="text-lg font-bold text-dz-gold">{profitability.roas.toFixed(2)}x</p>
                              </div>
                           </div>
                           <p className="text-xs font-bold text-fg-faint pt-2 text-center border-t border-fg/5">Calculé sur 1€ = {profitability.euroRate} DA</p>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Pricing & Logistics */}
                  <div className="lg:col-span-8 space-y-10">
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                           <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                 <label className="text-xs font-semibold text-fg-muted">Nom Complet</label>
                                 <button 
                                   type="button"
                                   onClick={handleGenerateWithAI}
                                   disabled={isGenerating}
                                   className={cn(
                                     "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                     isGenerating 
                                       ? "bg-fg/5 text-fg-faint cursor-not-allowed" 
                                       : "bg-dz-gold/10 text-dz-gold hover:bg-primary-hover hover:text-white border border-dz-gold/20"
                                   )}
                                 >
                                   <RefreshCcw size={12} className={cn(isGenerating && "animate-spin")} />
                                   {isGenerating ? "Génération..." : "Remplir avec l'IA"}
                                 </button>
                              </div>
                              <div className="relative">
                                 <input 
                                   required
                                   type="text"
                                   dir="auto"
                                   value={newProduct.name}
                                   onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                   placeholder="Nom du produit..."
                                   className="w-full bg-fg/[0.03] border border-fg/10 rounded-2xl px-6 py-5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-gold/50 transition-all font-bold placeholder:text-fg-faint ps-14"
                                 />
                                 <Tag className="absolute start-6 top-1/2 -translate-y-1/2 text-dz-gold" size={18} />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-xs font-semibold text-fg-muted">Prix d'achat (DA)</label>
                              <div className="relative">
                                 <input 
                                   required
                                   type="number"
                                   value={newProduct.purchasePrice}
                                   onChange={(e) => setNewProduct({...newProduct, purchasePrice: e.target.value})}
                                   placeholder="0"
                                   className="w-full bg-dz-emerald/5 border border-dz-emerald/10 rounded-2xl px-6 py-5 text-dz-emerald focus:outline-none focus:ring-2 focus:ring-dz-emerald/50 transition-all ps-14 shadow-inner"
                                 />
                                 <DollarSign className="absolute start-6 top-1/2 -translate-y-1/2 text-dz-emerald" size={18} />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-semibold text-fg-muted">Prix de vente (DA)</label>
                              <div className="relative">
                                 <input 
                                   required
                                   type="number"
                                   value={newProduct.sellingPrice}
                                   onChange={(e) => setNewProduct({...newProduct, sellingPrice: e.target.value})}
                                   placeholder="0"
                                   className="w-full bg-dz-gold/5 border border-dz-gold/10 rounded-2xl px-6 py-5 text-dz-gold focus:outline-none focus:ring-2 focus:ring-dz-gold/50 transition-all ps-14 shadow-inner"
                                 />
                                 <TrendingUp className="absolute start-6 top-1/2 -translate-y-1/2 text-dz-gold" size={18} />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                           <div className="space-y-2">
                              <label className="text-xs font-semibold text-fg-muted">Taux Euro (DA)</label>
                              <div className="relative">
                                 <input 
                                   required
                                   type="number"
                                   value={newProduct.euroRate}
                                   onChange={(e) => setNewProduct({...newProduct, euroRate: e.target.value})}
                                   placeholder="220"
                                   className="w-full bg-fg/[0.03] border border-fg/10 rounded-2xl px-6 py-5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-gold/50 transition-all ps-14 shadow-inner"
                                 />
                                 <Coins className="absolute start-6 top-1/2 -translate-y-1/2 text-fg-faint" size={18} />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-xs font-semibold text-fg-muted">Stock actuel</label>
                              <div className="relative">
                                 <input 
                                   required
                                   type="number"
                                   value={newProduct.stock}
                                   onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                                   placeholder="Unités"
                                   className="w-full bg-fg/[0.03] border border-fg/10 rounded-2xl px-6 py-5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-gold/50 transition-all ps-14 shadow-inner"
                                 />
                                 <Archive className="absolute start-6 top-1/2 -translate-y-1/2 text-fg-faint" size={18} />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                 <label className="text-xs font-semibold text-fg-muted">CPA Cible (€)</label>
                                 {(newProduct.purchasePrice && newProduct.sellingPrice) && (
                                   <button 
                                     type="button"
                                     onClick={handleGenerateWithAI}
                                     disabled={isGenerating}
                                     className="text-xs font-semibold text-dz-gold hover:text-fg transition-colors flex items-center gap-1"
                                   >
                                     <Coins size={10} /> Suggérer
                                   </button>
                                 )}
                              </div>
                              <div className="relative">
                                 <input 
                                   required
                                   type="number"
                                   step="0.01"
                                   value={newProduct.targetCPA}
                                   onChange={(e) => setNewProduct({...newProduct, targetCPA: e.target.value})}
                                   placeholder="Max CPA"
                                   className="w-full bg-linear-to-r from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl px-6 py-5 text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all ps-14 shadow-inner"
                                 />
                                 <AlertCircle className="absolute start-6 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-xs font-semibold text-fg-muted">Pays cibles</label>
                           <div className="flex flex-wrap gap-3 mb-6">
                              {AVAILABLE_COUNTRIES.map((ct) => (
                                <button
                                  key={ct.code}
                                  type="button"
                                  onClick={() => toggleCountry(ct.code)}
                                  className={cn(
                                    "px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 group active:scale-95",
                                    newProduct.countries.includes(ct.code)
                                      ? "bg-dz-gold/10 border-dz-gold text-fg shadow-lg shadow-dz-gold/5"
                                      : "bg-fg/[0.02] border-fg/10 text-fg-faint hover:bg-fg/5 hover:border-fg/20"
                                  )}
                                >
                                  <span className="text-xl group-hover:scale-110 transition-transform">{ct.flag}</span>
                                  <span className="text-xs font-semibold">{ct.code}</span>
                                  {newProduct.countries.includes(ct.code) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  )}
                                </button>
                              ))}
                           </div>
                           <label className="text-xs font-semibold text-fg-muted">Description du Produit</label>
                           <textarea 
                             dir="auto"
                             value={newProduct.description}
                             onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                             placeholder="Décrivez les points forts du produit (USP, caractéristiques techniques...)"
                             rows={6}
                             className="w-full bg-fg/[0.03] border border-fg/10 rounded-2xl px-6 py-5 text-fg text-sm focus:outline-none focus:ring-2 focus:ring-dz-gold/50 transition-all resize-none shadow-inner"
                           />
                        </div>
                     </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-fg/5 bg-fg/[0.02] flex items-center gap-6">
                <div className="hidden lg:flex items-center gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dz-emerald/10 text-dz-emerald flex items-center justify-center border border-dz-emerald/20">
                         <Percent size={18} />
                      </div>
                      <div className="leading-tight">
                         <p className="text-xs font-semibold text-fg-faint">Score Profit</p>
                         <p className="text-sm font-bold text-fg">{profitability.margin > 30 ? 'Excellent' : profitability.margin > 15 ? 'Bon' : 'Faible'}</p>
                      </div>
                   </div>
                </div>
                
                <button 
                  type="submit"
                  form="product-form"
                  className="flex-1 py-6 bg-primary text-white rounded-2xl font-semibold text-sm shadow-2xl shadow-dz-gold/20 active:scale-[0.99] transition-all flex items-center justify-center gap-4 group border border-fg/10"
                >
                  <Archive size={24} strokeWidth={3} className="group-hover:-translate-y-1 transition-transform" />
                  Valider et Ajouter au Catalogue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Quick View Modal */}
      <AnimatePresence>
        {previewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewProduct(null)}
              className="absolute inset-0 bg-black/80"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-2xl border border-fg/10 overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              {/* Product Image Section */}
              <div className="w-full md:w-1/2 aspect-square relative group bg-surface">
                <img 
                  src={previewProduct.image} 
                  alt={previewProduct.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-8 start-8 flex flex-wrap gap-2">
                  <div className={cn(
                    "px-4 py-2 rounded-full border text-xs font-semibold",
                    getStatusColor(previewProduct.status)
                  )}>
                    {getStatusLabel(previewProduct.status)}
                  </div>
                  <div className="px-4 py-2 rounded-full border border-fg/10 bg-fg/5 text-fg text-xs font-semibold">
                    {previewProduct.category}
                  </div>
                </div>
              </div>

              {/* Product Info Section */}
              <div className="w-full md:w-1/2 p-10 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-fg tracking-tighter mb-2" dir="auto">{previewProduct.name}</h2>
                    <div className="flex flex-wrap gap-2">
                       {previewProduct.countries?.split(',').map((c, idx) => {
                         const country = AVAILABLE_COUNTRIES.find(ac => ac.code === c.trim().toUpperCase());
                         if (!country) return null;
                         return (
                           <div key={idx} className="flex items-center gap-2 bg-fg/5 border border-fg/10 px-3 py-1.5 rounded-xl">
                             <span className="text-xl">{country.flag}</span>
                             <span className="text-xs font-semibold text-fg-muted">{country.code}</span>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreviewProduct(null)}
                    className="p-2 rounded-full bg-fg/5 hover:bg-fg/10 text-fg-muted hover:text-fg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto max-h-[400px] pe-4 custom-scrollbar mb-8">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-fg-muted">Description du Produit</p>
                    <p className="text-fg-muted leading-relaxed text-sm" dir="auto">{previewProduct.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-fg-muted">Prix de Vente</p>
                      <p className="text-3xl font-bold text-fg tracking-tighter">
                        {previewProduct.sellingPrice.toLocaleString()}<span className="text-xs text-fg-faint ms-2">DA</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-fg-muted">Coût Achat</p>
                      <p className="text-3xl font-bold text-fg-muted tracking-tighter">
                        {previewProduct.purchasePrice.toLocaleString()}<span className="text-xs text-fg-faint ms-2">DA</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-fg/[0.03] border border-fg/5 space-y-1">
                      <p className="text-xs font-semibold text-fg-faint">Stock</p>
                      <p className={cn("text-lg font-bold", previewProduct.stock <= 10 ? "text-dz-gold" : "text-fg")}>{previewProduct.stock}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-fg/[0.03] border border-fg/5 space-y-1">
                      <p className="text-xs font-semibold text-fg-faint">Ventes</p>
                      <p className="text-lg font-bold text-dz-emerald">{previewProduct.sales}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-fg/[0.03] border border-fg/5 space-y-1">
                      <p className="text-xs font-semibold text-fg-faint">Profit Est.</p>
                      <p className={cn("text-lg font-bold", calculateProfit(previewProduct) > 0 ? "text-dz-emerald" : "text-rose-500")}>
                        {calculateProfit(previewProduct)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
                        handleDeleteProduct(previewProduct.id);
                        setPreviewProduct(null);
                      }
                    }}
                    className="flex-1 bg-rose-500/10 border border-rose-500/20 py-5 rounded-2xl text-rose-500 font-semibold text-xs hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                  >
                    Supprimer
                  </button>
                  <button 
                    onClick={() => setPreviewProduct(null)}
                    className="flex-[2] bg-primary py-5 rounded-2xl text-white font-semibold text-xs hover:bg-white transition-all shadow-xl shadow-dz-gold/20"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
