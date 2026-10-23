// Stored item/category names stay in Tunisian Arabic (they are the keys); French is display-only.
export const CATEGORY_FR = {
  khodhra: 'Légumes', ghalla: 'Fruits', lham: 'Viandes, poissons & œufs', halib: 'Produits laitiers',
  khobz: 'Pain & céréales', monadhifat: 'Produits ménagers', okhra: 'Autres produits', moksarat: 'Fruits secs & graines',
}

export const PRODUCT_FR = {
  'طماطم': 'Tomates', 'بصل': 'Oignons', 'فلفل': 'Poivrons', 'فقوس': 'Concombres', 'سفنارية': 'Carottes', 'البطاطا': 'Pommes de terre',
  'الثوم': 'Ail', 'سبناخ': 'Épinards', 'الخس': 'Laitue', 'قرع احمر': 'Courge rouge', 'قرع اخضر': 'Courgettes', 'فلفل حار': 'Piment',
  'فلفل حلو': 'Poivron doux', 'فلفل احمر': 'Poivron rouge', 'جلبانة': 'Petits pois', 'باربة': 'Betteraves', 'بروكلي': 'Brocoli', 'كرنب': 'Chou',
  'تفاح': 'Pommes', 'بنان': 'Bananes', 'برتقان': 'Oranges', 'عنب': 'Raisin', 'دلاع': 'Pastèque', 'فراز': 'Fraises', 'أناناس': 'Ananas',
  'مانغا': 'Mangue', 'بطيخ': 'Melon', 'توت': 'Myrtilles', 'رمان': 'Grenade', 'كيوي': 'Kiwi', 'أفوكادو': 'Avocat',
  'دجاج': 'Poulet', 'لحم': 'Viande', 'حوت': 'Poisson', 'عضم': 'Œufs', 'كبدة': 'Foie', 'لحم مفروم': 'Viande hachée', 'لحم بقري': 'Bœuf',
  'لحم دجاج': 'Viande de poulet', 'تن': 'Thon', 'سردينه': 'Sardines', 'شفرات': 'Crevettes', 'سومون': 'Saumon', 'سكالوب': 'Escalope', 'ماكرو': 'Maquereau', 'فواكه البحر': 'Fruits de mer',
  'حليب': 'Lait', 'جبن مرحي': 'Fromage (jben)', 'زبدة': 'Beurre', 'ياغورت': 'Yaourt', 'لبن': 'Lben', 'فرماج': 'Fromage', 'متزارلا': 'Mozzarella', 'كرام فراش': 'Crème fraîche',
  'خبز': 'Pain', 'مقرونة': 'Pâtes', 'رز': 'Riz', 'كسكسي': 'Couscous', 'فرينة': 'Farine', 'سميد': 'Semoule', 'خبز تركي': 'Pain turc', 'بريك': 'Feuilles de brik',
  'نواصر': 'Nwasser', 'شوفان': "Flocons d'avoine", 'رز كامل': 'Riz complet', 'خبز كامل': 'Pain complet', 'عدس': 'Lentilles', 'كينوا': 'Quinoa',
  'صابون يدين': 'Savon pour les mains', 'معجون الأسنان': 'Dentifrice', 'مناديل صغيرة': 'Petits mouchoirs', 'مناديل كبيرة': 'Grands mouchoirs',
  'جافال': 'Eau de Javel', 'لسيف الغسالة': 'Lessive', 'بارفان الغسالة': 'Adoucissant', 'بارفان الدار': "Parfum d'intérieur", 'بارفان الأرضية': 'Parfum pour sol',
  'لنجات': 'Lingettes', 'فرشاة أسنان': 'Brosse à dents',
  'زيت الزيتون': "Huile d'olive", 'ملح': 'Sel', 'سكر': 'Sucre', 'قهوة': 'Café', 'تاي': 'Thé', 'هريسة': 'Harissa', 'زيتون اكحل': 'Olives noires',
  'زيتون اخضر': 'Olives vertes', 'عسل': 'Miel', 'عصير': 'Jus', 'قازوز': 'Soda', 'حكة هريسة': 'Harissa en boîte', 'حكة طماطم': 'Tomate en boîte',
  'شكلاطو': 'Chocolat', 'ماء': 'Eau',
  'لوز': 'Amandes', 'جوز': 'Noix', 'فستق': 'Pistaches', 'كاوكاو': 'Cacahuètes', 'بندق': 'Noisettes', 'لوبيا': 'Niébé', 'حمص': 'Pois chiches',
  'قلوب قرع': 'Graines de courge', 'اكاجو': 'Noix de cajou', 'سمسم': 'Sésame', 'بذور الشيا': 'Graines de chia', 'بذور الكتان': 'Graines de lin',
}

export const UI = {
  ar: {
    appTitle: 'قفتي للتسوق', backToList: 'ارجع لقائمة الحوايج', closeSearch: 'سكر البحث', openSearch: 'ابحث في القائمة',
    viewBasket: 'شوف القفة', viewBasketCount: (n) => `شوف القفة، فيها ${n} حاجة`, backToListShort: 'ارجع للقائمة',
    progress: 'اللي تشرى', progressLabel: (n, total) => `${n} من ${total} حاجة متشرية`, basketTitle: 'القفة',
    searchPlaceholder: 'ابحث عن حاجة...', noResult: 'ما لقيتش حاجة', tryOther: 'جرب كلمة أخرى',
    basketEmpty: 'قفتك فارغة', basketHint: 'اختار اللي حاجتك فيه من القائمة', basketLabel: 'الحوايج اللي في القفة',
    share: 'شارك القفة', clear: 'فرّغ القفة', addPlaceholder: 'زيد حاجة...', add: 'زيد', addTo: (c) => `زيد حاجة في ${c}`,
    added: (n) => `${n} تزيدت للقائمة`, remove: (n) => `انحي ${n} من القائمة`, qty: (n) => `كمية ${n}`,
    less: (n) => `نقص من كمية ${n}`, more: (n) => `زيد في كمية ${n}`,
    saveError: 'ما نجمتش نحفظ القائمة على الجهاز', cleared: 'القفة تفرغت', sent: 'القفة تبعثت',
    copied: 'القائمة تنسخت، تنجم تلصقها و تبعثها لصاحبك', whatsapp: 'حلّينا واتساب باش تبعث القفة',
    healthTitle: 'مفيد للصحة الجنسية والدورة الدموية ضمن غذاء متوازن', healthLabel: 'مفيد للصحة الجنسية',
    language: 'Français', languageLabel: 'Passer en français',
    description: 'قائمة شراء تونسية تحفظ قفتك على جهازك وتخليك تشاركها بسهولة.', docTitle: 'قائمة الشراء',
  },
  fr: {
    appTitle: 'Ma liste de courses', backToList: 'Retour à la liste', closeSearch: 'Fermer la recherche', openSearch: 'Rechercher dans la liste',
    viewBasket: 'Voir le panier', viewBasketCount: (n) => `Voir le panier, ${n} article${n > 1 ? 's' : ''}`, backToListShort: 'Retour à la liste',
    progress: 'Articles cochés', progressLabel: (n, total) => `${n} sur ${total} articles cochés`, basketTitle: 'Panier',
    searchPlaceholder: 'Chercher un produit...', noResult: 'Aucun résultat', tryOther: 'Essayez un autre mot',
    basketEmpty: 'Votre panier est vide', basketHint: 'Choisissez vos produits dans la liste', basketLabel: 'Produits du panier',
    share: 'Partager le panier', clear: 'Vider le panier', addPlaceholder: 'Ajouter un produit...', add: 'Ajouter', addTo: (c) => `Ajouter un produit dans ${c}`,
    added: (n) => `${n} ajouté à la liste`, remove: (n) => `Retirer ${n} de la liste`, qty: (n) => `Quantité de ${n}`,
    less: (n) => `Diminuer la quantité de ${n}`, more: (n) => `Augmenter la quantité de ${n}`,
    saveError: "Impossible d'enregistrer la liste sur l'appareil", cleared: 'Panier vidé', sent: 'Panier envoyé',
    copied: 'Liste copiée, vous pouvez la coller et l\'envoyer', whatsapp: 'WhatsApp ouvert pour envoyer le panier',
    healthTitle: 'Bon pour la santé sexuelle et la circulation, dans le cadre d\'une alimentation équilibrée', healthLabel: 'Bon pour la santé sexuelle',
    language: 'العربية', languageLabel: 'التبديل إلى العربية',
    description: 'Liste de courses tunisienne enregistrée sur votre appareil et facile à partager.', docTitle: 'Liste de courses',
  },
}
