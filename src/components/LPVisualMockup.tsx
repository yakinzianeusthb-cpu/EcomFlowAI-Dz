import { useState } from 'react';
import {
  Smartphone,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LPVisualMockupProps {
  productName: string;
  sections: any[];
  colorPalette?: string[];
  imagePreview?: string | null;
  imagePreviews?: string[];
}

const ALGERIAN_WILAYAS = [
  { code: "16", name: "Alger - الجزائر" },
  { code: "31", name: "Oran - وهران" },
  { code: "25", name: "Constantine - قسنطينة" },
  { code: "09", name: "Blida - البليدة" },
  { code: "19", name: "Sétif - سطيف" },
  { code: "15", name: "Tizi Ouzou - تيزي وزو" },
  { code: "23", name: "Annaba - عنابة" },
  { code: "13", name: "Tlemcen - تلمسان" },
  { code: "06", name: "Béjaïa - بجاية" },
  { code: "02", name: "Chlef - الشلف" },
  { code: "35", name: "Boumerdès - بومرداس" },
  { code: "42", name: "Tipaza - تيبازة" }
];

export default function LPVisualMockup({ 
  productName, 
  sections, 
  colorPalette = ["#10b981", "#3b82f6", "#ffffff"], 
  imagePreview,
  imagePreviews = []
}: LPVisualMockupProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gallery state for Hero section
  const [selectedHeroImageIndex, setSelectedHeroImageIndex] = useState<number>(0);

  // Consolidate list of previews
  const allPreviews = imagePreviews.length > 0 
    ? imagePreviews 
    : (imagePreview ? [imagePreview] : []);

  const activeHeroImage = allPreviews[selectedHeroImageIndex] || allPreviews[0] || imagePreview;

  // Derive theme colors safely
  const primaryColor = colorPalette[0] || "#10b981"; // Primary brand

  const handleCheckoutFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !wilaya) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSubmitted(true);
    }, 1500);
  };

  const resetOrder = () => {
    setOrderSubmitted(false);
    setFullName("");
    setPhone("");
    setWilaya("");
  };

  return (
    <div className="flex flex-col items-center justify-center py-3 sm:py-6 select-none bg-black/10 rounded-2xl sm:rounded-2xl border border-fg/5 p-2 sm:p-4 w-full max-w-md mx-auto relative overflow-hidden">
      
      {/* Visual background lights for context */}
      <div 
        className="absolute w-72 h-72 rounded-full blur-[120px] opacity-10 pointer-events-none -top-20 -left-20"
        style={{ backgroundColor: primaryColor }}
      />
      
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 z-10">
        <Smartphone size={14} className="text-fg-muted sm:size-[16px]" />
        <span className="text-xs sm:text-xs font-semibold text-fg-muted">Simulateur Mobile COD</span>
      </div>

      {/* Styled Smartphone Container */}
      <div className="relative w-full max-w-[340px] rounded-2xl sm:rounded-2xl border-4 sm:border-8 border-neutral-900 bg-bg shadow-2xl overflow-hidden ring-2 sm:ring-4 ring-fg/10 flex flex-col">
        
        {/* Notch / Dynamic Island */}
        <div className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-4 sm:h-5 bg-black rounded-full z-50 flex items-center justify-between px-2 sm:px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
          <div className="w-8 sm:w-10 h-1 bg-surface rounded-full" />
          <div className="w-2 sm:w-2.5 h-1 bg-neutral-800 rounded-full" />
        </div>

        {/* Outer Header / Status bar simulation */}
        <div className="h-7 sm:h-8 bg-black w-full flex justify-between items-center px-4 sm:px-6 text-xs sm:text-xs font-bold text-fg-muted pt-0.5 sm:pt-1 z-40 select-none pointer-events-none">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span className="text-xs">LTE</span>
            <div className="w-3.5 sm:w-4 h-2 rounded border border-fg/30 p-0.5 flex items-center">
              <div className="w-full h-full bg-white rounded-xs" />
            </div>
          </div>
        </div>

        {/* Scrollable Mobile screen screen */}
        <div className="h-[440px] sm:h-[520px] overflow-y-auto bg-slate-50 relative text-fg-faint font-sans tracking-tight leading-normal scroll-smooth">
          
          <AnimatePresence mode="wait">
            {orderSubmitted ? (
              /* Success Succeeded Animation Backdrop */
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center"
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl relative"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    <CheckCircle2 size={44} />
                  </motion.div>
                  <div className="absolute inset-0 rounded-full border-2 border-dashed animate-spin border-dz-emerald/30 duration-300 pointer-events-none" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-bold font-arabic text-fg-faint">تم تسجيل طلبكم بنجاح!</h4>
                  <p className="text-xs text-fg-faint font-arabic px-4 leading-relaxed">
                    شكراً لثقتكم. سيتصل بكم أحد عملائنا للتأكيد وتوصيل المنتج في أقرب وقت.
                  </p>
                </div>

                {/* Delivery driving animation */}
                <div className="mt-8 relative w-full h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center overflow-hidden">
                  <motion.div
                    initial={{ x: -60 }}
                    animate={{ x: 300 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="text-dz-emerald flex items-center gap-1.5 absolute"
                  >
                    <Truck size={20} />
                    <span className="text-xs font-bold tracking-tighter">DELIVERING...</span>
                  </motion.div>
                </div>

                <button
                  onClick={resetOrder}
                  className="mt-8 px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-fg-faint hover:bg-slate-200 transition-colors"
                >
                  Retour à la page
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col">
                
                {/* Simulated Floating Sticky Header */}
                <div className="sticky top-0 z-30 bg-fg/95 shadow-sm border-b border-slate-100 flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-fg font-bold text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <ShoppingBag size={12} />
                    </div>
                    <span className="text-xs font-semibold tracking-tight text-fg-faint truncate max-w-[120px]">
                      {productName || "E-Shop"}
                    </span>
                  </div>
                  <a 
                    href="#order-form"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-fg font-arabic shadow-sm animate-pulse"
                    style={{ backgroundColor: primaryColor }}
                  >
                    اطلب الآن
                  </a>
                </div>

                {/* Banner Express Offer */}
                <div className="bg-amber-500 text-fg-faint py-1.5 px-3 text-xs font-semibold text-center flex items-center justify-center gap-2 font-arabic" dir="rtl">
                  <Truck size={12} />
                  <span>الشحن مجاني لـ 58 ولاية + الدفع عند الاستلام 🚚</span>
                </div>

                {/* Render Sections Dynamically */}
                {sections.map((sec, idx) => {
                  const isHeroSec = idx === 0 || sec.step?.toLowerCase().includes('hero') || sec.narrativeRole?.toLowerCase().includes('hook');
                  
                  return (
                    <div 
                      key={sec.id || idx} 
                      className={`p-5 relative ${
                        isHeroSec 
                          ? 'bg-surface text-fg overflow-hidden pb-8' 
                          : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      {/* Section Badge */}
                      {sec.narrativeRole && (
                        <span 
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${
                            isHeroSec ? 'bg-fg/10 text-dz-emerald' : 'bg-slate-200 text-fg-faint'
                          }`}
                        >
                          {sec.narrativeRole.split('|').pop()?.trim()}
                        </span>
                      )}

                      {/* Header Title in Arabic */}
                      {sec.title && (
                        <h3 
                          className={`text-lg font-bold tracking-tight font-arabic leading-snug mb-3 text-right max-w-sm ml-auto ${
                            isHeroSec ? 'text-fg' : 'text-fg-faint'
                          }`}
                          dir="rtl"
                        >
                          {sec.title}
                        </h3>
                      )}

                      {/* Hero Image & Gallery Integration */}
                      {isHeroSec && (
                        <div className="my-4 space-y-2">
                          <div className="relative rounded-2xl bg-fg/5 border border-fg/10 p-4 flex flex-col items-center justify-center min-h-[150px] shadow-2xl">
                            {activeHeroImage ? (
                              <img 
                                src={activeHeroImage} 
                                alt={productName} 
                                className="max-h-[140px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-all duration-300" 
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 text-fg-faint">
                                <ShoppingBag size={32} strokeWidth={1} />
                                <span className="text-xs select-none">صورة المنتج</span>
                              </div>
                            )}
                            <div 
                              className="absolute -bottom-2 right-4 px-3 py-1 bg-amber-500 rounded-lg text-fg-faint font-bold text-xs font-arabic shadow-md"
                            >
                              9,900 د.ج
                            </div>
                          </div>

                          {/* Gallery Thumbnails Carousel if multiple images exist */}
                          {allPreviews.length > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-1 px-1 overflow-x-auto">
                              {allPreviews.map((img, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => setSelectedHeroImageIndex(imgIdx)}
                                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                                    selectedHeroImageIndex === imgIdx 
                                      ? 'border-dz-emerald scale-110 shadow-lg ring-2 ring-dz-emerald/30' 
                                      : 'border-fg/20 opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <img src={img} alt={`Thumb ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Section Image Integration (For Non-Hero Sections if assigned) */}
                      {!isHeroSec && (sec.customImagePreview || (sec.selectedImageIndex !== undefined && sec.selectedImageIndex >= 0 && allPreviews[sec.selectedImageIndex])) && (
                        <div className={`my-4 flex items-center justify-center ${
                          sec.imagePosition === 'left' ? 'float-left ml-3 mb-2 w-1/2' :
                          sec.imagePosition === 'right' ? 'float-right mr-3 mb-2 w-1/2' :
                          'w-full'
                        }`}>
                          <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-white p-2 w-full">
                            <img 
                              src={sec.customImagePreview || allPreviews[sec.selectedImageIndex || 0]} 
                              alt={sec.title || "Section visual"} 
                              className="w-full h-auto max-h-[160px] object-cover rounded-xl"
                            />
                          </div>
                        </div>
                      )}

                      {/* Main Copy Content formatted correctly */}
                      {sec.content && (
                        <p 
                          className={`text-xs leading-relaxed font-arabic text-right mb-4 ${
                            isHeroSec ? 'text-fg-muted' : 'text-fg-faint'
                          }`}
                          dir="rtl"
                        >
                          {sec.content}
                        </p>
                      )}

                      {/* Special comparison tables */}
                      {sec.comparisonTable && sec.comparisonTable.length > 0 && (
                        <div className="my-4 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm" dir="rtl">
                          <table className="w-full text-xs text-right">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200">
                                <th className="p-2 font-bold text-fg-faint">الخاصية</th>
                                <th className="p-2 font-bold text-center text-dz-emerald bg-dz-emerald/50">منتجنا</th>
                                <th className="p-2 font-bold text-center text-fg-muted">آخرون</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-fg-faint">
                              {sec.comparisonTable.map((row: any, rIndex: number) => (
                                <tr key={rIndex} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="p-2 font-bold text-fg-faint font-arabic">{row.feature}</td>
                                  <td className="p-2 text-center text-dz-emerald font-bold font-arabic bg-dz-emerald/20">{row.product}</td>
                                  <td className="p-2 text-center text-fg-muted font-arabic">{row.competitor}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Special guarantee certificates */}
                      {sec.guaranteeDetails && (
                        <div className="my-5 p-4 bg-dz-emerald/5 border border-dz-emerald/10 rounded-2xl flex items-start gap-4" dir="rtl">
                          <div className="p-2.5 bg-dz-emerald/10 rounded-xl text-dz-emerald shrink-0">
                            <ShieldCheck size={20} />
                          </div>
                          <div className="space-y-1 text-right">
                            <h4 className="text-xs font-bold text-fg-faint font-arabic">{sec.guaranteeDetails.title}</h4>
                            <p className="text-xs text-fg-faint leading-relaxed font-arabic">{sec.guaranteeDetails.description}</p>
                          </div>
                        </div>
                      )}

                      {/* Testimonials */}
                      {sec.testimonials && sec.testimonials.length > 0 && (
                        <div className="my-4 space-y-3">
                          {sec.testimonials.map((t: any, tIndex: number) => (
                            <div key={tIndex} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm text-right" dir="rtl">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-fg-faint font-arabic">{t.name}</span>
                                <div className="flex text-amber-500 text-xs">
                                  {[...Array(t.rating || 5)].map((_, sIdx) => (
                                    <Star key={sIdx} size={8} fill="currentColor" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-fg-faint font-arabic leading-relaxed">{t.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Call To Action Buttons inside each relevant block */}
                      {sec.cta && (
                        <div className="mt-4">
                          <a 
                            href="#order-form"
                            className="w-full text-center text-fg py-3 rounded-xl font-bold font-arabic shadow-md flex items-center justify-center gap-2 hover:brightness-105 transition-all outline-none"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <span>{sec.cta.variations?.[0]?.text || "اتصل بنا واطلب الآن"}</span>
                            <ArrowRight size={14} className="animate-pulse" />
                          </a>
                          {sec.cta.subtext && (
                            <p className="text-xs text-center text-fg-muted mt-2 font-arabic" dir="rtl">
                              🔒 {sec.cta.subtext}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Simulated Order Form (Formulaire de Commande COD) */}
                <div id="order-form" className="p-5 bg-surface text-fg border-t border-line">
                  <div className="text-center mb-5 space-y-1">
                    <span className="text-xs font-semibold text-amber-500">Formulaire Rapide</span>
                    <h3 className="text-base font-bold font-arabic text-fg">قم بالطلب الآن مباشرة</h3>
                    <p className="text-xs text-fg-muted font-arabic">املأ الحقول التالية وسيتصل بك فريقنا فوراً لإرسال طلبك</p>
                  </div>

                  <form onSubmit={handleCheckoutFormSubmit} className="space-y-4">
                    {/* Full Name input */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-semibold text-fg-muted font-arabic">الاسم الكامل (Nom Complet) *</label>
                      <div className="relative">
                        <input 
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="الاسم واللقب..."
                          dir="rtl"
                          className="w-full bg-fg/5 border border-fg/10 rounded-xl px-4 pl-9 py-2.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald placeholder:text-fg-faint font-arabic"
                        />
                        <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                      </div>
                    </div>

                    {/* Phone input */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-semibold text-fg-muted font-arabic">رقم الهاتف (Téléphone) *</label>
                      <div className="relative">
                        <input 
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05 / 06 / 07..."
                          className="w-full bg-fg/5 border border-fg/10 rounded-xl px-4 pr-9 py-2.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald placeholder:text-fg-faint text-left"
                        />
                        <Phone size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                      </div>
                    </div>

                    {/* Wilaya select list */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-semibold text-fg-muted font-arabic">الولاية (Wilaya) *</label>
                      <div className="relative">
                        <select
                          required
                          value={wilaya}
                          onChange={(e) => setWilaya(e.target.value)}
                          dir="rtl"
                          className="w-full bg-fg/5 border border-fg/10 rounded-xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-dz-emerald placeholder:text-fg-faint font-arabic appearance-none"
                        >
                          <option value="" className="bg-surface text-fg-muted">اختر ولايتك...</option>
                          {ALGERIAN_WILAYAS.map((w) => (
                            <option key={w.code} value={w.name} className="bg-surface text-fg">
                              {w.code} - {w.name}
                            </option>
                          ))}
                        </select>
                        <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !fullName || !phone || !wilaya}
                      className="w-full text-center text-fg-faint font-bold py-4.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 font-arabic"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4 text-fg-faint" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>جاري تسجيل الطلب...</span>
                        </div>
                      ) : (
                        <>
                          <Sparkles size={14} className="animate-bounce" />
                          <span>تأكيد الطلب والشراء 🛒</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Simulated Footer */}
                <div className="p-4 bg-bg text-fg-muted text-xs font-bold text-center border-t border-slate-900 space-y-1">
                  <p className="font-arabic">حقوق الطبع محفوظة © {new Date().getFullYear()}</p>
                  <p className="">100% SECURE CHECKOUT • DZ COD HUB</p>
                </div>

              </div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
