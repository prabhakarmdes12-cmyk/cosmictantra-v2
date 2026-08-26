'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Star, 
  Send, 
  ArrowRight, 
  Heart, 
  Filter, 
  Layers, 
  Tag, 
  Package, 
  Sun, 
  Truck, 
  Clock, 
  Phone, 
  X,
  Eye,
  Info
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { playBell, playTick, playFlowerDrop } from '@/lib/chitiAudio';
import { getProfiles } from '@/lib/profileStore';

export interface ProductItem {
  id: string;
  name: string;
  nameHi: string;
  category: 'DIYA' | 'DHOOP' | 'POSHAK' | 'SAMAGRI' | 'MALA_YANTRA' | 'PUJA_KITS';
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  purityCertification: string;
  purityCertificationHi: string;
  description: string;
  descriptionHi: string;
  contents: string[];
  imageUrl: string;
  inStock: boolean;
  weightOrSize: string;
}

const STORE_PRODUCTS: ProductItem[] = [
  // 1. Brass Diya & Akhand Deep
  {
    id: 'prod-diya-1',
    name: 'Pure Brass Akhand Diya with Glass Chimney',
    nameHi: 'पीतल अखण्ड दीप (कांच चिमनी सहित)',
    category: 'DIYA',
    price: 649,
    originalPrice: 999,
    rating: 4.9,
    reviewsCount: 382,
    badge: 'सर्वाधिक लोकप्रिय (Best Seller)',
    purityCertification: '100% Solid Brass (अष्टधातु मिश्रित पीतल)',
    purityCertificationHi: '१००% शुद्ध पीतल — अखण्ड ज्योति हेतु सुरक्षित',
    description: 'Heavy gauge brass Akhand Jyoti Diya designed for continuous 24-hour burning during Navratri, Diwali, and daily temple puja. Comes with thermal borosilicate glass protection.',
    descriptionHi: 'नवरात्रि एवं दैनिक पूजा में २४ घण्टे अखण्ड ज्योति प्रज्वलन हेतु सर्वोत्तम भारी पीतल का दीया। कांच चिमनी से वायु से पूर्ण सुरक्षा।',
    contents: ['1x Heavy Brass Diya Base', '1x Heat-Resistant Borosilicate Chimney', '1x Brass Lid with OM finial', '50x Pure Cotton Wicks'],
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    weightOrSize: '350 grams • 6.5 inches'
  },
  {
    id: 'prod-diya-2',
    name: 'Traditional Brass Kuber Diya Set (Pack of 4)',
    nameHi: 'पारम्परिक कुबेर दीप सेट (४ का सेट)',
    category: 'DIYA',
    price: 399,
    originalPrice: 599,
    rating: 4.8,
    reviewsCount: 245,
    badge: 'शुभ लक्ष्मी-कुबेर',
    purityCertification: 'Pure Brass with Gloss Polish',
    purityCertificationHi: 'शुद्ध पीतल • धन-समृद्धि वर्धक',
    description: 'Handcrafted traditional Kuber Diyas ideal for Mandir sthapana, entrance threshold lighting, and Sandhya Aarti.',
    descriptionHi: 'दैनिक सन्ध्या आरती एवं मन्दिर देहरी पर दीप प्रज्वलन हेतु हाथ से निर्मित पारम्परिक कुबेर दीये।',
    contents: ['4x Pure Brass Kuber Diyas', 'Pack of 100 Cotton Phool Batti'],
    imageUrl: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    weightOrSize: '220 grams total • 2.5 inches each'
  },
  {
    id: 'prod-diya-3',
    name: 'Brass 5-Tier Panchaarti Camphor Lamp',
    nameHi: 'पंचारती पीतल महाआरती दीप',
    category: 'DIYA',
    price: 549,
    originalPrice: 850,
    rating: 4.9,
    reviewsCount: 198,
    badge: 'वैदिक महाआरती',
    purityCertification: 'Heavy Brass with Wooden Handle',
    purityCertificationHi: 'लकड़ी के हैंडल युक्त शुद्ध पीतल',
    description: 'Authentic 5-wick Panchaarti lamp with wooden grip handle for performing morning and evening temple Maha Aarti.',
    descriptionHi: 'मन्दिरों जैसी दिव्य पंचारती हेतु ५ दीप मुख एवं कपूर पात्र युक्त लकड़ी के हत्थे वाला पावन दीप।',
    contents: ['1x Panchaarti Brass Stand with Wood Grip'],
    imageUrl: '/images/store/brass-panchaarti-lamp.jpg',
    inStock: true,
    weightOrSize: '310 grams • 8 inches length'
  },

  // 2. Dhoop, Agarbatti & Sambrani Cups
  {
    id: 'prod-dhoop-1',
    name: 'Pure Cow Dung Guggal & Loban Havan Cups (12 Pcs)',
    nameHi: 'गोबर गुग्गल व लोबान हवन कप (१२ पीस)',
    category: 'DHOOP',
    price: 299,
    originalPrice: 450,
    rating: 4.9,
    reviewsCount: 512,
    badge: '100% Charcoal-Free',
    purityCertification: 'Desi Gir Cow Dung + Guggal + Natural Herbs',
    purityCertificationHi: 'देशी गिर गोमय + शुद्ध गुग्गल + औषधीय जड़ी-बूटी',
    description: 'Chemical-free and charcoal-free mini havan cups made from Desi Cow dung and charged with pure Guggal, Loban, and Jatamansi. Purifies home atmosphere and clears negative energy.',
    descriptionHi: 'कोयला रहित प्राकृतिक हवन कप। देशी गाय के गोबर और शुद्ध गुग्गल से निर्मित। घर की नकारात्मक ऊर्जा का शमन और वास्तु शुद्धि करता है।',
    contents: ['12x Mini Havan Cups', '1x Fiber Burner Plate'],
    imageUrl: '/images/store/cowdung-havan-cups.jpg',
    inStock: true,
    weightOrSize: '12 Cups Box (20 mins burn each)'
  },
  {
    id: 'prod-dhoop-2',
    name: 'Pure Mysore Sandalwood Organic Agarbatti (150g)',
    nameHi: 'मैसूर शुद्ध चन्दन प्राकृतिक अगरबत्ती',
    category: 'DHOOP',
    price: 349,
    originalPrice: 499,
    rating: 4.8,
    reviewsCount: 310,
    badge: 'दिव्य सुगन्ध',
    purityCertification: 'Pure Sandalwood Extract & Bamboo Sticks',
    purityCertificationHi: 'प्राकृतिक चन्दन तेल एवं जड़ी-बूटियाँ',
    description: 'Long-lasting sacred Chandan incense sticks hand-rolled in Mysore. Zero synthetic chemicals, safe for daily indoor meditation.',
    descriptionHi: 'मैसूर के असली चन्दन काष्ठ से निर्मित सुगन्धित अगरबत्तियाँ। मन्दिर व ध्यान साधना हेतु मन को शान्त करने वाली।',
    contents: ['150 grams sticks (Approx 80 sticks)'],
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    weightOrSize: '150 grams • 9 inches length'
  },
  {
    id: 'prod-dhoop-3',
    name: 'Original Bhimseni Pure Camphor Crystals (200g)',
    nameHi: 'असली भीमसेनी शुद्ध कपूर (२०० ग्राम)',
    category: 'DHOOP',
    price: 399,
    originalPrice: 599,
    rating: 5.0,
    reviewsCount: 428,
    badge: '100% शुद्ध पारदर्शी',
    purityCertification: 'Pure Pine Tree Extract • Leaves Zero Ash',
    purityCertificationHi: 'पेड़ से प्राप्त प्राकृतिक भीमसेनी कपूर • शून्य राख',
    description: 'Authentic Ayurvedic Bhimseni Kapoor that evaporates completely without leaving residue. Essential for daily Aarti and positive aura creation.',
    descriptionHi: 'असली भीमसेनी कपूर जो जलने के बाद कोई अवशेष या कालिख नहीं छोड़ता। दैनिक आरती एवं वास्तु दोष निवारण हेतु सर्वोत्तम।',
    contents: ['200g Airtight Jar with Desiccant'],
    imageUrl: '/images/store/bhimseni-camphor.jpg',
    inStock: true,
    weightOrSize: '200 grams jar'
  },

  // 3. Deity Poshak & Idol Dresses
  {
    id: 'prod-poshak-1',
    name: 'Laddu Gopal Zari Heavy Velvet Poshak with Mukut & Flute (Size 2/3/4)',
    nameHi: 'लड्डू गोपाल जी की भारी जरी पोशाक + मुकुट व बांसुरी सेट',
    category: 'POSHAK',
    price: 499,
    originalPrice: 799,
    rating: 4.9,
    reviewsCount: 260,
    badge: 'राजभोग शृंगार',
    purityCertification: 'Pure Silk Velvet with Golden Zari & Stone Work',
    purityCertificationHi: 'शुद्ध सिल्क वेलवेट + स्वर्ण जरी व कुन्दन कार्य',
    description: 'Exquisite royal embroidered dress set for Laddu Gopal Ji including matching designer Mukut (crown), Bansuri (flute), and Kundan necklace.',
    descriptionHi: 'ठाकुर जी / लड्डू गोपाल जी हेतु शाही जरी पोशाक, पगड़ी/मुकुट, मोरपंख, बांसुरी एवं सुन्दर कण्ठमाला का पूर्ण सेट।',
    contents: ['1x Royal Zari Poshak', '1x Matching Mukut', '1x Golden Bansuri', '1x Kundan Haar & Earring Set'],
    imageUrl: 'https://images.unsplash.com/photo-1705861144571-7cb463c6cba9?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    weightOrSize: 'Size 2-4 (Fits 3 to 6 inch vigraha)'
  },
  {
    id: 'prod-poshak-2',
    name: 'Mata Rani Navratri Shringar Kit & Zari Chunri (Full Set)',
    nameHi: 'माँ दुर्गा / लक्ष्मी जी का सम्पूर्ण शृंगार सेट + जरी चुनरी',
    category: 'POSHAK',
    price: 599,
    originalPrice: 899,
    rating: 5.0,
    reviewsCount: 315,
    badge: '१६ शृंगार परिपूर्ण',
    purityCertification: 'Gold Brocade Silk + 16 Shringar Samagri',
    purityCertificationHi: 'स्वर्ण जरी रेशमी चुनरी + १६ मंगल शृंगार',
    description: 'Complete 16-item Shringar offering for Devi Durga, Lakshmi, and Saraswati during Friday Puja and Navratri festival.',
    descriptionHi: 'देवी माँ को अर्पित करने हेतु लाल गोटा-पट्टी जरी चुनरी, सिन्दूर, बिन्दी, महावर, चूड़ियां, पायल, काजल, इत्र एवं सम्पूर्ण १६ शृंगार।',
    contents: ['1x 1-Meter Golden Lace Chunri', '1x 16-Item Shringar Box', '1x Pure Ittar Bottle', '1x Ganga Sindoor'],
    imageUrl: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    weightOrSize: 'Full Shringar Box Set'
  },
  {
    id: 'prod-poshak-3',
    name: 'Radha Krishna Silk Designer Yugal Jodi Poshak',
    nameHi: 'राधा-कृष्ण युगल जोड़ी रेशमी पोशाक सेट',
    category: 'POSHAK',
    price: 899,
    originalPrice: 1399,
    rating: 4.9,
    reviewsCount: 184,
    badge: 'वृन्दावन कारीगरी',
    purityCertification: 'Fine Jacquard Silk with Hand Embroidery',
    purityCertificationHi: 'फाइन बनारसी सिल्क + हस्तशिल्प कढ़ाई',
    description: 'Matching yellow/golden designer attire set tailored for Sri Radha Krishna idol worship with fine hand embroidery from Vrindavan.',
    descriptionHi: 'श्री राधा-कृष्ण जी के विग्रह हेतु पीताम्बर एवं चुनरी का सम्मिलित युगल पोशाक सेट।',
    contents: ['1x Krishna Dhoti & Patka Set', '1x Radha Rani Lehenga & Dupatta', '2x Pagdi / Mukut Set'],
    imageUrl: 'https://images.unsplash.com/photo-1608408891486-f5194b6845cc?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    weightOrSize: 'Fits 6 to 9 inch Yugal Vigraha'
  },

  // 4. Pure Havan & Puja Samagri
  {
    id: 'prod-samagri-1',
    name: 'A2 Vedic Bilona Desi Gir Cow Ghee for Puja & Havan (500ml)',
    nameHi: 'A2 वैदिक बिलोना देशी गिर गाय का शुद्ध घी (५००ml)',
    category: 'SAMAGRI',
    price: 799,
    originalPrice: 1100,
    rating: 5.0,
    reviewsCount: 470,
    badge: 'वैदिक मन्थन विधि',
    purityCertification: '100% Pure A2 Gir Cow Milk • Wood Pressed Bilona',
    purityCertificationHi: '१००% देशी गाय का मक्खन मथकर निर्मित शुद्ध घी',
    description: 'Traditional curd-churned A2 Desi cow ghee made using the sacred Vedic Bilona method. Ideal for sacred Homa fire, Akhand Jyoti, and deity Abhishek.',
    descriptionHi: 'पारम्परिक बिलोना विधि से निर्मित शुद्ध गौघृत। हवन कुण्ड की अग्नि एवं देवताओं के नैवेद्य हेतु सर्वोत्तम।',
    contents: ['500ml Glass Jar'],
    imageUrl: '/images/store/a2-gir-cow-ghee.jpg',
    inStock: true,
    weightOrSize: '500 ml Glass Jar'
  },
  {
    id: 'prod-samagri-2',
    name: 'Kashi Vishwanath Certified Sacred Gangajal (1 Litre Copper Seal Bottle)',
    nameHi: 'श्री काशी विश्वनाथ धाम प्रमाणित पावन गंगाजल (१ लीटर)',
    category: 'SAMAGRI',
    price: 199,
    originalPrice: 299,
    rating: 5.0,
    reviewsCount: 890,
    badge: 'उत्तरवाहिनी गंगाजल',
    purityCertification: 'Bottled at Manikarnika/Dashashwamedh Ghats Kashi',
    purityCertificationHi: 'काशी में वैदिक मन्त्रोच्चार सहित भरा गया शुद्ध गंगाजल',
    description: 'Directly bottled unadulterated sacred Ganga water from the holy river banks of Varanasi for temple Abhishek, Sankalpa, and purification rituals.',
    descriptionHi: 'भगवान शिव के अभिषेक, दैनिक पूजा संकल्प एवं घर के शुद्धि-मार्जन हेतु पवित्र काशी से प्राप्त गंगाजल।',
    contents: ['1x 1000ml Sealed Bottle with Brass Seal'],
    imageUrl: '/images/store/kashi-gangajal.jpg',
    inStock: true,
    weightOrSize: '1 Litre Sealed Bottle'
  },
  {
    id: 'prod-samagri-3',
    name: 'Ashta Gandha & Roli-Chandan Tilak Box (Pure Kashi Scent)',
    nameHi: 'अष्टगन्ध चन्दन व कुमकुम तिलक डिब्बी सेट',
    category: 'SAMAGRI',
    price: 249,
    originalPrice: 350,
    rating: 4.8,
    reviewsCount: 195,
    badge: 'शास्त्रोक्त अष्टगन्ध',
    purityCertification: 'Kasturi, Kesar, Chandan, Kapoor, Agar, Tagar Blend',
    purityCertificationHi: 'केसर, चन्दन, कस्तूरी व गोरोचन का शास्त्रसम्मत मिश्रण',
    description: 'Eight sacred fragrances blended as per Agamic scriptures for deity Tilak and daily Ajna chakra activation.',
    descriptionHi: 'भगवान शिव, विष्णु एवं गुरुदेव को तिलक करने हेतु शास्त्रोक्त अष्टगन्ध चन्दन एवं कुमकुम।',
    contents: ['1x 50g Ashta Gandha Jar', '1x 50g Pure Kumkum Jar', '1x Brass Tilak Stick'],
    imageUrl: '/images/store/ashtagandha-tilak.jpg',
    inStock: true,
    weightOrSize: '100g total'
  },

  // 5. Sacred Rudraksha, Mala & Yantras
  {
    id: 'prod-mala-1',
    name: 'Original 5-Mukhi Nepali Rudraksha Japa Mala (108+1 Beads, Lab Certified)',
    nameHi: 'असली ५-मुखी नेपाली रुद्राक्ष जप माला (१०८+१ मनके, लैब प्रमाणित)',
    category: 'MALA_YANTRA',
    price: 999,
    originalPrice: 1599,
    rating: 5.0,
    reviewsCount: 620,
    badge: 'लैब सर्टिफाइड (Certified)',
    purityCertification: 'Natural Elaeocarpus Ganitrus • X-Ray Verified Seeds',
    purityCertificationHi: 'नेपाल के मूल वृक्षों से प्राप्त • प्राकृतिक ५ मुखी',
    description: 'Authentic 108+1 bead Nepali Rudraksha mala strung with knots on red sacred thread. Energized with Mahamrityunjaya Mantra for meditation and japa.',
    descriptionHi: 'महामृत्युंजय मन्त्र से अभिमंत्रित १०८+१ नेपाली रुद्राक्ष की सिद्ध माला। मानसिक शान्ति, स्वास्थ्य एवं शिव कृपा प्रदाता।',
    contents: ['1x 108+1 Rudraksha Mala', '1x Gemological Lab Test Certificate', '1x Cotton Gomukhi Japa Bag'],
    imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    weightOrSize: '8mm beads • 108+1 count'
  },
  {
    id: 'prod-mala-2',
    name: 'Energized Copper Shri Yantra (3x3 inch, Vedic Geometry)',
    nameHi: 'सिद्ध ताम्र श्रीयंत्र (३x३ इंच, शुद्ध वैदिक ज्यामिति)',
    category: 'MALA_YANTRA',
    price: 499,
    originalPrice: 799,
    rating: 4.9,
    reviewsCount: 290,
    badge: 'लक्ष्मी कृपा प्रदायक',
    purityCertification: '99.9% Pure Copper Plate • Deep Etched',
    purityCertificationHi: 'शुद्ध ताँबा प्लेट • सूक्ष्म वैदिक रेखांकन',
    description: 'Precision-etched Mahalakshmi Sri Yantra energised with Sri Suktam chants. Placed in temple or cash locker to attract abundance.',
    descriptionHi: 'श्रीसूक्त के मन्त्रों से प्राण-प्रतिष्ठित शुद्ध ताँबे का श्रीयंत्र। व्यापार वृद्धि, गृह-शान्ति एवं लक्ष्मी आकर्षण हेतु।',
    contents: ['1x Copper Shri Yantra Plate', '1x Brass Display Stand', '1x Puja Vidhi Booklet'],
    imageUrl: '/images/store/copper-shri-yantra.jpg',
    inStock: true,
    weightOrSize: '3 x 3 inches • 120 grams'
  },

  // 6. Complete Festival & Daily Puja Kits
  {
    id: 'prod-kit-1',
    name: 'Complete Vedic Sandhya Aarti & Daily Puja Kit (32 Sacred Items)',
    nameHi: 'सम्पूर्ण दैनिक पूजा व सन्ध्या आरती किट (३२ पावन सामग्रियां)',
    category: 'PUJA_KITS',
    price: 1199,
    originalPrice: 1899,
    rating: 5.0,
    reviewsCount: 410,
    badge: 'सम्पूर्ण मन्दिर किट',
    purityCertification: 'Complete All-in-One Certified Vedic Essentials',
    purityCertificationHi: '३२ पावन वैदिक सामग्रियों से परिपूर्ण किट',
    description: 'Comprehensive puja box containing pure Bhimseni Camphor, Guggal Dhoop, Roli, Akshat, Gangajal, Janeu, Mauli, Supari, Kapoor Aarti, Dhoop holder, and Cotton wicks.',
    descriptionHi: 'नये मन्दिर, गृह प्रवेश अथवा दैनिक पूजा हेतु आवश्यक समस्त ३२ वैदिक सामग्रियों का एक सुसज्जित बॉक्स।',
    contents: ['Bhimseni Camphor', 'Gir Cow Ghee (200ml)', 'Guggal Dhoop', 'Kashi Gangajal', 'Roli, Chandan, Haldi', 'Janeu (5 pcs)', 'Akshat, Supari, Laung, Elaichi', 'Matchbox & Brass Diya'],
    imageUrl: '/images/store/vedic-daily-puja-kit.jpg',
    inStock: true,
    weightOrSize: '1.4 kg Premium Gift Box'
  },
  {
    id: 'prod-kit-2',
    name: 'Shri Navratri Durga Puja Mahasamagri Box',
    nameHi: 'श्री नवरात्रि दुर्गा पूजा महासामग्री बॉक्स',
    category: 'PUJA_KITS',
    price: 1499,
    originalPrice: 2299,
    rating: 4.9,
    reviewsCount: 350,
    badge: 'नवरात्रि विशेष',
    purityCertification: 'Navarna Mantra Energized Samagri Set',
    purityCertificationHi: '९ दिनों की अखण्ड साधना हेतु सम्पूर्ण सामग्री',
    description: 'Specially curated 9-day Navratri festival box with Kalash, Coconut, Jau seeds for Khetri, Red cloth, Chunri, Hawan samagri, and 9 Devi offerings.',
    descriptionHi: 'कलश स्थापना, जौ बोने के पात्र, हवन सामग्री, लाल चुनरी, नारियल, एवं ९ देवियों के शृंगार सहित पूर्ण नवरात्रि महाकिट।',
    contents: ['Copper Kalash & Coconut', 'Desi Jau Seeds (100g)', 'Pure Red Puja Cloth', 'Devi Chunri & Shringar', 'Hawan Samagri (500g)', 'Ghee & Camphor'],
    imageUrl: '/images/store/navratri-durga-kit.jpg',
    inStock: true,
    weightOrSize: '2.1 kg Box'
  }
];

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<Array<{ product: ProductItem; quantity: number }>>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [devoteePhone, setDevoteePhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  // Load profile name and cart from localStorage
  useEffect(() => {
    try {
      const profiles = getProfiles();
      if (profiles && profiles.length > 0 && profiles[0].name) {
        setDevoteeName(profiles[0].name);
      }
      const savedCart = localStorage.getItem('cosmictantra_pooja_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {}
  }, []);

  // Save cart to localStorage
  const saveCart = (newCart: Array<{ product: ProductItem; quantity: number }>) => {
    setCart(newCart);
    try {
      localStorage.setItem('cosmictantra_pooja_cart', JSON.stringify(newCart));
    } catch {}
  };

  // Add to cart handler
  const handleAddToCart = (product: ProductItem) => {
    playBell();
    playFlowerDrop();
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      saveCart(updated);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }
    setCartDrawerOpen(true);
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    playTick();
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as Array<{ product: ProductItem; quantity: number }>;
    saveCart(updated);
  };

  // Remove item completely
  const handleRemoveFromCart = (productId: string) => {
    playTick();
    const updated = cart.filter(item => item.product.id !== productId);
    saveCart(updated);
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return STORE_PRODUCTS.filter(prod => {
      const matchesCategory = activeCategory === 'ALL' || prod.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.nameHi.includes(searchQuery) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.descriptionHi.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Cart Calculations
  const cartTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  const originalSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.originalPrice * item.quantity), 0);
  }, [cart]);

  const totalSavings = originalSubtotal - cartSubtotal;
  const isFreeDelivery = cartSubtotal >= 499;
  const deliveryCharge = isFreeDelivery ? 0 : 49;
  const finalPayable = cartSubtotal + (cart.length > 0 ? deliveryCharge : 0);

  // 1-Click WhatsApp Order Generation
  const handleWhatsAppCheckout = () => {
    playBell();
    if (cart.length === 0) return;

    const itemList = cart.map((item, idx) => 
      `${idx + 1}. ${item.product.nameHi} (Qty: ${item.quantity}) - ₹${item.product.price * item.quantity}`
    ).join('\n');

    const message = `🕉️ श्री गणेशाय नमः • वैदिक पूजा सामग्री ऑर्डर\n\n` +
      `👤 भक्त का नाम: ${devoteeName || 'सादर भक्त'}\n` +
      `📞 सम्पर्क: ${devoteePhone || 'उपलब्ध'}\n` +
      `📍 डिलेवरी पता: ${deliveryAddress || 'कृपया पता दर्ज करें'}\n` +
      `📮 पिनकोड: ${pincode || '-'}\n\n` +
      `📦 ऑर्डर सामग्री सूची:\n${itemList}\n\n` +
      `💰 कुल देय राशि: ₹${finalPayable} (डिलेवरी: ${isFreeDelivery ? 'मुफ्त (FREE)' : '₹49'})\n` +
      `💳 भुगतान विधि: ${paymentMethod === 'COD' ? 'Cash on Delivery (घर पहुँचकर नकद)' : 'UPI Online'}\n\n` +
      `🙏 कृपया मेरा ऑर्डर कन्फर्म करें एवं संकल्पित प्रसाद सामग्री प्रेषित करें।`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Submit In-App Order
  const handleConfirmOrder = () => {
    playBell();
    playFlowerDrop();
    setOrderSuccess(true);
    saveCart([]);
    setTimeout(() => {
      setCheckoutModalOpen(false);
      setOrderSuccess(false);
      setCartDrawerOpen(false);
    }, 3500);
  };

  return (
    <CosmicTantraShell>
      <div className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 mx-auto max-w-7xl space-y-6">
        
        {/* Store Top Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#1A140A] via-[#2A1D0B] to-[#120D05] border border-[#8E6F1D]/40 p-6 sm:p-10 text-white shadow-2xl overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-radial from-amber-500/20 to-transparent blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8E6F1D]/25 border border-amber-400/40 text-amber-300 text-xs font-mono-data font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>वैदिक पूजा सामग्री प्रतिष्ठान • 100% SHASTRA CERTIFIED</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF7F2]">
              Pooja Store & Sacred Samagri
            </h1>

            <p className="text-xs sm:text-sm font-mono-data text-[#D1C9BF] leading-relaxed">
              Certified authentic brassware, pure Gir cow A2 Bilona ghee, Bhimseni camphor, deity poshaks, energized yantras, and festive puja kits directly from Kashi, Vrindavan, and Mysore.
            </p>

            {/* Purity Assurance Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono-data">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>१००% शुद्ध व केमिकल-रहित</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>₹499 पर निःशुल्क डिलेवरी (Free Shipping)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>मन्त्र-अभिमंत्रित सामग्रियां</span>
              </div>
            </div>
          </div>

          {/* Floating Cart Button (Top Right in Hero) */}
          <div className="absolute right-4 top-4 sm:right-8 sm:top-8 z-20">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#8E6F1D] hover:bg-[#A88424] text-white text-xs font-mono-data font-bold flex items-center gap-2 shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>कार्ट ({cartTotalItems})</span>
              {cartTotalItems > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px]">
                  ₹{cartSubtotal}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Store Control Bar: Categories & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#0E101D] p-3 sm:p-4 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { playTick(); setActiveCategory('ALL'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer ${
                activeCategory === 'ALL'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs'
                  : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              समस्त सामग्रियां (All)
            </button>

            <button
              onClick={() => { playTick(); setActiveCategory('DIYA'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'DIYA'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs'
                  : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <span>🪔</span>
              <span>पीतल दीया व दीप</span>
            </button>

            <button
              onClick={() => { playTick(); setActiveCategory('DHOOP'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'DHOOP'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs'
                  : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <span>🪵</span>
              <span>धूप, अगरबत्ती व कपूर</span>
            </button>

            <button
              onClick={() => { playTick(); setActiveCategory('POSHAK'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'POSHAK'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs'
                  : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <span>👗</span>
              <span>विग्रह पोशाक व शृंगार</span>
            </button>

            <button
              onClick={() => { playTick(); setActiveCategory('SAMAGRI'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'SAMAGRI'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs'
                  : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <span>🌸</span>
              <span>हवन व अभिषेक सामग्री</span>
            </button>

            <button
              onClick={() => { playTick(); setActiveCategory('MALA_YANTRA'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'MALA_YANTRA'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs'
                  : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <span>📿</span>
              <span>रुद्राक्ष, माला व यंत्र</span>
            </button>

            <button
              onClick={() => { playTick(); setActiveCategory('PUJA_KITS'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'PUJA_KITS'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs'
                  : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <span>📦</span>
              <span>सम्पूर्ण पूजा किट</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="दीया, अगरबत्ती, पोशाक खोजें..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] text-xs font-mono-data text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-[#0E101D] rounded-3xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Product Image & Badge */}
              <div className="relative w-full aspect-square bg-black/5 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {product.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#8E6F1D]/90 text-white text-[10px] font-mono-data font-bold shadow-md">
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={() => setSelectedProduct(product)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                  title="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Product Body */}
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono-data text-[#78716C] mb-1">
                    <span>{product.weightOrSize}</span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{product.rating} ({product.reviewsCount})</span>
                    </span>
                  </div>

                  <h3 className="font-editorial text-base font-bold text-[#1C1917] dark:text-white line-clamp-1">
                    {product.nameHi}
                  </h3>

                  <p className="text-[11px] font-mono-data text-[#78716C] line-clamp-1">
                    {product.name}
                  </p>

                  <div className="text-[10px] font-mono-data text-emerald-600 dark:text-emerald-400 font-semibold pt-1 line-clamp-1">
                    ✓ {product.purityCertificationHi}
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                        ₹{product.price}
                      </span>
                      <span className="text-xs font-mono-data text-[#78716C] line-through">
                        ₹{product.originalPrice}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono-data text-green-600 font-bold">
                      बचत: ₹{product.originalPrice - product.price}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="px-3.5 py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#A88424] text-white text-xs font-mono-data font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>जोड़ें (Add)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty Search Result Fallback */}
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-[#0E101D] rounded-3xl border border-black/10 dark:border-white/10 space-y-3">
            <Package className="w-12 h-12 text-[#78716C] mx-auto opacity-50" />
            <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
              कोई सामग्री नहीं मिली
            </h3>
            <p className="text-xs font-mono-data text-[#78716C]">
              कृपया दूसरा नाम अथवा श्रेणी चुनकर खोजें।
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
              className="px-4 py-2 rounded-xl bg-[#8E6F1D] text-white text-xs font-mono-data font-bold cursor-pointer"
            >
              समस्त सामग्रियां देखें
            </button>
          </div>
        )}

        {/* SLIDING CART DRAWER */}
        {cartDrawerOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex justify-end">
            <div className="bg-white dark:bg-[#0E101D] w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-5 space-y-4 animate-in slide-in-from-right duration-300">
              
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#8E6F1D] dark:text-[#F0C968]" />
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                    आपकी पूजा सामग्री कार्ट ({cartTotalItems})
                  </h3>
                </div>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#78716C] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Tracker Bar */}
              <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono-data">
                  <span className="font-bold text-[#1C1917] dark:text-white flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    {isFreeDelivery ? '🎉 निःशुल्क डिलेवरी योग्य!' : `₹${499 - cartSubtotal} और जोड़ें मुफ्त डिलेवरी हेतु`}
                  </span>
                  <span className="text-[#78716C]">₹499 का लक्ष्य</span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.round((cartSubtotal / 499) * 100))}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-[#78716C] mx-auto opacity-40" />
                    <p className="text-xs font-mono-data text-[#78716C]">आपकी कार्ट अभी खाली है।</p>
                    <button
                      onClick={() => setCartDrawerOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#8E6F1D] text-white text-xs font-mono-data font-bold cursor-pointer"
                    >
                      सामग्रियां चुनें
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-editorial text-xs font-bold text-[#1C1917] dark:text-white line-clamp-1">
                          {item.product.nameHi}
                        </h4>
                        <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                          ₹{item.product.price} × {item.quantity} = ₹{item.product.price * item.quantity}
                        </div>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-1 bg-white dark:bg-black/30 rounded-xl border border-black/10 dark:border-white/10 p-0.5">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="p-1 rounded text-[#78716C] hover:text-black dark:hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono-data font-bold px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="p-1 rounded text-[#78716C] hover:text-black dark:hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Bottom Summary & Checkout Buttons */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-3">
                  <div className="space-y-1 text-xs font-mono-data">
                    <div className="flex items-center justify-between text-[#78716C]">
                      <span>उप-योग (Subtotal)</span>
                      <span>₹{cartSubtotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#78716C]">
                      <span>डिलेवरी शुल्क (Shipping)</span>
                      <span>{isFreeDelivery ? <strong className="text-green-600">FREE</strong> : '₹49'}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-sm text-[#1C1917] dark:text-white pt-1 border-t border-black/5">
                      <span>कुल देय राशि (Total)</span>
                      <span className="text-[#8E6F1D] dark:text-[#F0C968] text-base">₹{finalPayable}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* 1-Click WhatsApp Order */}
                    <button
                      onClick={handleWhatsAppCheckout}
                      className="py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono-data font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp ऑर्डर</span>
                    </button>

                    {/* In-App Direct Checkout */}
                    <button
                      onClick={() => setCheckoutModalOpen(true)}
                      className="py-2.5 rounded-2xl bg-[#8E6F1D] hover:bg-[#A88424] text-white text-xs font-mono-data font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <span>सीधे चेकआउट →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCT QUICK VIEW MODAL */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/40 max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                <span className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                  {selectedProduct.purityCertification}
                </span>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-lg text-[#78716C] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full aspect-square rounded-2xl object-cover shadow-md"
                />

                <div className="space-y-3">
                  <h3 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                    {selectedProduct.nameHi}
                  </h3>
                  <p className="text-xs font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
                    {selectedProduct.descriptionHi}
                  </p>

                  <div className="space-y-1">
                    <div className="text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white">
                      सामग्री घटक (Included Contents):
                    </div>
                    <ul className="text-xs font-mono-data text-[#78716C] space-y-0.5 list-disc pl-4">
                      {selectedProduct.contents.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-baseline gap-2 pt-2">
                    <span className="font-editorial text-2xl font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                      ₹{selectedProduct.price}
                    </span>
                    <span className="text-sm font-mono-data text-[#78716C] line-through">
                      ₹{selectedProduct.originalPrice}
                    </span>
                  </div>

                  <button
                    onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                    className="w-full py-3 rounded-2xl bg-[#8E6F1D] hover:bg-[#A88424] text-white text-xs font-mono-data font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>कार्ट में जोड़ें (Add to Cart)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        {checkoutModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/40 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#8E6F1D] dark:text-[#F0C968]" />
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                    सुरक्षित चेकआउट • Delivery Address
                  </h3>
                </div>
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="p-1 rounded-lg text-[#78716C] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto shadow-lg">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                    🎉 पावन सामग्री ऑर्डर सफल!
                  </h4>
                  <p className="text-xs font-mono-data text-[#78716C]">
                    आपका ऑर्डर स्वीकार कर लिया गया है। शीघ्र ही आपके पते पर डिलेवरी भेजी जाएगी।
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs font-mono-data">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#78716C] mb-1">आपका शुभ नाम (Full Name)</label>
                      <input
                        type="text"
                        value={devoteeName}
                        onChange={(e) => setDevoteeName(e.target.value)}
                        placeholder="e.g. प्रिया शर्मा"
                        className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#78716C] mb-1">मोबाइल नम्बर (WhatsApp No)</label>
                      <input
                        type="tel"
                        value={devoteePhone}
                        onChange={(e) => setDevoteePhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#78716C] mb-1">पूरा डिलेवरी पता (Full Address)</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="मकान संख्या, गली, मन्दिर के निकट, नगर, राज्य..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#78716C] mb-1">पिन कोड (Pincode)</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 221001"
                        className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#78716C] mb-1">भुगतान विधि (Payment)</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'ONLINE')}
                        className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                      >
                        <option value="COD">Cash on Delivery (नकद)</option>
                        <option value="ONLINE">UPI / QR on Delivery</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-amber-700 dark:text-amber-300">
                    कुल देय राशि: <strong>₹{finalPayable}</strong> (सामग्री शुद्धता व मन्त्र-सङ्कल्प गारंटी सहित)
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={handleConfirmOrder}
                      className="flex-1 py-3 rounded-2xl bg-[#8E6F1D] hover:bg-[#A88424] text-white font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>ऑर्डर कन्फर्म करें (Confirm Order)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </CosmicTantraShell>
  );
}
