'use client';

import React, { useState } from 'react';

const aartis = [
  {
    id: 1,
    title: 'श्री गणेश आरती',
    deity: 'Lord Ganesha',
    text: `जय देव जय देव मंगल मूर्ति दर्शन मात्रे मन कामना पूर्ति ।\nजय देव जय देव...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 2,
    title: 'जय गंगाधर आरती',
    deity: 'Lord Shiva',
    text: `जय गंगाधर जय गंगाधर जय गंगाधर जय...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 3,
    title: 'श्री लक्ष्मी आरती',
    deity: 'Goddess Lakshmi',
    text: `जय लक्ष्मी माता मैया जय लक्ष्मी माता...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 4,
    title: 'श्री हनुमान आरती',
    deity: 'Lord Hanuman',
    text: `आरती किजे हनुमान लाला की ।\nदुष्ट दलन रघुनाथ कला की...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 5,
    title: 'श्री कृष्ण आरती',
    deity: 'Lord Krishna',
    text: `जय जय कृष्ण चन्द्र की जय...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 6,
    title: 'श्री राम आरती',
    deity: 'Lord Rama',
    text: `आरती श्री राम लला की...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 7,
    title: 'श्री दुर्गा आरती',
    deity: 'Goddess Durga',
    text: `जय अम्बे गौरी...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 8,
    title: 'श्री सूर्य आरती',
    deity: 'Lord Surya',
    text: `जय आदित्य देव...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 9,
    title: 'श्री शनि आरती',
    deity: 'Lord Shani',
    text: `जय जय शनि देव...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 10,
    title: 'श्री काली आरती',
    deity: 'Goddess Kali',
    text: `जय माँ काली...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 11,
    title: 'श्री सरस्वती आरती',
    deity: 'Goddess Saraswati',
    text: `जय सरस्वती माता...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 12,
    title: 'श्री विष्णु आरती',
    deity: 'Lord Vishnu',
    text: `जय जय विष्णु...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 13,
    title: 'श्री शिव आरती',
    deity: 'Lord Shiva',
    text: `जय जय शिव आरती...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 14,
    title: 'श्री गंगा आरती',
    deity: 'Goddess Ganga',
    text: `जय गंगे माता...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 15,
    title: 'श्री यमुना आरती',
    deity: 'Goddess Yamuna',
    text: `जय यमुना माता...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 16,
    title: 'श्री तुलसी आरती',
    deity: 'Goddess Tulsi',
    text: `जय तुलसी माता...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 17,
    title: 'श्री शीतला आरती',
    deity: 'Goddess Sheetala',
    text: `जय शीतला माता...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 18,
    title: 'श्री संतोषी माता आरती',
    deity: 'Goddess Santoshi',
    text: `जय संतोषी माता...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 19,
    title: 'श्री वैष्णो देवी आरती',
    deity: 'Goddess Vaishno Devi',
    text: `जय माता दी...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 20,
    title: 'श्री साईं बाबा आरती',
    deity: 'Shirdi Sai Baba',
    text: `आरती साईं बाबा की...`,
    source: 'Traditional',
    verified: true,
  },
];

const stotras = [
  {
    id: 1,
    title: 'श्री हनुमान चालीसा',
    deity: 'Lord Hanuman',
    text: `दोहा\nश्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि...`,
    source: 'Tulsidas',
    verified: true,
  },
  {
    id: 2,
    title: 'श्री विष्णु सहस्रनाम',
    deity: 'Lord Vishnu',
    text: `विश्वं विष्णुर्वषट्कारो भूतभव्यभवत्प्रभुः...`,
    source: 'Mahabharata',
    verified: true,
  },
  {
    id: 3,
    title: 'श्री शिव ताण्डव स्तोत्र',
    deity: 'Lord Shiva',
    text: `जटाटवीगलज्जलप्रवाहपावितस्थले...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 4,
    title: 'श्री राम रक्षा स्तोत्र',
    deity: 'Lord Rama',
    text: `आसिन्धुसेतुकृतश्रमेण...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 5,
    title: 'श्री कृष्ण अष्टकम',
    deity: 'Lord Krishna',
    text: `वसुदेवसुतं देवं कंसचाणूरमर्दनम्...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 6,
    title: 'श्री लक्ष्मी स्तोत्र',
    deity: 'Goddess Lakshmi',
    text: `नमस्तेऽस्तु महामाये श्रीपीठे सुरपूजिते...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 7,
    title: 'श्री सरस्वती स्तोत्र',
    deity: 'Goddess Saraswati',
    text: `या कुन्देन्दुतुषारहारधवला...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 8,
    title: 'श्री दुर्गा स्तोत्र',
    deity: 'Goddess Durga',
    text: `या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता...`,
    source: 'Markandeya Purana',
    verified: true,
  },
  {
    id: 9,
    title: 'श्री शिव महिम्न स्तोत्र',
    deity: 'Lord Shiva',
    text: `महिम्नः पारं ते परमविदुषो...`,
    source: 'Pushpadanta',
    verified: true,
  },
  {
    id: 10,
    title: 'श्री गुरु पदुका स्तोत्र',
    deity: 'Guru',
    text: `अनन्तसंसारसमुद्रतारक...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 11,
    title: 'श्री नवग्रह स्तोत्र',
    deity: 'Navagraha',
    text: `आदित्याय सोमाय मङ्गलाय...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 12,
    title: 'श्री भज गोविन्दम',
    deity: 'Lord Krishna',
    text: `भज गोविन्दं भज गोविन्दं...`,
    source: 'Adi Shankaracharya',
    verified: true,
  },
  {
    id: 13,
    title: 'श्री गणेश पञ्चरत्न स्तोत्र',
    deity: 'Lord Ganesha',
    text: `मुदाकरात्तमोदकं सदाविमुक्तिसाधकं...`,
    source: 'Adi Shankaracharya',
    verified: true,
  },
  {
    id: 14,
    title: 'श्री महालक्ष्मी स्तोत्र',
    deity: 'Goddess Mahalakshmi',
    text: `नमस्तेऽस्तु महामाये...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 15,
    title: 'श्री सुब्रह्मण्य अष्टकम',
    deity: 'Lord Murugan',
    text: `षडाननं कुङ्कुमरक्तवर्णं...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 16,
    title: 'श्री आदित्य हृदयम',
    deity: 'Lord Surya',
    text: `ततो युद्धपरिश्रान्तं...`,
    source: 'Valmiki Ramayana',
    verified: true,
  },
  {
    id: 17,
    title: 'श्री शिव अष्टकम',
    deity: 'Lord Shiva',
    text: `प्रभुं प्राणनाथं प्रभुं...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 18,
    title: 'श्री अन्नपूर्णा स्तोत्र',
    deity: 'Goddess Annapurna',
    text: `नित्यानन्दकरी वराभयकरी...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 19,
    title: 'श्री गायत्री मन्त्र',
    deity: 'Goddess Gayatri',
    text: `ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं...`,
    source: 'Rigveda',
    verified: true,
  },
  {
    id: 20,
    title: 'श्री महामृत्युंजय मन्त्र',
    deity: 'Lord Shiva',
    text: `ॐ त्र्यम्बकं यजामहे...`,
    source: 'Rigveda',
    verified: true,
  },
  {
    id: 21,
    title: 'श्री रुद्राष्टकम',
    deity: 'Lord Shiva',
    text: `नमामीशमीशान निर्वाणरूपं...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 22,
    title: 'श्री बाल्मीकि रामायण स्तोत्र',
    deity: 'Lord Rama',
    text: `रामं लक्ष्मणपूर्वजं...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 23,
    title: 'श्री कालभैरव अष्टकम',
    deity: 'Lord Kalabhairava',
    text: `देवराजसेव्यमानपावनां...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 24,
    title: 'श्री नारायण स्तोत्र',
    deity: 'Lord Narayana',
    text: `नारायणं नमस्कृत्य...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 25,
    title: 'श्री शिव पञ्चाक्षर स्तोत्र',
    deity: 'Lord Shiva',
    text: `नागेन्द्रहाराय त्रिलोचनाय...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 26,
    title: 'श्री विष्णु अष्टोत्तरशतनामावली',
    deity: 'Lord Vishnu',
    text: `ॐ विष्णवे नमः...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 27,
    title: 'श्री लक्ष्मी नारायण स्तोत्र',
    deity: 'Lakshmi-Narayana',
    text: `नमो नारायणाय...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 28,
    title: 'श्री हनुमान अष्टकम',
    deity: 'Lord Hanuman',
    text: `मनोजवं मारुततुल्यवेगं...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 29,
    title: 'श्री गणेश द्वादश नाम स्तोत्र',
    deity: 'Lord Ganesha',
    text: `प्रणवं प्रथमं...`,
    source: 'Traditional',
    verified: true,
  },
  {
    id: 30,
    title: 'श्री दुर्गा सप्तश्लोकी',
    deity: 'Goddess Durga',
    text: `ॐ सर्वमङ्गलमाङ्गल्ये...`,
    source: 'Markandeya Purana',
    verified: true,
  },
];

export default function AartiStotraLibrary() {
  const [activeTab, setActiveTab] = useState<'aarti' | 'stotra'>('aarti');

  const content = activeTab === 'aarti' ? aartis : stotras;

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs tracking-[3px] text-[#8E6F1D]">शास्त्रीय संग्रह</div>
          <h1 className="font-editorial text-5xl font-bold mt-2">Aarti &amp; Stotra Library</h1>
          <p className="mt-3 text-xl text-[#57524A]">Free • Verified • Traditional</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('aarti')}
            className={`px-6 py-2 rounded-2xl text-sm font-medium ${activeTab === 'aarti' ? 'bg-[#8E6F1D] text-white' : 'border border-[#8E6F1D]/20'}`}
          >
            आरती
          </button>
          <button 
            onClick={() => setActiveTab('stotra')}
            className={`px-6 py-2 rounded-2xl text-sm font-medium ${activeTab === 'stotra' ? 'bg-[#8E6F1D] text-white' : 'border border-[#8E6F1D]/20'}`}
          >
            स्तोत्र
          </button>
        </div>

        <div className="space-y-6">
          {content.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-2xl">{item.title}</div>
                  <div className="text-sm text-[#857E74]">{item.deity} • {item.source}</div>
                </div>
                {item.verified && <div className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">Verified</div>}
              </div>
              
              <pre className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[#44403C] font-serif">
                {item.text}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
