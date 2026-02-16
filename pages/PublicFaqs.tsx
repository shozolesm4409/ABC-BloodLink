
import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { FAQ } from '../types';
import { getPublicFaqs } from '../services/api';
import { Search, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export const PublicFaqs = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPublicFaqs().then((data) => {
      setFaqs(data);
      setLoading(false);
    });
  }, []);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout>
      {/* Custom Styles from the requested design for smooth transitions */}
      <style>{`
        .accordion-content {
            transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                        opacity 0.5s ease,
                        padding 0.5s ease;
            max-height: 0;
            opacity: 0;
            overflow: hidden;
        }
        .accordion-item.active .accordion-content {
            max-height: 800px;
            opacity: 1;
            padding-top: 1.25rem;
            padding-bottom: 1.25rem;
        }
        .accordion-icon {
            transition: transform 0.4s ease;
        }
        .accordion-item.active .accordion-icon {
            transform: rotate(180deg);
        }
        .faq-item {
            transition: all 0.3s ease;
        }
        .faq-item:hover {
            transform: translateY(-4px) scale(1.015);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 30px -10px rgba(79, 70, 229, 0.3);
        }
      `}</style>

      <div className="bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-100 min-h-screen font-sans antialiased">
        <div className="max-w-4xl mx-auto px-5 py-20 md:py-28">

          {/* Search & Header */}
          <div className="mb-12 text-center space-y-6">
             <h1 className="text-3xl md:text-5xl font-bold text-gray-900">Frequently Asked Questions</h1>
             <div className="relative max-w-lg mx-auto group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-4 bg-white border border-indigo-100 rounded-2xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-lg shadow-indigo-100/50 transition-all font-medium"
                  placeholder="আপনার প্রশ্ন খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="font-bold text-indigo-500 uppercase tracking-widest text-xs">Loading Knowledge Base...</p>
            </div>
          ) : filteredFaqs.length > 0 ? (
            <div className="space-y-6">
              {filteredFaqs.map((faq, index) => (
                <div 
                  key={faq.id} 
                  className={clsx(
                    "faq-item accordion-item bg-white rounded-2xl border border-gray-200/80 shadow-xl overflow-hidden",
                    openId === faq.id && "active ring-2 ring-indigo-500/20"
                  )}
                >
                  <button 
                    className="w-full flex items-center px-7 py-6 text-left focus:outline-none group" 
                    onClick={() => toggle(faq.id)}
                  >
                    <div className="flex items-center gap-5 w-full">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                        {index + 1}
                      </div>
                      <span className="text-xl md:text-2xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown className="accordion-icon w-8 h-8 text-indigo-600 flex-shrink-0 ml-4" />
                  </button>
                  <div className="accordion-content px-7 text-gray-600 border-t border-gray-100 bg-gray-50/30">
                    <p className="leading-relaxed whitespace-pre-wrap text-lg font-medium text-slate-600">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white/60 rounded-[2rem] border-2 border-dashed border-indigo-200/50 backdrop-blur-sm">
              <p className="text-indigo-400 font-bold italic text-lg">কোনো ফলাফল পাওয়া যায়নি।</p>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
};
