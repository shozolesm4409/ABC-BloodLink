
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { UserRole, DonationRecord, DonationStatus, User, BloodGroup } from '../types';
import { getDonations, getUserDonations, getUsers, handleDirectoryAccess, handleSupportAccess, handleFeedbackAccess, handleIDCardAccess, updateDonationStatus, ADMIN_EMAIL } from '../services/api';
import { Card, Badge, Button } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Droplet, Users, TrendingUp, Trophy, ArrowRight, CheckCircle, BellRing, Clock, ShieldCheck, Check, X, HeartPulse, History, Activity, Heart, Calendar, Award, Shield, Edit, User as UserIcon, UserCheck, ShieldCheck as ShieldIcon, IdCard, LayoutList, Fingerprint } from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
import clsx from 'clsx';

const { Link } = ReactRouterDOM;

export const Dashboard = () => {
  const { user } = useAuth();
  const [userDonations, setUserDonations] = useState<DonationRecord[]>([]);
  const [allDonations, setAllDonations] = useState<DonationRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || (user?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
  const isManagement = isSuperAdmin || user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;

  const fetchData = async () => {
    try {
      const [userDons, globalDons, u] = await Promise.all([
        getUserDonations(user?.id || ''),
        getDonations(),
        getUsers()
      ]);
      
      setUserDonations(userDons);
      setAllDonations(globalDons);
      setAllUsers(u);
      
      if (isManagement) {
        const directoryReqs = u.filter(usr => usr.directoryAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Directory' }));
        const supportReqs = u.filter(usr => usr.supportAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Support' }));
        const feedbackReqs = u.filter(usr => usr.feedbackAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Feedback' }));
        const idCardReqs = u.filter(usr => usr.idCardAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'IDCard' }));
        const donationReqs = globalDons.filter(don => don.status === DonationStatus.PENDING).map(don => ({ ...don, type: 'DONATION', accessType: 'Donation' }));
        
        setPendingItems([...directoryReqs, ...supportReqs, ...feedbackReqs, ...idCardReqs, ...donationReqs].sort((a,b) => b.id.localeCompare(a.id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAction = async (itemId: string, type: string, accessType: string, approve: boolean) => {
    if (!user || !isManagement) return;
    try {
      if (type === 'ACCESS') {
        const sub = accessType.toLowerCase();
        if (sub === 'directory') await handleDirectoryAccess(itemId, approve, user);
        else if (sub === 'support') await handleSupportAccess(itemId, approve, user);
        else if (sub === 'feedback') await handleFeedbackAccess(itemId, approve, user);
        else if (sub === 'idcard') await handleIDCardAccess(itemId, approve, user);
      } else if (type === 'DONATION') {
        await updateDonationStatus(itemId, approve ? DonationStatus.COMPLETED : DonationStatus.REJECTED, user);
      }
      fetchData();
    } catch (e) { alert("Action failed."); }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Initializing Dashboard...</div>;

  const lastDonationDate = user?.lastDonationDate ? new Date(user.lastDonationDate) : null;
  const today = new Date();
  const nextEligibleDate = lastDonationDate ? new Date(lastDonationDate.getTime() + 90 * 24 * 60 * 60 * 1000) : today;
  const isEligible = today >= nextEligibleDate;
  const diffDays = Math.max(0, Math.ceil((nextEligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = lastDonationDate ? Math.min(100, Math.max(0, (90 - diffDays) / 90 * 100)) : 100;
  
  const completedCount = userDonations.filter(d => d.status === DonationStatus.COMPLETED).length;
  const globalCompleted = allDonations.filter(d => d.status === DonationStatus.COMPLETED);

  const topHero = [...allUsers].sort((a, b) => {
    const aCount = allDonations.filter(d => d.userId === a.id && d.status === DonationStatus.COMPLETED).length;
    const bCount = allDonations.filter(d => d.userId === b.id && d.status === DonationStatus.COMPLETED).length;
    return bCount - aCount;
  })[0];

  const topHeroCount = allDonations.filter(d => d.userId === topHero?.id && d.status === DonationStatus.COMPLETED).length;

  const roleData = [
    { name: 'Admin', value: allUsers.filter(u => u.role === UserRole.ADMIN).length, color: '#ef4444' },
    { name: 'Editor', value: allUsers.filter(u => u.role === UserRole.EDITOR).length, color: '#3b82f6' },
    { name: 'User', value: allUsers.filter(u => u.role === UserRole.USER).length, color: '#10b981' },
    { name: 'SuperAdmin', value: allUsers.filter(u => u.role === UserRole.SUPERADMIN).length, color: '#8b5cf6' },
  ];

  const groupData = Object.values(BloodGroup).map(bg => ({
    group: bg,
    count: allUsers.filter(u => u.bloodGroup === bg).length
  }));

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitoring system analytics and community activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Volume" value={`${globalCompleted.reduce((a,b)=>a+b.units,0)}ml`} icon={Droplet} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Total Donors" value={allUsers.length} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="System Success" value={globalCompleted.length} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Queue Size" value={pendingItems.length} icon={LayoutList} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="p-4 lg:p-6 border-0 shadow-lg bg-white rounded-xl flex flex-col lg:flex-row items-center gap-3 lg:gap-5 text-center lg:text-left">
             <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"><UserIcon size={28} /></div>
             <div>
                <p className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400">Total Users</p>
                <p className="text-2xl lg:text-3xl font-black text-slate-900">{allUsers.filter(u => u.role === UserRole.USER).length}</p>
             </div>
          </Card>
          <Card className="p-4 lg:p-6 border-0 shadow-lg bg-white rounded-xl flex flex-col lg:flex-row items-center gap-3 lg:gap-5 text-center lg:text-left">
             <div className="w-12 h-12 lg:w-14 lg:h-14 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><ShieldIcon size={28} /></div>
             <div>
                <p className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400">Total Admin</p>
                <p className="text-2xl lg:text-3xl font-black text-slate-900">{allUsers.filter(u => u.role === UserRole.ADMIN).length}</p>
             </div>
          </Card>
          <Card className="p-4 lg:p-6 border-0 shadow-lg bg-white rounded-xl flex flex-col lg:flex-row items-center gap-3 lg:gap-5 text-center lg:text-left">
             <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Edit size={28} /></div>
             <div>
                <p className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400">Total Editor</p>
                <p className="text-2xl lg:text-3xl font-black text-slate-900">{allUsers.filter(u => u.role === UserRole.EDITOR).length}</p>
             </div>
          </Card>
          <Card className="p-4 lg:p-6 border-0 shadow-lg bg-white rounded-xl flex flex-col lg:flex-row items-center gap-3 lg:gap-5 text-center lg:text-left">
             <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Fingerprint size={28} /></div>
             <div>
                <p className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400">Total Super Admin</p>
                <p className="text-2xl lg:text-3xl font-black text-slate-900">{allUsers.filter(u => u.role === UserRole.SUPERADMIN).length}</p>
             </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {isSuperAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 border-0 shadow-lg bg-white rounded-xl">
                <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest"><Activity size={24} className="text-red-600" /> Role Distribution</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                        {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-8 border-0 shadow-lg bg-white rounded-xl">
                <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest"><Droplet size={24} className="text-blue-600" /> Blood Spread</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="group" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc', radius: 12}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          <Card className="p-10 border-0 shadow-2xl bg-white relative overflow-hidden rounded-xl">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Health & Eligibility</h3>
              </div>

              <div className="flex flex-col lg:flex-row gap-12">
                <div className="flex-1 space-y-8">
                  <div className={clsx(
                    "p-8 rounded-xl border-2 transition-all duration-500",
                    isEligible ? "bg-green-50 border-green-100 ring-4 ring-green-50/50" : "bg-blue-50 border-blue-100 ring-4 ring-blue-50/50"
                  )}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Current Status</p>
                    <p className={clsx("text-3xl font-black tracking-tighter mb-1", isEligible ? "text-green-600" : "text-blue-600")}>
                      {isEligible ? "ELIGIBLE TO DONATE" : "RESTING PERIOD"}
                    </p>
                    {!isEligible && (
                      <p className="text-sm font-bold text-slate-500/80">
                        Next blood donation possible in <span className="text-blue-600 font-black">{diffDays} days</span>.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Last Donated</p>
                      <p className="text-lg font-black text-slate-900">{user?.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : 'No Records'}</p>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Contribution</p>
                      <p className="text-lg font-black text-slate-900">{completedCount} Times</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-48 flex flex-col items-center justify-center text-center space-y-6">
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      <Heart className={clsx("w-full h-full stroke-[1.5] transition-colors duration-500", isEligible ? "text-green-100" : "text-blue-100")} />
                      <Activity className={clsx("absolute text-red-600 animate-pulse", isEligible ? "opacity-100" : "opacity-30")} size={32} />
                      <div className="absolute -bottom-2 right-0 bg-white shadow-xl border border-slate-50 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="text-xl font-black text-slate-900">{Math.round(progressPercent)}%</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recovery Progress</p>
                     <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className={clsx("h-full transition-all duration-1000", isEligible ? "bg-green-500" : "bg-blue-500")} style={{ width: `${progressPercent}%` }} />
                     </div>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[150px]">
                      মেডিকেল গাইডলাইন অনুযায়ী একবার রক্ত দেওয়ার পর শরীর স্বাভাবিক অবস্থায় ফিরতে ৩ মাস বা ৯০ দিন সময় লাগে।
                   </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          {isManagement && (
            <Card className="p-8 border-0 shadow-xl bg-white overflow-hidden rounded-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-3"><BellRing className="text-red-600" size={20} /> Recent Updates</h3>
                {pendingItems.length > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-l shadow-sm animate-pulse">{pendingItems.length}</span>}
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-red-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center">
                        {item.userAvatar || item.avatar ? <img src={item.userAvatar || item.avatar} className="w-full h-full object-cover" /> : <Droplet className="text-red-600" size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.userName || item.name}</p>
                        <Badge color={item.type === 'DONATION' ? 'red' : 'blue'} className="text-[8px] py-0 px-1.5">{item.accessType === 'IDCard' ? 'ID Card' : item.accessType} Request</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(item.id, item.type, item.accessType, true)} className="flex-1 bg-white border border-slate-200 p-2 rounded-lg text-green-600 hover:bg-green-600 hover:text-white transition-all flex justify-center shadow-sm"><Check size={16} /></button>
                      <button onClick={() => handleAction(item.id, item.type, item.accessType, false)} className="flex-1 bg-white border border-slate-200 p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all flex justify-center shadow-sm"><X size={16} /></button>
                    </div>
                  </div>
                ))}
                {pendingItems.length === 0 && <div className="text-center py-12 opacity-30 font-black uppercase text-[10px]">Nothing pending</div>}
              </div>
            </Card>
          )}

          <Card className="!bg-[#0B1120] relative overflow-hidden border-0 shadow-2xl rounded-[2rem] group h-full min-h-[400px]">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gradient-to-tr from-red-600/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="relative z-10 p-8 flex flex-col items-center h-full">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 px-5 py-2 rounded-full mb-12 backdrop-blur-sm shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                <Trophy size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-500">Top Contributor</span>
              </div>

              {/* Avatar Section */}
              <div className="relative mb-8 group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-600 rounded-[2rem] rotate-6 opacity-70 blur-md group-hover:rotate-12 transition-all duration-500"></div>
                <div className="relative w-32 h-32 bg-slate-800 rounded-[1.8rem] p-1.5 shadow-2xl ring-1 ring-white/10">
                  <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-slate-900 relative">
                    {topHero?.avatar ? (
                      <img src={topHero.avatar} className="w-full h-full object-cover" alt={topHero.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                        <UserIcon size={40} />
                      </div>
                    )}
                    {/* Rank Badge */}
                    <div className="absolute bottom-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-600 text-white w-10 h-10 rounded-tl-2xl flex items-center justify-center shadow-lg">
                      <span className="font-black text-sm">#1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center space-y-2 mb-10">
                <h4 className="text-3xl font-black text-white tracking-tight leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-orange-500 transition-all duration-300">
                  {topHero?.name || 'Loading...'}
                </h4>
                <div className="flex items-center justify-center gap-3">
                   <div className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                     <Droplet size={10} className="fill-current" />
                     {topHero?.bloodGroup || 'N/A'}
                   </div>
                   <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                   <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{topHero?.location || 'Unknown'}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group/stat">
                   <div className="flex items-center gap-2 mb-2 opacity-60 group-hover/stat:opacity-100 transition-opacity">
                     <HeartPulse size={14} className="text-red-400" />
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Donations</p>
                   </div>
                   <p className="text-2xl font-black text-white">{topHeroCount}</p>
                   <div className="w-full h-1 bg-slate-700/50 rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-red-500 w-[70%]"></div>
                   </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group/stat">
                   <div className="flex items-center gap-2 mb-2 opacity-60 group-hover/stat:opacity-100 transition-opacity">
                     <Award size={14} className="text-yellow-400" />
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Status</p>
                   </div>
                   <p className="text-2xl font-black text-yellow-400">HERO</p>
                   <div className="w-full h-1 bg-slate-700/50 rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-yellow-500 w-full"></div>
                   </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
  <Card className="p-3 lg:p-3 border-0 shadow-sm flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-3 lg:gap-5 hover:shadow-md transition-shadow group rounded-xl text-center lg:text-left">
    <div className={`p-3 lg:p-4 rounded-lg ${bg} transition-transform group-hover:scale-110 shadow-inner`}><Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${color} fill-current`} /></div>
    <div><p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] lg:tracking-[0.2em] mb-1 leading-none">{title}</p><p className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">{value}</p></div>
  </Card>
);
