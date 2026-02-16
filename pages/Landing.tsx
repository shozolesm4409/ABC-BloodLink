
import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, subscribeToApprovedFeedbacks, getLandingConfig, getCachedFeedbacks, getUsers } from '../services/api';
import { DonationStatus, DonationFeedback, LandingPageConfig, User, BloodGroup } from '../types';
import { Droplet, Users, HeartPulse, Activity, User as UserIcon, Calendar, ArrowRight, ShieldCheck, Quote, Trophy, Sparkles, Search } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { getRankData } from './Profile';
import { Card } from '../components/UI';
import clsx from 'clsx';

const { Link } = ReactRouterDOM;

export const Landing = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolume: 0
  });
  
  const [bloodStats, setBloodStats] = useState<Record<string, { count: number, volume: number }>>({});
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>(getCachedFeedbacks());
  const [topThree, setTopThree] = useState<any[]>([]);
  
  const [config, setConfig] = useState<LandingPageConfig>({
    heroTitle: 'এক ফোঁটা রক্ত\nহাজারো জীবনের আশা',
    heroSubtitle: 'রক্তদাতা ও প্রয়োজনের মাঝে সবচেয়ে দ্রুত ও নিরাপদ সেতু। আজই আমাদের কমিউনিটিতে যোগ দিন — একটি জীবন বাঁচানোর মহান সুযোগ নিন।',
    heroButtonPrimary: 'রক্তদাতা হিসেবে নিবন্ধন',
    heroButtonSecondary: 'রক্তের অনুসন্ধান করুন',
    statsSectionTitle: 'আমাদের লাইভ পরিসংখ্যান',
    feedbackSectionTitle: 'ডোনারদের বাস্তব অভিজ্ঞতা',
    feedbackSectionSubtitle: 'সফল রক্তদাতাদের শেয়ার করা অনুপ্রেরণামূলক গল্পসমূহ',
    ctaTitle: 'রক্তের জরুরি প্রয়োজন?',
    ctaSubtitle: 'আমাদের শক্তিশালী ডিরেক্টরি ব্যবহার করে মুহূর্তের মধ্যে নিকটস্থ রক্তদাতাদের সাথে যোগাযোগ করুন।',
    ctaButtonText: 'এখনই শুরু করুন',
    footerCopyright: '© ২০২৬ BLOODLINK MANAGER',
    footerTagline: 'প্রতিটি ফোঁটা একটি জীবনের আশা।'
  });
  
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(prev => ({ ...prev, ...data }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
      setLoadingStats(false);
      
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      const unsubDonsRealtime = onSnapshot(collection(db, 'donations'), (donSnap) => {
        const dons = donSnap.docs.map(d => d.data());
        const completedDons = dons.filter(d => d.status === DonationStatus.COMPLETED);
        
        // Top Donors Calculation
        const counts: Record<string, number> = {};
        completedDons.forEach(d => {
          counts[d.userId] = (counts[d.userId] || 0) + 1;
        });

        const sorted = users
          .map(u => ({ ...u, donationCount: counts[u.id] || 0 }))
          .sort((a, b) => b.donationCount - a.donationCount)
          .slice(0, 3)
          .filter(u => u.donationCount > 0);
          
        setTopThree(sorted);
        
        // General Stats
        const totalVolume = completedDons.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
        const uniqueDonorIds = new Set(completedDons.map(d => d.userId));
        
        setStats(prev => ({ 
          ...prev, 
          totalDonors: uniqueDonorIds.size, 
          totalVolume: totalVolume 
        }));

        // Blood Group Stats Calculation
        const bStats: Record<string, { count: number, volume: number }> = {};
        Object.values(BloodGroup).forEach(bg => {
            bStats[bg] = { count: 0, volume: 0 };
        });

        completedDons.forEach(d => {
            if (bStats[d.userBloodGroup]) {
                bStats[d.userBloodGroup].count += 1;
                bStats[d.userBloodGroup].volume += (Number(d.units) || 0);
            }
        });
        setBloodStats(bStats);
      });

      return () => unsubDonsRealtime();
    }, (error) => {
      console.debug("Users stats restricted:", error);
    });

    const unsubscribeFeedbacks = subscribeToApprovedFeedbacks((data) => {
      setFeedbacks(data);
    });

    return () => {
      unsubUsers();
      unsubscribeFeedbacks();
    };
  }, []);

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#c1121f] to-[#e63946] text-white text-center py-24 lg:py-30 px-[5%] flex flex-col items-center relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
          <Droplet className="absolute top-10 left-[10%] rotate-12" size={120} />
          <Droplet className="absolute bottom-20 right-[15%] -rotate-12" size={160} />
        </div>
        <div className="relative z-10 max-w-5xl">
          <h1 className="font-galada text-4xl lg:text-7xl font-black leading-[1.3] mb-6 animate-fade-in-up whitespace-pre-line">
            {config.heroTitle}
          </h1>
          <p className="text-lg lg:text-2xl opacity-90 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {config.heroSubtitle}
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center w-full animate-fade-in-up mt-8 items-stretch" style={{ animationDelay: '0.4s' }}>
            <Link to="/register" className="bg-white text-[#c1121f] px-8 py-4 rounded-xl font-black text-base lg:text-lg shadow-2xl hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-2 group flex-1 md:flex-none min-w-[220px]">
              {config.heroButtonPrimary} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <Link to="/donors" className="bg-slate-900/40 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-black text-base lg:text-lg hover:bg-slate-900/60 transition-all text-center flex items-center justify-center gap-2 flex-1 md:flex-none min-w-[220px]">
              <Search size={20} /> {config.heroButtonSecondary}
            </Link>

            <Link to="/verify" className="bg-slate-900/40 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-black text-base lg:text-lg hover:bg-slate-900/60 transition-all text-center flex items-center justify-center gap-2 flex-1 md:flex-none min-w-[220px]">
              <ShieldCheck size={20} /> Verify Users
            </Link>
          </div>

        </div>
      </section>

      <section className="py-10 lg:py-16 px-[5%] bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full mb-4">
              <div className={`w-2 h-2 rounded-full ${!loadingStats ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{!loadingStats ? 'Live Data Sync Active' : 'Connecting to Database...'}</span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              {config.statsSectionTitle}
            </h2>
            <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-16">
            <StatCard value={loadingStats ? 0 : stats.totalUsers} label="মোট মেম্বার" icon={Users} />
            <StatCard value={loadingStats ? 0 : stats.totalDonors} label="সফল ডোনার" icon={Activity} />
            <StatCard value={loadingStats ? '0' : `${stats.totalVolume.toLocaleString()} ml`} label="সংগৃহীত রক্ত" icon={HeartPulse} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {(Object.entries(bloodStats) as [string, { count: number; volume: number }][])
              .filter(([_, data]) => data.count > 0)
              .map(([bg, data]) => (
              <div key={bg} className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group">
                 <h3 className="text-2xl font-black text-[#c1121f] mb-1 group-hover:scale-110 transition-transform">{bg}</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">{data.count} Donations</p>
                 <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200">
                    {data.volume < 1000 ? `${data.volume} ML` : `${(data.volume / 1000).toFixed(2).replace(/\.00$/, '')} L`}
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py10 lg:py-12 px-[5%] bg-[#fcfdfe] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-1.5 rounded-full mb-4">
              <Trophy size={14} className="fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Heroes of the Community</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
              সেরা ৩ রক্তদাতা
            </h2>
            <div className="w-20 h-2 bg-yellow-500 mx-auto rounded-full mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            {topThree.length > 0 ? topThree.map((hero, idx) => {
              const rank = getRankData(hero.donationCount);
              return (
                <div key={hero.id} className={clsx(
                  "relative bg-white rounded-[3rem] p-10 border-2 transition-all hover:shadow-2xl group text-center",
                  idx === 0 ? "md:order-2 md:scale-110 md:-translate-y-4 border-yellow-200 z-10" : 
                  idx === 1 ? "md:order-1 border-slate-100" : "md:order-3 border-slate-100"
                )}>
                  <div className="relative mb-8 mx-auto w-32 h-32">
                    <div className={clsx(
                      "w-full h-full rounded-[2.5rem] bg-slate-50 overflow-hidden border-4 border-white shadow-2xl",
                      idx === 0 && "ring-4 ring-yellow-400"
                    )}>
                      {hero.avatar ? <img src={hero.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-8 text-slate-300" size={64} />}
                    </div>
                    {rank && (
                      <div className={clsx(
                        "absolute -top-4 -right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white",
                        rank.bg, rank.color
                      )}>
                        <rank.icon size={24} fill="currentColor" />
                      </div>
                    )}
                    <div className={clsx(
                      "absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-black text-white text-xs shadow-lg",
                      idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-400" : "bg-orange-400"
                    )}>
                      #{idx + 1}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-red-600 transition-colors leading-tight">{hero.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{hero.location}</p>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                    <div className="text-left">
                       <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Rank Title</p>
                       <p className={clsx("text-sm font-black", rank?.color)}>{rank?.name || 'Newbie'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Donations</p>
                       <p className="text-sm font-black text-slate-900">{hero.donationCount} বার</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-10 text-center opacity-30 italic">সেরা ডোনারদের তথ্য পাওয়া যাচ্ছে না...</div>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-12 px-[5%] bg-white min-h-[400px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
              {config.feedbackSectionTitle}
            </h2>
            <div className="w-20 h-2 bg-red-600 mx-auto rounded-full mb-6"></div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm opacity-60">
              {config.feedbackSectionSubtitle}
            </p>
          </div>

          {feedbacks.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {feedbacks.slice(0, 6).map(f => (
                  <div key={f.id} className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col justify-between hover:shadow-xl transition-all group">
                    <div>
                      <div className="mb-4">
                        <Quote size={40} className="text-red-100 fill-current opacity-50" />
                      </div>
                      <p className="text-slate-700 font-bold text-lg leading-relaxed mb-10 min-h-[100px]">
                        "{f.message}"
                      </p>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                          {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" alt={f.userName} /> : <UserIcon className="p-3.5 text-slate-300 w-full h-full" />}
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 text-lg leading-tight">{f.userName}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(f.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 text-center">
                <Link to="/public-feedbacks" className="inline-flex items-center gap-3 text-red-600 font-black uppercase tracking-[0.3em] text-xs hover:gap-5 transition-all px-10 py-5 rounded-full bg-red-50 hover:bg-red-100">
                  সবগুলো অভিজ্ঞতা দেখুন <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Activity className="animate-spin text-red-600 mb-4" size={32} />
              <p className="font-bold text-slate-400 italic">অভিজ্ঞতাগুলো লোড হচ্ছে...</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white px-[5%] relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-5xl font-black mb-6 tracking-tight">
              {config.ctaTitle}
            </h2>
            <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-xl">
              {config.ctaSubtitle}
            </p>
          </div>
          <Link to="/register" className="bg-red-600 text-white px-8 py-4 rounded-xl font-black text-xl shadow-2xl hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 group">
            {config.ctaButtonText} <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

const StatCard = ({ value, label, icon: Icon }: any) => (
  <Card className="p-6 border-0 shadow-lg flex items-center gap-5 hover:shadow-xl transition-all bg-white rounded-[2rem] group">
    <div className="p-5 rounded-2xl bg-red-50 text-red-600 transition-transform group-hover:scale-110 shadow-inner">
      <Icon size={28} />
    </div>
    <div>
      <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">{label}</p>
    </div>
  </Card>
);
