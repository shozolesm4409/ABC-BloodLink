
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getLandingConfig, updateLandingConfig } from '../services/api';
import { Card, Button, Input, Toast, useToast } from '../components/UI';
import { LandingPageConfig } from '../types';
import { Monitor, Save, Globe, LogIn, UserPlus, List, BarChart, MessageSquare, Layout, Megaphone, Key, MailCheck, ShieldCheck, Database, Lock, Eye, Share2, UserCheck, Mail, Send, History, Info, Type } from 'lucide-react';
import clsx from 'clsx';

export const AdminPageCustomizer = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [config, setConfig] = useState<LandingPageConfig>({
    heroTitle: '', heroSubtitle: '', heroButtonPrimary: '', heroButtonSecondary: '',
    statsSectionTitle: '', feedbackSectionTitle: '', feedbackSectionSubtitle: '',
    ctaTitle: '', ctaSubtitle: '', ctaButtonText: '',
    loginTitle: '', loginSubtitle: '', loginHeadline: '', loginDescription: '', loginButtonLabel: '',
    registerTitle: '', registerSubtitle: '', registerHeadline: '', registerDescription: '', registerButtonLabel: '',
    resetTitle: '', resetSubtitle: '', resetHeadline: '', resetDescription: '', resetButtonLabel: '',
    sentTitle: '', sentSubtitle: '', sentHeadline: '', sentDescription: '', sentButtonLabel: '',
    sentGoToLoginLabel: '', sentTryAgainLabel: '',
    footerCopyright: '', footerTagline: '',
    privacyTitle: '', privacyEffectiveDate: '', privacyContactEmail: '',
    privacySection1Title: '', privacySection1TitleBn: '', privacySection1Content: '',
    privacySection2Title: '', privacySection2TitleBn: '', privacySection2Content: '',
    privacySection3Title: '', privacySection3TitleBn: '', privacySection3Content: '',
    privacySection4Title: '', privacySection4TitleBn: '', privacySection4Content: '',
    privacySection5Title: '', privacySection5TitleBn: '', privacySection5Content: '',
    privacyContactTitle: '', privacyContactSubtitle: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'landing' | 'auth' | 'privacy'>('landing');

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) {
        setConfig(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !config) return;
    setSaving(true);
    try {
      await updateLandingConfig(config, user);
      showToast("All settings synchronized across system nodes.");
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setSaving(false); }
  };

  const updateField = (key: keyof LandingPageConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Synchronizing Visual Engine...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-8 px-4 lg:px-0">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">System Customizer</h1>
          <p className="text-slate-500 font-medium">Control every visual element, text broadcast, and legal disclosure.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl lg:rounded-3xl shadow-inner border border-slate-200 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'landing'} onClick={() => setActiveTab('landing')} icon={Globe} label="Landing" />
          <TabButton active={activeTab === 'auth'} onClick={() => setActiveTab('auth')} icon={Key} label="Auth Screens" />
          <TabButton active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} icon={ShieldCheck} label="Privacy" />
        </div>
        <Button onClick={handleSave} isLoading={saving} className="px-10 py-5 rounded-[1.5rem] shadow-2xl bg-red-600 hover:bg-red-700 transition-all border-0 mx-4 lg:mx-0">
          <Save className="mr-2" size={20} /> Sync Global UI
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10 px-4 lg:px-0">
        {activeTab === 'landing' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SectionCard title="Hero Experience" icon={Monitor} iconColor="text-red-600">
                <Input label="Main Headline" value={config.heroTitle} onChange={e => updateField('heroTitle', e.target.value)} />
                <TextArea label="Sub-headline Description" value={config.heroSubtitle} onChange={e => updateField('heroSubtitle', e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Primary Button" value={config.heroButtonPrimary} onChange={e => updateField('heroButtonPrimary', e.target.value)} />
                  <Input label="Secondary Button" value={config.heroButtonSecondary} onChange={e => updateField('heroButtonSecondary', e.target.value)} />
                </div>
              </SectionCard>
              
              <div className="space-y-8">
                <SectionCard title="Donor Feedbacks" icon={MessageSquare} iconColor="text-green-600">
                  <Input label="Section Title" value={config.feedbackSectionTitle} onChange={e => updateField('feedbackSectionTitle', e.target.value)} />
                  <Input label="Section Subtitle" value={config.feedbackSectionSubtitle} onChange={e => updateField('feedbackSectionSubtitle', e.target.value)} />
                </SectionCard>
                <SectionCard title="Emergency CTA" icon={Megaphone} iconColor="text-orange-600">
                  <Input label="CTA Title" value={config.ctaTitle} onChange={e => updateField('ctaTitle', e.target.value)} />
                  <Input label="CTA Button Label" value={config.ctaButtonText} onChange={e => updateField('ctaButtonText', e.target.value)} />
                </SectionCard>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <SectionCard title="Data Statistics" icon={BarChart} iconColor="text-blue-600">
                 <Input label="Section Title" value={config.statsSectionTitle} onChange={e => updateField('statsSectionTitle', e.target.value)} />
               </SectionCard>
               <SectionCard title="Landing Subtitle" icon={Type} iconColor="text-slate-600">
                 <TextArea label="CTA Subtitle" value={config.ctaSubtitle} onChange={e => updateField('ctaSubtitle', e.target.value)} />
               </SectionCard>
            </div>

            <SectionCard title="Global Footer Signature" icon={Layout} iconColor="text-slate-600">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Input label="Copyright Content" value={config.footerCopyright} onChange={e => updateField('footerCopyright', e.target.value)} />
                  <Input label="Brand Tagline" value={config.footerTagline} onChange={e => updateField('footerTagline', e.target.value)} />
                </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SectionCard title="Login Screen (Sign In)" icon={LogIn} iconColor="text-red-600">
                <Input label="Form Title" value={config.loginTitle} onChange={e => updateField('loginTitle', e.target.value)} />
                <Input label="Form Subtitle" value={config.loginSubtitle} onChange={e => updateField('loginSubtitle', e.target.value)} />
                <Input label="Sidebar Headline" value={config.loginHeadline} onChange={e => updateField('loginHeadline', e.target.value)} />
                <TextArea label="Sidebar Description" value={config.loginDescription || ''} onChange={e => updateField('loginDescription', e.target.value)} />
                <Input label="Action Button Label" value={config.loginButtonLabel} onChange={e => updateField('loginButtonLabel', e.target.value)} />
              </SectionCard>

              <SectionCard title="Registration Screen (Join Now)" icon={UserPlus} iconColor="text-blue-600">
                <Input label="Form Title" value={config.registerTitle} onChange={e => updateField('registerTitle', e.target.value)} />
                <Input label="Form Subtitle" value={config.registerSubtitle} onChange={e => updateField('registerSubtitle', e.target.value)} />
                <Input label="Sidebar Headline" value={config.registerHeadline} onChange={e => updateField('registerHeadline', e.target.value)} />
                <TextArea label="Sidebar Description" value={config.registerDescription || ''} onChange={e => updateField('registerDescription', e.target.value)} />
                <Input label="Action Button Label" value={config.registerButtonLabel} onChange={e => updateField('registerButtonLabel', e.target.value)} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SectionCard title="Recovery Screen (Forgot Pin)" icon={History} iconColor="text-purple-600">
                <Input label="Form Title" value={config.resetTitle} onChange={e => updateField('resetTitle', e.target.value)} />
                <Input label="Form Subtitle" value={config.resetSubtitle} onChange={e => updateField('resetSubtitle', e.target.value)} />
                <Input label="Sidebar Headline" value={config.resetHeadline} onChange={e => updateField('resetHeadline', e.target.value)} />
                <TextArea label="Sidebar Description" value={config.resetDescription || ''} onChange={e => updateField('resetDescription', e.target.value)} />
                <Input label="Action Button Label" value={config.resetButtonLabel} onChange={e => updateField('resetButtonLabel', e.target.value)} />
              </SectionCard>

              <SectionCard title="Success Screen (Email Sent)" icon={Send} iconColor="text-green-600">
                <Input label="Success Title" value={config.sentTitle} onChange={e => updateField('sentTitle', e.target.value)} />
                <Input label="Success Subtitle" value={config.sentSubtitle} onChange={e => updateField('sentSubtitle', e.target.value)} />
                <Input label="Sidebar Headline" value={config.sentHeadline} onChange={e => updateField('sentHeadline', e.target.value)} />
                <TextArea label="Sidebar Description" value={config.sentDescription || ''} onChange={e => updateField('sentDescription', e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Input label="Go To Login Label" value={config.sentGoToLoginLabel || ''} onChange={e => updateField('sentGoToLoginLabel', e.target.value)} />
                   <Input label="Try Again Label" value={config.sentTryAgainLabel || ''} onChange={e => updateField('sentTryAgainLabel', e.target.value)} />
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SectionCard title="Policy Header" icon={ShieldCheck} iconColor="text-red-600">
                <Input label="Main Policy Title" value={config.privacyTitle} onChange={e => updateField('privacyTitle', e.target.value)} />
                <Input label="Last Effective Date" value={config.privacyEffectiveDate} onChange={e => updateField('privacyEffectiveDate', e.target.value)} />
              </SectionCard>

              <SectionCard title="Privacy Contact" icon={Mail} iconColor="text-orange-600">
                <Input label="Contact Section Title" value={config.privacyContactTitle || ''} onChange={e => updateField('privacyContactTitle', e.target.value)} />
                <Input label="Contact Section Subtitle" value={config.privacyContactSubtitle || ''} onChange={e => updateField('privacyContactSubtitle', e.target.value)} />
                <Input label="Privacy Email" value={config.privacyContactEmail} onChange={e => updateField('privacyContactEmail', e.target.value)} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <SectionCard title="1. Data Collection" icon={Database} iconColor="text-blue-600">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Input label="Title (En)" value={config.privacySection1Title} onChange={e => updateField('privacySection1Title', e.target.value)} />
                   <Input label="Title (Bn)" value={config.privacySection1TitleBn} onChange={e => updateField('privacySection1TitleBn', e.target.value)} />
                 </div>
                 <TextArea label="Legal Content" value={config.privacySection1Content} onChange={e => updateField('privacySection1Content', e.target.value)} />
               </SectionCard>

               <SectionCard title="2. Information Usage" icon={Lock} iconColor="text-purple-600">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Input label="Title (En)" value={config.privacySection2Title} onChange={e => updateField('privacySection2Title', e.target.value)} />
                   <Input label="Title (Bn)" value={config.privacySection2TitleBn} onChange={e => updateField('privacySection2TitleBn', e.target.value)} />
                 </div>
                 <TextArea label="Legal Content" value={config.privacySection2Content} onChange={e => updateField('privacySection2Content', e.target.value)} />
               </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <SectionCard title="3. Visibility Protocols" icon={Eye} iconColor="text-green-600">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Input label="Title (En)" value={config.privacySection3Title} onChange={e => updateField('privacySection3Title', e.target.value)} />
                   <Input label="Title (Bn)" value={config.privacySection3TitleBn} onChange={e => updateField('privacySection3TitleBn', e.target.value)} />
                 </div>
                 <TextArea label="Legal Content" value={config.privacySection3Content} onChange={e => updateField('privacySection3Content', e.target.value)} />
               </SectionCard>

               <SectionCard title="4. Third-Party Sharing" icon={Share2} iconColor="text-indigo-600">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Input label="Title (En)" value={config.privacySection4Title} onChange={e => updateField('privacySection4Title', e.target.value)} />
                   <Input label="Title (Bn)" value={config.privacySection4TitleBn} onChange={e => updateField('privacySection4TitleBn', e.target.value)} />
                 </div>
                 <TextArea label="Legal Content" value={config.privacySection4Content} onChange={e => updateField('privacySection4Content', e.target.value)} />
               </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <SectionCard title="5. User Rights" icon={UserCheck} iconColor="text-pink-600">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Input label="Title (En)" value={config.privacySection5Title} onChange={e => updateField('privacySection5Title', e.target.value)} />
                   <Input label="Title (Bn)" value={config.privacySection5TitleBn} onChange={e => updateField('privacySection5TitleBn', e.target.value)} />
                 </div>
                 <TextArea label="Legal Content" value={config.privacySection5Content} onChange={e => updateField('privacySection5Content', e.target.value)} />
               </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon: Icon, iconColor, children }: any) => (
  <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white relative overflow-hidden group h-full">
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-red-50 transition-colors"></div>
    <div className="flex items-center gap-4 mb-2">
      <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 shadow-inner", iconColor)}>
        <Icon size={24} />
      </div>
      <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase">{title}</h3>
    </div>
    <div className="space-y-5 relative z-10">
      {children}
    </div>
  </Card>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={clsx(
      "px-6 lg:px-8 py-3 rounded-xl lg:rounded-[1.5rem] text-[10px] lg:text-[11px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2", 
      active ? "bg-white shadow-xl text-red-600 scale-[1.02]" : "text-slate-500 hover:text-slate-900"
    )}
  >
    <Icon size={16} /> {label}
  </button>
);

const TextArea = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</label>
    <textarea 
      className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-red-500/10 outline-none min-h-[120px] shadow-inner transition-all resize-none" 
      value={value} 
      onChange={onChange} 
    />
  </div>
);
