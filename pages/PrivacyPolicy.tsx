import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { Card } from '../components/UI';
import { ShieldCheck, Lock, Eye, Database, Share2, UserCheck, ArrowLeft, Mail, HelpCircle, ArrowRight, MessageSquareQuote, Megaphone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getLandingConfig } from '../services/api';
import { LandingPageConfig } from '../types';

const PolicySection: React.FC<{ icon: any, title: string, titleBn: string, children?: React.ReactNode }> = ({ icon: Icon, title, titleBn, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm">
        <Icon size={24} />
      </div>
      <div>
        <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{titleBn}</p>
      </div>
    </div>
    <div className="pl-0 lg:pl-16 text-slate-600 font-medium leading-relaxed space-y-3 whitespace-pre-line">
      {children}
    </div>
  </div>
);

export const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  useEffect(() => {
    getLandingConfig().then(setConfig);
  }, []);

  const c = {
    privacyTitle: config?.privacyTitle || "Privacy Policy",
    privacyEffectiveDate: config?.privacyEffectiveDate || "January 01, 2026",
    
    sec1Title: config?.privacySection1Title || "Data Collection",
    sec1TitleBn: config?.privacySection1TitleBn || "তথ্য সংগ্রহ",
    sec1Content: config?.privacySection1Content || "আমরা আপনার থেকে নিম্নলিখিত তথ্যগুলো সংগ্রহ করি যা আপনাকে একজন রক্তদাতা হিসেবে চিহ্নিত করতে সহায়তা করে:\n• ব্যক্তিগত পরিচয় (নাম, ইমেইল এবং ফোন নম্বর)।\n• মেডিকেল তথ্য (রক্তের গ্রুপ এবং সর্বশেষ রক্তদানের তারিখ)।\n• ভৌগোলিক অবস্থান (আপনার এলাকা)।",
    
    sec2Title: config?.privacySection2Title || "How We Use Your Info",
    sec2TitleBn: config?.privacySection2TitleBn || "তথ্যের ব্যবহার",
    sec2Content: config?.privacySection2Content || "আপনার তথ্যগুলো শুধুমাত্র নিম্নলিখিত উদ্দেশ্যে ব্যবহৃত হয়:\n• রক্তদাতা এবং রক্ত গ্রহীতার মধ্যে সংযোগ স্থাপন।\n• ডিজিটাল আইডি কার্ড জেনারেট করা।\n• সিস্টেমের নিরাপত্তা নিশ্চিত করা।",
    
    sec3Title: config?.privacySection3Title || "Visibility & Access",
    sec3TitleBn: config?.privacySection3TitleBn || "দৃশ্যমানতা এবং এক্সেস",
    sec3Content: config?.privacySection3Content || "আপনার ব্যক্তিগত ফোন নম্বর এবং ইমেইল ডিফল্টভাবে গোপন থাকে। শুধুমাত্র আমাদের ভেরিফাইড এ্যাডমিন এবং যাদের আপনি অনুমতি দেবেন তারাই আপনার যোগাযোগের তথ্য দেখতে পাবে।",
    
    sec4Title: config?.privacySection4Title || "Third-Party Sharing",
    sec4TitleBn: config?.privacySection4TitleBn || "তৃতীয় পক্ষের সাথে শেয়ার",
    sec4Content: config?.privacySection4Content || "আমরা আপনার ব্যক্তিগত তথ্য কোনো বাণিজ্যিক প্রতিষ্ঠানের কাছে বিক্রি করি না। আমরা Google Gemini AI এবং Firebase-এর মতো বিশ্বস্ত সার্ভিস ব্যবহার করি।",
    
    sec5Title: config?.privacySection5Title || "Your Rights",
    sec5TitleBn: config?.privacySection5TitleBn || "আপনার অধিকার",
    sec5Content: config?.privacySection5Content || "আপনার প্রোফাইল যেকোনো সময় আপডেট করার বা ডিলিট করার পূর্ণ অধিকার আপনার আছে। আপনি চাইলে আমাদের এ্যাডমিন প্যানেলে রিকোয়েস্ট পাঠিয়ে আপনার ডাটা পুরোপুরি রিমুভ করে নিতে পারেন।",
    
    contactTitle: config?.privacyContactTitle || "Contact Privacy Team",
    contactSubtitle: config?.privacyContactSubtitle || "আমাদের প্রাইভেসি পলিসি নিয়ে কোনো প্রশ্ন থাকলে ইমেইল করুন:",
    contactEmail: config?.privacyContactEmail || "privacy@bloodlink.com"
  };

  return (
    <PublicLayout>
      <div className="py-12 px-6 lg:py-20">
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full mb-4">
                <ShieldCheck size={14} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Compliance Hub</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter">{c.privacyTitle}</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Effective Date: {c.privacyEffectiveDate}</p>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              <ArrowLeft size={16} /> ফিরে যান
            </button>
          </div>

          <Card className="p-8 lg:p-12 border-0 shadow-2xl bg-white rounded-[3rem] space-y-16">
            
            <PolicySection icon={Database} title={c.sec1Title} titleBn={c.sec1TitleBn}>
              {c.sec1Content}
            </PolicySection>

            <PolicySection icon={Lock} title={c.sec2Title} titleBn={c.sec2TitleBn}>
              {c.sec2Content}
            </PolicySection>

            <PolicySection icon={Eye} title={c.sec3Title} titleBn={c.sec3TitleBn}>
              <div className="space-y-4">
                <p>{c.sec3Content}</p>
                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                  <p className="text-blue-800 text-sm font-bold leading-relaxed">
                    <span className="text-red-600 font-black">সতর্কতা:</span> আপনি যদি "Donor Directory" তে নাম অন্তর্ভুক্ত করেন, তবে ভেরিফাইড ইউজাররা আপনার রক্তের গ্রুপ এবং এলাকা দেখতে পাবে।
                  </p>
                </div>
              </div>
            </PolicySection>

            <PolicySection icon={Share2} title={c.sec4Title} titleBn={c.sec4TitleBn}>
              {c.sec4Content}
            </PolicySection>

            <PolicySection icon={UserCheck} title={c.sec5Title} titleBn={c.sec5TitleBn}>
              {c.sec5Content}
            </PolicySection>

            <div className="pt-10 border-t border-slate-100 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-red-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-100">
                <Mail size={28} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xl tracking-tight">{c.contactTitle}</h4>
                <p className="text-slate-500 font-medium text-sm mt-1">{c.contactSubtitle}</p>
                <a href={`mailto:${c.contactEmail}`} className="text-red-600 font-black text-lg hover:underline block mt-2 mb-6">{c.contactEmail}</a>
                
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/help-center" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-red-600 transition-all border border-slate-200">
                     <HelpCircle size={16} /> Help Center
                  </Link>
                  <Link to="/public-feedbacks" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-red-600 transition-all border border-slate-200">
                     <MessageSquareQuote size={16} /> Feedback
                  </Link>
                  <Link to="/public-notices" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-red-600 transition-all border border-slate-200">
                     <Megaphone size={16} /> Notice
                  </Link>
                </div>
              </div>
            </div>

          </Card>

          <div className="text-center pb-10">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              {config?.footerCopyright || "© 2026 BloodLink Management System"} • All Rights Reserved
            </p>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
};