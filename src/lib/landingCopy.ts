/**
 * The fixed text of a landing page (buttons, form, reassurance) in the three page languages, the wilayas, and the
 * phone check. The seller's own copy comes from the generator; these are the words around it.
 */

export type PageLanguage = 'ar' | 'fr' | 'en';

export const WILAYAS = [
  '01 - Adrar - أدرار', '02 - Chlef - الشلف', '03 - Laghouat - الأغواط', '04 - Oum El Bouaghi - أم البواقي', '05 - Batna - باتنة',
  '06 - Béjaïa - بجاية', '07 - Biskra - بسكرة', '08 - Béchar - بشار', '09 - Blida - البليدة', '10 - Bouira - البويرة',
  '11 - Tamanrasset - تمنراست', '12 - Tébessa - تبسة', '13 - Tlemcen - تلمسان', '14 - Tiaret - تيارت', '15 - Tizi Ouzou - تيزي وزو',
  '16 - Alger - الجزائر', '17 - Djelfa - الجلفة', '18 - Jijel - جيجل', '19 - Sétif - سطيف', '20 - Saïda - سعيدة',
  '21 - Skikda - سكيكدة', '22 - Sidi Bel Abbès - سيدي بلعباس', '23 - Annaba - عنابة', '24 - Guelma - قالمة', '25 - Constantine - قسنطينة',
  '26 - Médéa - المدية', '27 - Mostaganem - مستغانم', "28 - M'Sila - المسيلة", '29 - Mascara - معسكر', '30 - Ouargla - ورقلة',
  '31 - Oran - وهران', '32 - El Bayadh - البيض', '33 - Illizi - إليزي', '34 - Bordj Bou Arréridj - برج بوعريريج', '35 - Boumerdès - بومرداس',
  '36 - El Tarf - الطارف', '37 - Tindouf - تندوف', '38 - Tissemsilt - تيسمسيلت', '39 - El Oued - الوادي', '40 - Khenchela - خنشلة',
  '41 - Souk Ahras - سوق أهراس', '42 - Tipaza - تيبازة', '43 - Mila - ميلة', '44 - Aïn Defla - عين الدفلى', '45 - Naâma - النعامة',
  '46 - Aïn Témouchent - عين تموشنت', '47 - Ghardaïa - غرداية', '48 - Relizane - غليزان', '49 - Timimoun - تيميمون', '50 - Bordj Badji Mokhtar - برج باجي مختار',
  '51 - Ouled Djellal - أولاد جلال', '52 - Béni Abbès - بني عباس', '53 - In Salah - عين صالح', '54 - In Guezzam - عين قزام', '55 - Touggourt - تقرت',
  '56 - Djanet - جانت', "57 - El M'Ghair - المغير", '58 - El Meniaa - المنيعة',
];

/** Algerian mobile number: 05/06/07 followed by 8 digits, or the same with the 213 country code. */
export const DZ_PHONE = /^(?:0|\+?213)[567]\d{8}$/;

export type CopyKey =
  | 'order' | 'orderShort' | 'orderTitle' | 'name' | 'phone' | 'wilaya' | 'chooseWilaya' | 'address' | 'quantity' | 'submit' | 'thanks'
  | 'badPhone' | 'missing' | 'cod' | 'nationwide' | 'guarantee' | 'inspection' | 'freeDelivery' | 'feature' | 'us'
  | 'others' | 'price' | 'newOrder' | 'reviewsTitle' | 'reviewShot' | 'subtotal' | 'total' | 'deliveryLabel'
  | 'byWilaya' | 'free' | 'plusDelivery' | 'stepsTitle' | 'step1' | 'step2' | 'step3' | 'questions' | 'codNote'
  | 'rights' | 'photo' | 'save' | 'promisesLabel' | 'gallery';

export const TEXT: Record<PageLanguage, Record<CopyKey, string>> = {
  ar: {
    order: 'اطلب الآن', orderShort: 'اطلب الآن', orderTitle: 'اطلب الآن — الدفع عند الاستلام', name: 'الاسم الكامل', phone: 'رقم الهاتف', wilaya: 'الولاية',
    chooseWilaya: 'اختر الولاية', address: 'البلدية / العنوان', quantity: 'الكمية', submit: 'تأكيد الطلب',
    thanks: 'شكراً! تم تسجيل طلبك، سنتصل بك قريباً لتأكيده.', badPhone: 'رقم الهاتف غير صحيح. مثال: 0555123456',
    missing: 'يرجى ملء جميع الحقول.', cod: 'الدفع عند الاستلام', nationwide: 'توصيل إلى 58 ولاية', guarantee: 'ضمان الجودة',
    inspection: 'عاين المنتج قبل الدفع', freeDelivery: 'توصيل مجاني',
    feature: 'الميزة', us: 'منتجنا', others: 'الآخرون', price: 'السعر', newOrder: 'طلب جديد',
    reviewsTitle: 'آراء زبائننا', reviewShot: 'رأي أحد زبائننا', subtotal: 'المنتج', total: 'المجموع', deliveryLabel: 'التوصيل',
    byWilaya: 'حسب الولاية', free: 'مجاني', plusDelivery: ' + التوصيل', stepsTitle: 'كيف تطلب؟', step1: 'املأ الاستمارة',
    step2: 'نتصل بك لتأكيد الطلب', step3: 'تستلم وتدفع عند الباب', questions: 'عندك سؤال؟ راسلنا على واتساب',
    codNote: 'لا تدفع شيئاً الآن: الدفع عند الاستلام', rights: 'جميع الحقوق محفوظة', photo: 'الصورة {n}', save: 'تخفيض', promisesLabel: 'الدفع والتوصيل', gallery: 'صور المنتج',
  },
  fr: {
    order: 'Commander maintenant', orderShort: 'Commander', orderTitle: 'Commandez — paiement à la livraison', name: 'Nom complet', phone: 'Téléphone', wilaya: 'Wilaya',
    chooseWilaya: 'Choisissez votre wilaya', address: 'Commune / adresse', quantity: 'Quantité', submit: 'Confirmer la commande',
    thanks: 'Merci ! Votre commande est enregistrée, nous vous appelons pour la confirmer.', badPhone: 'Numéro invalide. Exemple : 0555123456',
    missing: 'Merci de remplir tous les champs.', cod: 'Paiement à la livraison', nationwide: 'Livraison dans les 58 wilayas', guarantee: 'Qualité garantie',
    inspection: 'Vérifiez avant de payer', freeDelivery: 'Livraison gratuite',
    feature: 'Critère', us: 'Notre produit', others: 'Les autres', price: 'Prix', newOrder: 'Nouvelle commande',
    reviewsTitle: 'L’avis de nos clients', reviewShot: 'Avis d’un client', subtotal: 'Produit', total: 'Total', deliveryLabel: 'Livraison',
    byWilaya: 'selon la wilaya', free: 'Gratuite', plusDelivery: ' + livraison', stepsTitle: 'Comment commander ?',
    step1: 'Remplissez le formulaire', step2: 'Nous vous appelons pour confirmer', step3: 'Vous payez à la réception',
    questions: 'Une question ? Écrivez-nous sur WhatsApp', codNote: 'Rien à payer maintenant : paiement à la livraison',
    rights: 'Tous droits réservés', photo: 'Photo {n}', save: 'Réduction', promisesLabel: 'Paiement et livraison', gallery: 'Photos du produit',
  },
  en: {
    order: 'Order now', orderShort: 'Order', orderTitle: 'Order now — pay on delivery', name: 'Full name', phone: 'Phone number', wilaya: 'Wilaya',
    chooseWilaya: 'Choose your wilaya', address: 'Town / address', quantity: 'Quantity', submit: 'Confirm my order',
    thanks: 'Thank you! Your order is in, we will call you to confirm it.', badPhone: 'Invalid phone number. Example: 0555123456',
    missing: 'Please fill in every field.', cod: 'Cash on delivery', nationwide: 'Delivery to all 58 wilayas', guarantee: 'Quality guaranteed',
    inspection: 'Check it before you pay', freeDelivery: 'Free delivery',
    feature: 'Feature', us: 'Our product', others: 'Others', price: 'Price', newOrder: 'New order',
    reviewsTitle: 'What our customers say', reviewShot: 'A customer’s review', subtotal: 'Product', total: 'Total', deliveryLabel: 'Delivery',
    byWilaya: 'depends on the wilaya', free: 'Free', plusDelivery: ' + delivery', stepsTitle: 'How to order', step1: 'Fill in the form',
    step2: 'We call you to confirm', step3: 'You pay on delivery', questions: 'A question? Message us on WhatsApp',
    codNote: 'Nothing to pay now: cash on delivery', rights: 'All rights reserved', photo: 'Photo {n}', save: 'Discount', promisesLabel: 'Payment and delivery', gallery: 'Product photos',
  },
};

/** The page language: the one chosen in the tool, otherwise the language the copy is written in. */
export function pageLanguage(choice: string | undefined, samples: string[]): PageLanguage {
  const c = (choice ?? '').trim();
  if (c === 'ar' || c === 'fr' || c === 'en') return c;
  if (/arab|darija|عرب/i.test(c)) return 'ar';
  if (/fran/i.test(c)) return 'fr';
  if (/angl|english/i.test(c)) return 'en';
  return samples.some((s) => /[؀-ۿ]/.test(s)) ? 'ar' : 'fr';
}
