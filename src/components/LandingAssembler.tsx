import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Trash2, Download, Plus, Loader2, Sparkles,
  Check, Eye, Monitor, Smartphone, X, GripVertical,
  Maximize2, Settings2, Wand2, FileImage, Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from './PageHeader';
import '../i18n/assembler';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../context/ToastContext';
import { analyzeLandingPageImages } from '../services/gemini';

// ── Types ────────────────────────────────────────────────────────────────
interface SectionImage { id: string; url: string; file: File; name: string; width: number; height: number; }
interface ExportOptions { width: number; format: 'image/png' | 'image/jpeg'; quality: number; }

// ── Sortable Item ────────────────────────────────────────────────────────
function SortableItem({ section, index, removeSection }: { section: SectionImage; index: number; removeSection: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const style = { transform: CSS.Transform.toString(transform), transition: transition || 'transform 250ms cubic-bezier(0.25,1,0.5,1)', zIndex: isDragging ? 50 : 0 };

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300",
      isDragging ? "bg-dz-card border-dz-gold/40 shadow-[0_8px_40px_rgba(212,164,76,0.15)] scale-[1.02]" : "bg-fg/[0.02] border-fg/[0.06] hover:border-fg/[0.12] hover:bg-fg/[0.04]"
    )}>
      <div {...attributes} {...listeners} aria-label={t('lpbDragHandle', 'Déplacer la section')}
        className="w-10 h-10 rounded-xl bg-primary/10 border border-dz-gold/20 flex items-center justify-center cursor-grab active:cursor-grabbing text-dz-gold/60 hover:text-dz-gold hover:border-dz-gold/40 transition-all shrink-0">
        <GripVertical size={15} />
      </div>
      <div className="w-28 h-20 rounded-xl overflow-hidden bg-fg/[0.04] border border-fg/10 shrink-0 flex items-center justify-center relative shadow-lg group-hover:shadow-xl transition-shadow">
        <img src={section.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-50" />
        <div className="absolute bottom-1 start-1.5"><p className="text-xs font-bold text-fg-muted">{section.width}×{section.height}</p></div>
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
            onBlur={() => { setIsEditing(false); section.name = editName; }}
            onKeyDown={e => { if (e.key === 'Enter') { setIsEditing(false); section.name = editName; } }}
            className="w-full bg-fg/[0.05] border border-dz-gold/30 rounded-lg px-2 py-1 text-xs font-bold text-fg focus:outline-none" />
        ) : (
          <h4 onDoubleClick={() => { setIsEditing(true); setEditName(section.name); }}
            className="text-xs font-bold text-fg truncate mb-0.5 group-hover:text-dz-gold transition-colors cursor-pointer">{section.name}</h4>
        )}
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 bg-dz-gold/10 rounded border border-dz-gold/20"><span className="text-xs font-semibold text-dz-gold">#{index + 1}</span></div>
          <span className="text-xs text-fg-faint">{section.file.size > 1024 * 1024 ? `${(section.file.size / (1024 * 1024)).toFixed(1)} MB` : `${(section.file.size / 1024).toFixed(0)} KB`}</span>
        </div>
      </div>
      <button onClick={() => removeSection(section.id)} aria-label={t('pbRemove', 'Supprimer')}
        className="w-8 h-8 flex items-center justify-center bg-rose-500/5 hover:bg-rose-500 text-rose-500/40 hover:text-white rounded-xl transition-all active:scale-90 shrink-0 border border-transparent hover:border-rose-500/30">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function LandingAssembler() {
  const toast = useToast();
  const { t } = useLanguage();
  const [sections, setSections] = useState<SectionImage[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [assembling, setAssembling] = useState(false);
  // A blob: URL, not a data: URL — Chrome cannot download a data: URL of several megabytes.
  const [assembledUrl, setAssembledUrl] = useState<string | null>(null);
  const [assembledSize, setAssembledSize] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({ width: 1920, format: 'image/png', quality: 0.95 });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Free the previous stitched image when a new one replaces it, and on leaving the tool.
  useEffect(() => () => { if (assembledUrl) URL.revokeObjectURL(assembledUrl); }, [assembledUrl]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── File handling (old logic) ──
  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setSections(prev => [...prev, { id: Math.random().toString(36).slice(2, 9), url: event.target?.result as string, file, name: file.name, width: img.width, height: img.height }]);
          setAssembledUrl(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) processFiles(e.target.files); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeave = () => setIsDraggingOver(false);

  const removeSection = (id: string) => { setSections(prev => prev.filter(s => s.id !== id)); setAssembledUrl(null); };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections(items => arrayMove(items, items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id)));
      setAssembledUrl(null);
    }
  };

  // ── AI Analysis (enhancement) ──
  const analyzeWithAI = async () => {
    if (sections.length === 0) { toast.error(t('lpbImportezDAbordImages', "Importez d'abord des images")); return; }
    setAiAnalyzing(true);
    try {
      // The AI only needs to see each section, not the full-resolution file, and many full-size images
      // in one request would exceed the host's body limit. The originals stay untouched for stitching.
      const imageData = await Promise.all(sections.map(async (s) => {
        const dataUrl = await fileToUploadDataUrl(s.file, { maxDimension: 1280, quality: 0.75 });
        return { data: dataUrl.split(',')[1], mimeType: dataUrl.slice(5, dataUrl.indexOf(';')) };
      }));
      const result = await analyzeLandingPageImages(imageData);
      setAiResult(result);
      if (result?.pageName) setProjectName(result.pageName);
      toast.success(t('lpbAnalyseIaTermineeConsultez', 'Analyse IA terminée ! Consultez les résultats ci-dessous.'));
    } catch (err: any) {
      toast.error(err.message || t('lpbLAnalyseIaEchoue', "L'analyse IA a échoué"));
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ── Canvas stitching (old logic) ──
  const assembleImages = async () => {
    if (sections.length === 0) return;
    setAssembling(true);
    try {
      const outputWidth = options.width;
      const totalHeight = sections.reduce((acc, s) => acc + (s.height * (outputWidth / s.width)), 0);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = outputWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      let currentY = 0;
      for (const section of sections) {
        const img = await new Promise<HTMLImageElement>(resolve => { const i = new Image(); i.onload = () => resolve(i); i.src = section.url; });
        const scale = outputWidth / section.width;
        const scaledHeight = section.height * scale;
        ctx.drawImage(img, 0, currentY, outputWidth, scaledHeight);
        currentY += scaledHeight;
      }
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, options.format, options.quality));
      if (!blob) throw new Error('The browser could not export the stitched page (too large?)');
      setAssembledSize(blob.size);
      setAssembledUrl(URL.createObjectURL(blob));
      toast.success(t('lpbLandingPageAssemblee', 'Landing page assemblée !'));
    } catch (error) { toast.error(t('lpbLAssemblageEchoue', "L'assemblage a échoué")); } finally { setAssembling(false); }
  };

  const downloadResult = () => {
    if (!assembledUrl) return;
    const filename = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const ext = options.format === 'image/png' ? 'png' : 'jpg';
    const link = document.createElement('a');
    link.download = `${filename || 'landing-page'}-${Date.now()}.${ext}`;
    link.href = assembledUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(t('lpbTelechargementLance', 'Téléchargement lancé !'));
  };

  const getEstimatedSize = () => {
    if (!assembledUrl) return '0 KB';
    const bytes = assembledSize;
    return bytes > 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(2) + ' MB' : Math.floor(bytes / 1024) + ' KB';
  };

  const presets = [
    { label: t('lpbPresetMobile', 'Mobile (9:16)'), width: 1080, desc: t('lpbPresetSocial', 'TikTok / Instagram') },
    { label: t('lpbPresetDesktop', 'Ordinateur (HD)'), width: 1920, desc: t('lpbPresetWeb', 'Web standard') },
    { label: t('lpbPresetRetina', 'Retina (4K)'), width: 3840, desc: t('lpbPresetHd', 'Haute définition') }
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-32">
      <PageHeader
        section="assembler"
        title={t('menuAssembler', 'Constructeur de page')}
        subtitle={t('lpbImportezSectionsReorganisezAss', 'Importez les sections → Réorganisez → Assemblez → Téléchargez')}
        actions={<>
          <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} aria-label={t('lpbNomProjet', 'Nom du projet...')}
            placeholder={t('lpbNomProjet', 'Nom du projet...')} className="bg-fg/[0.04] border border-fg/[0.08] rounded-xl px-4 py-2 text-xs text-fg-muted focus:outline-none focus:border-dz-gold/40 w-48 placeholder:text-fg-faint" />
          {sections.length > 0 && (
            <button onClick={() => { setSections([]); setAssembledUrl(null); setAiResult(null); }}
              className="px-4 py-2 text-xs text-fg-faint hover:text-rose-400 rounded-xl hover:bg-rose-500/10 border border-fg/[0.06] transition-all">{t('pbReset', 'Réinitialiser')}</button>
          )}
        </>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Export + AI */}
        <div className="lg:col-span-4 space-y-6">
          {/* Export Settings */}
          <div className="ui-panel-raised p-6 rounded-2xl border-fg/10 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-fg/5">
              <div className="w-9 h-9 rounded-xl bg-dz-gold/10 flex items-center justify-center text-dz-gold border border-dz-gold/20"><Settings2 size={16} /></div>
              <div><h2 className="text-sm font-bold text-fg">{t('lpbParametresDExport', "Paramètres d'export")}</h2><p className="text-xs text-fg-faint">{t('lpbConfiguration', 'Configuration')}</p></div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-fg-muted flex items-center gap-1.5"><Maximize2 size={10} className="text-dz-gold" /> {t('lpbLargeur', 'Largeur')}</label>
              <div className="grid grid-cols-1 gap-1.5">
                {presets.map(p => (
                  <button key={p.width} onClick={() => setOptions(prev => ({ ...prev, width: p.width }))}
                    className={cn("flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-start text-xs",
                      options.width === p.width ? "bg-dz-gold/10 text-fg border-dz-gold" : "bg-fg/[0.02] border-fg/5 text-fg-faint hover:text-fg hover:bg-fg/[0.04]"
                    )}>
                    <div><p className="font-bold">{p.label}</p><p className="text-xs text-fg-muted">{p.desc}</p></div>
                    <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", options.width === p.width ? "border-dz-gold bg-primary" : "border-fg/10")}>
                      {options.width === p.width && <Check size={8} className="text-fg" strokeWidth={4} />}
                    </div>
                  </button>
                ))}
              </div>
              <input type="range" aria-label={t('lpbLargeur', 'Largeur')} min="320" max="4096" step="10" value={options.width}
                onChange={e => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                className="w-full h-1.5 appearance-none cursor-pointer accent-dz-gold bg-fg/5 rounded-full" />
              <div className="flex justify-between text-xs text-fg-faint"><span>320px</span><span>{options.width}px</span><span>4096px</span></div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-fg-muted">{t('lpbQualite', 'Qualité')}</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-fg/[0.02] rounded-xl border border-fg/5">
                <button onClick={() => setOptions(prev => ({ ...prev, format: 'image/png', quality: 1 }))}
                  className={cn("py-2.5 rounded-lg text-xs font-bold transition-all",
                    options.format === 'image/png' ? "bg-fg/10 text-fg" : "text-fg-faint hover:text-fg")}>{t('lpbPngQualiteMax', 'PNG qualité max')}</button>
                <button onClick={() => setOptions(prev => ({ ...prev, format: 'image/jpeg', quality: 0.75 }))}
                  className={cn("py-2.5 rounded-lg text-xs font-bold transition-all",
                    options.format === 'image/jpeg' ? "bg-dz-emerald/20 text-dz-emerald border border-dz-emerald/30" : "text-fg-faint hover:text-fg")}>{t('lpbJpegRapide', 'JPEG rapide')}</button>
              </div>
            </div>

            <button onClick={assembleImages} disabled={assembling || sections.length === 0}
              className="w-full py-4 bg-gradient-to-r from-dz-emerald to-dz-emerald hover:from-dz-emerald hover:to-dz-emerald text-fg rounded-2xl font-bold text-[12px] flex items-center justify-center gap-3 shadow-2xl shadow-dz-emerald/20 transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale">
              {assembling ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {assembling ? t('lpbAssembling', 'Assemblage…') : t('lpbAssemblerLandingPage', 'Assembler la landing page')}
            </button>
          </div>

          {/* AI Analysis Card */}
          <div className="ui-card p-5 rounded-2xl border border-fg/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><Sparkles size={15} className="text-purple-400" /></div>
              <div><h3 className="text-xs font-bold text-fg">{t('lpKpiAnalysis', 'Analyse IA')}</h3><p className="text-xs text-fg-faint">{t('lpbExtraitTexteStructureImages', 'Extrait le texte et la structure des images')}</p></div>
            </div>
            <button onClick={analyzeWithAI} disabled={aiAnalyzing || sections.length === 0}
              className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-purple-500/20 transition-all disabled:opacity-30">
              {aiAnalyzing ? <><Loader2 size={13} className="animate-spin" /> {t('lpbAnalysing', 'Analyse en cours…')}</> : <><Wand2 size={13} /> {t('lpbAnalyserAvecLIa', "Analyser avec l'IA")}</>}
            </button>

            {aiResult && (
              <div className="mt-4 space-y-3 text-xs">
                {aiResult.pageName && <div className="p-2 bg-fg/[0.03] rounded-lg"><span className="text-fg-faint">{t('lpbPage', 'Page :')}</span> <span className="text-fg-muted font-bold">{aiResult.pageName}</span></div>}
                {aiResult.sections && (
                  <div className="space-y-1.5">
                    <p className="text-fg-faint font-bold text-xs">{t('lpbSectionsFound', 'Sections trouvées : {count}', { count: aiResult.sections.length })}</p>
                    {aiResult.sections.map((s: any, i: number) => (
                      <div key={i} className="p-2 bg-fg/[0.02] rounded-lg border border-fg/[0.04]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 bg-dz-gold/10 rounded text-xs text-dz-gold font-bold">{s.type}</span>
                          {s.headline && <span className="text-fg-muted truncate">{s.headline}</span>}
                          {s.title && !s.headline && <span className="text-fg-muted truncate">{s.title}</span>}
                        </div>
                        {s.subheadline && <p className="text-fg-faint text-xs truncate">{s.subheadline}</p>}
                        {s.items && <p className="text-fg-faint text-xs">{t('lpbFeaturesCount', '{count} caractéristiques', { count: s.items.length })}</p>}
                        {s.bgColor && <span className="inline-block w-3 h-3 rounded-full border border-fg/10 mt-1" style={{ backgroundColor: s.bgColor }} />}
                      </div>
                    ))}
                  </div>
                )}
                {!aiResult.sections && <p className="text-fg-faint text-center py-2">{t('lpbAucuneSectionDetectee', 'Aucune section détectée')}</p>}
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="ui-tint-primary p-5 rounded-2xl relative overflow-hidden">
            <div className="flex gap-4 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-dz-emerald/10 text-dz-emerald flex items-center justify-center shrink-0 border border-dz-emerald/20"><FileImage size={18} /></div>
              <div>
                <h4 className="text-xs font-bold text-fg mb-1">{t('lpbAssemblageIntelligent', 'Assemblage intelligent')}</h4>
                <p className="text-fg-faint text-xs leading-relaxed">{t('lpbLesImagesSontRedimensionnees', 'Les images sont redimensionnées à la largeur choisie, puis assemblées en une seule longue image de landing page à télécharger.')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Section List */}
        <div className="lg:col-span-8">
          <div className={cn("ui-card p-6 rounded-2xl border transition-all duration-300 min-h-[600px] flex flex-col",
            isDraggingOver ? "border-dz-gold/50 bg-dz-gold/[0.02]" : "border-fg/[0.06]"
          )}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

            {sections.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center cursor-pointer group/upload py-16"
                onClick={() => fileInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-2xl bg-fg/[0.02] flex items-center justify-center mb-8 group-hover/upload:scale-110 group-hover/upload:bg-dz-gold/[0.04] transition-all duration-300 relative border-2 border-dashed border-fg/10 group-hover/upload:border-dz-gold/30">
                  <div className="absolute inset-0 bg-dz-gold/10 blur-3xl rounded-full opacity-0 group-hover/upload:opacity-100 transition-opacity duration-300" />
                  <Upload size={32} className="text-dz-gold group-hover/upload:-translate-y-1 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-fg mb-2">{t('pbUploadTitle', 'Drop your sections here')}</h3>
                <p className="text-fg-faint text-[12px] mb-6">{t('pbUploadHint', 'Landing page images (PNG, JPG, WEBP)')}</p>
                <div className="flex gap-2">
                  {['PNG', 'JPG', 'WEBP'].map(f => (
                    <div key={f} className="px-4 py-2 bg-fg/[0.03] rounded-lg border border-fg/[0.06] text-xs font-bold text-fg-faint">{f}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-fg/[0.04] pb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-fg">{t('lpgSections', 'Sections')}</h4>
                    <p className="text-xs text-dz-gold bg-dz-gold/10 px-2 py-0.5 rounded-full border border-dz-gold/20 font-bold">{sections.length} {t('pbSections', 'sections')}</p>
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-fg/[0.03] hover:bg-dz-gold/10 text-fg-muted hover:text-fg rounded-xl text-xs font-bold flex items-center gap-2 border border-fg/[0.05] transition-all">
                    <Plus size={13} /> {t('pbUploadBtn', 'Add Sections')}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scroll">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2 min-h-[300px]">
                        <AnimatePresence mode="popLayout">
                          {sections.map((section, index) => (
                            <motion.div key={section.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
                              <SortableItem section={section} index={index} removeSection={removeSection} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Visualizer */}
      <AnimatePresence>
        {assembledUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Success banner */}
            <div className="ui-tint-primary p-6 rounded-2xl border border-fg/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-dz-emerald/10 text-dz-emerald flex items-center justify-center border border-dz-emerald/20"><Check size={20} strokeWidth={3} /></div>
                <div>
                  <h3 className="text-lg font-bold text-fg">{t('lpbLandingPagePrete', 'Landing page prête !')}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-dz-emerald bg-dz-emerald/10 px-2 py-0.5 rounded border border-dz-emerald/20 font-bold">{options.width}px</span>
                    <span className="text-xs text-fg-faint">{getEstimatedSize()}</span>
                    <div className="flex gap-1 bg-fg/[0.04] rounded-lg p-0.5 border border-fg/10">
                      <button onClick={() => setPreviewMode('desktop')} className={cn("px-2.5 py-1 rounded text-xs font-bold transition-all", previewMode === 'desktop' ? "bg-primary text-white" : "text-fg-faint")}>{t('lpbOrdinateur', 'Ordinateur')}</button>
                      <button onClick={() => setPreviewMode('mobile')} className={cn("px-2.5 py-1 rounded text-xs font-bold transition-all", previewMode === 'mobile' ? "bg-primary text-white" : "text-fg-faint")}>{t('pbMobile', 'Mobile')}</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewImage(assembledUrl)}
                  className="px-5 py-3 bg-fg/[0.03] hover:bg-fg/[0.08] text-fg-muted hover:text-fg rounded-xl text-xs font-bold flex items-center gap-2 border border-fg/[0.08] transition-all"><Eye size={13} /> {t('lpbPleinEcran', 'Plein écran')}</button>
                <button onClick={downloadResult}
                  className="px-6 py-3 bg-gradient-to-r from-dz-emerald to-dz-emerald text-fg rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><Download size={14} /> {t('download', 'Télécharger')}</button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex justify-center">
              <motion.div layout className={cn("ui-card p-3 overflow-hidden rounded-2xl border border-fg/[0.06] shadow-2xl transition-all duration-300",
                previewMode === 'mobile' ? "w-[380px] max-w-full" : "w-full"
              )}>
                <div className={cn("overflow-y-auto custom-scroll rounded-xl bg-slate-900/40 relative",
                  previewMode === 'mobile' ? "aspect-[9/19] max-h-[700px] h-[600px]" : "max-h-[800px]"
                )}>
                  <img src={assembledUrl} alt={t('lpbLandingPageAssemblee2', 'Landing page assemblée')} className="w-full" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
            onClick={() => setPreviewImage(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="max-w-6xl w-full max-h-full overflow-y-auto rounded-2xl bg-fg/5 border border-fg/10 p-2"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-4 flex justify-end z-20 mb-2">
                <button onClick={() => setPreviewImage(null)} aria-label={t('lpbCloseLightbox', "Fermer l'aperçu")}
                  className="w-10 h-10 bg-fg/10 hover:bg-rose-500 text-fg hover:text-white rounded-full transition-all border border-fg/20 flex items-center justify-center"><X size={18} /></button>
              </div>
              <img src={previewImage} alt={t('lpbApercuComplet', 'Aperçu complet')} className="w-full rounded-xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
