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
