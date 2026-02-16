
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getUsers, requestDirectoryAccess, getDonations, getUserFeedbacks } from '../services/api';
import { Card, Badge, Button, Toast, useToast } from '../components/UI';
import { User, BloodGroup, UserRole, DonationRecord, DonationFeedback, FeedbackStatus } from '../types';
import { Lock, ShieldAlert, MapPin, Phone, Calendar, User as UserIcon, Search, Droplet, Filter, X, Mail, Hash, Activity, CheckCircle2, AlertCircle, Quote, Star, Trophy, Award, Medal, MessageSquareQuote } from 'lucide-react';
import clsx from 'clsx';
import { getRankData } from './Profile';
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate, useLocation } = ReactRouterDOM;

export const DonorDirectory = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [group, setGroup] = useState('');
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<DonationFeedback[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch data for everyone (public access to list)
    Promise.all([getUsers(), getDonations()]).then(([fetchedUsers, fetchedDonations]) => {
      setUsers(fetchedUsers);
      setDonations(fetchedDonations);
    });
  }, []);

  // Handle auto-opening of profile after login redirect
  useEffect(() => {
    if (location.state?.openProfileId && users.length > 0) {
      const target = users.find(u => u.id === location.state.openProfileId);
      if (target) {
        setViewUser(target);
        // Clear state to avoid reopening on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, users]);

  useEffect(() => {
    if (viewUser) {
      getUserFeedbacks(viewUser.id).then(data => {
        setUserFeedbacks(data.filter(f => f.status === FeedbackStatus.APPROVED));
      });
    } else {
      setUserFeedbacks([]);
    }
  }, [viewUser]);

  const checkEligibility = (lastDate?: string) => {
    if (!lastDate) return { eligible: true, daysLeft: 0 };
    const lastDonation = new Date(lastDate);
    const today = new Date();
    const nextEligible = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
    const diffTime = nextEligible.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      eligible: diffDays <= 0,
      daysLeft: Math.max(0, diffDays)
    };
  };

  const getDonationCount = (userId: string) => {
    return donations.filter(d => d.userId === userId && d.status === 'COMPLETED').length;
  };

  const handleViewProfile = (u: User) => {
    if (!user) {
      // Redirect to login with return path and profile ID
      navigate('/login', { state: { from: location, openProfileId: u.id } });
      return;
    }
    setViewUser(u);
  };

  // Get Unique Locations for Dropdown
  const uniqueLocations = Array.from(new Set(users.map(u => u.location).filter(Boolean))).sort();

  // Updated Filter Logic: Name, Location (Text/Dropdown), or ID
  const filtered = users.filter(u => {
    const searchLower = filter.toLowerCase();
    
    const matchesSearch = 
      u.name.toLowerCase().includes(searchLower) || 
      u.location.toLowerCase().includes(searchLower) ||
      (u.idNumber && u.idNumber.toLowerCase().includes(searchLower));
      
    const matchesGroup = group === '' || u.bloodGroup === group;
    const matchesLocation = locationFilter === '' || u.location === locationFilter;
    
    return matchesSearch && matchesGroup && matchesLocation;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 px-4 lg:px-0 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      
      {/* View Profile Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setViewUser(null)} 
              className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-sm"
            >
              <X size={20} />
            </button>

            {/* Cover & Avatar */}
            <div className="h-40 relative">
              {viewUser.coverImage ? (
                <img src={viewUser.coverImage} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600"></div>
              )}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                <div className={clsx(
                  "w-32 h-32 rounded-full border-[6px] shadow-xl overflow-hidden bg-white",
                  checkEligibility(viewUser.lastDonationDate).eligible ? "border-green-500" : "border-red-500"
                )}>
                  {viewUser.avatar ? (
                    <img src={viewUser.avatar} className="w-full h-full object-cover" alt={viewUser.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                      <UserIcon size={48} />
                    </div>
                  )}
                </div>
                
                {/* Modal Rank Badge */}
                {(() => {
                  const rank = getRankData(getDonationCount(viewUser.id));
                  return rank && (
                    <div className={clsx(
                      "absolute bottom-0 right-0 translate-x-1 translate-y-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10",
                      rank.bg, rank.color
                    )}>
                      <rank.icon size={18} fill="currentColor" />
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-20 pb-8 px-8 text-center space-y-8">
              {/* Identity Header */}
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{viewUser.name}</h2>
                <div className="flex justify-center gap-2">
                  <Badge color="blue" className="text-[10px] uppercase tracking-widest px-3">{viewUser.role}</Badge>
                  <Badge color="gray" className="text-[10px] uppercase tracking-widest px-3 font-mono">{viewUser.idNumber}</Badge>
                </div>
              </div>

              {/* Status Section */}
              {(() => {
                const { eligible, daysLeft } = checkEligibility(viewUser.lastDonationDate);
                return (
                  <div className={clsx("p-4 rounded-2xl border flex items-center justify-center gap-3", eligible ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700")}>
                    {eligible ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Status</p>
                      <p className="font-bold text-sm">{eligible ? "Available to Donate" : `Resting (${daysLeft} days left)`}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Info Grid */}
              <div className="space-y-4 text-left">
                {/* Blood Group and Location in one row */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-600 shadow-sm shrink-0"><Droplet size={20} /></div>
                      <div className="min-w-0">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Group</p>
                         <p className="text-lg font-black text-slate-900">{viewUser.bloodGroup}</p>
                      </div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-sm shrink-0"><MapPin size={20} /></div>
                      <div className="min-w-0">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Location</p>
                         <p className="text-sm font-bold text-slate-900 truncate" title={viewUser.location}>{viewUser.location}</p>
                      </div>
                   </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0"><Phone size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Number</p>
                    <a href={`tel:${viewUser.phone}`} className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">{viewUser.phone}</a>
                  </div>
                </div>

                {viewUser.email && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm shrink-0"><Mail size={20} /></div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{viewUser.email}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className="w-8 h-8 mx-auto bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-2"><Activity size={16} /></div>
                    <p className="text-2xl font-black text-slate-900">{getDonationCount(viewUser.id)}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Donations</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className="w-8 h-8 mx-auto bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-2"><Calendar size={16} /></div>
                    <p className="text-sm font-black text-slate-900 mt-2">{viewUser.lastDonationDate ? new Date(viewUser.lastDonationDate).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Donate</p>
                  </div>
                </div>

                {/* Approved Feedbacks Section */}
                {userFeedbacks.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <MessageSquareQuote size={14} className="text-slate-400" /> Community Feedback
                    </h3>
                    <div className="space-y-3">
                      {userFeedbacks.map(f => (
                        <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                          <Quote size={14} className="absolute top-3 left-3 text-slate-300 fill-current" />
                          <p className="text-xs font-medium text-slate-600 pl-5 italic leading-relaxed">"{f.message}"</p>
                          <p className="text-[12px] font-black text-slate-400 text-right mt-2 uppercase tracking-widest">
                            {new Date(f.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Donor Directory</h1>
          <p className="text-slate-500 font-medium">Find lifesavers in your local community.</p>
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            {/* Search Box - Reduced width */}
            <div className="relative group w-full lg:w-72">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors z-10">
                 <Search size={20} />
               </div>
               <input 
                 placeholder="Search Name, ID..." 
                 value={filter} 
                 onChange={e => setFilter(e.target.value)} 
                 className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none shadow-xl shadow-slate-200/50 focus:ring-4 focus:ring-red-500/5 focus:border-red-600 transition-all placeholder:text-slate-300"
               />
            </div>

            {/* Location and Group in one row */}
            <div className="flex flex-row gap-4 w-full lg:w-auto">
              <div className="relative group flex-1 min-w-[140px]">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors z-10 pointer-events-none">
                   <MapPin size={18} />
                 </div>
                 <select 
                   value={locationFilter} 
                   onChange={e => setLocationFilter(e.target.value)} 
                   className="w-full pl-12 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest outline-none shadow-xl shadow-slate-200/50 focus:border-red-600 cursor-pointer appearance-none text-slate-700"
                 >
                   <option value="">All Locations</option>
                   {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                 </select>
              </div>

              <div className="relative group w-32 sm:w-40">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors z-10 pointer-events-none">
                   <Filter size={18} />
                 </div>
                 <select 
                   value={group} 
                   onChange={e => setGroup(e.target.value)} 
                   className="w-full pl-12 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest outline-none shadow-xl shadow-slate-200/50 focus:border-red-600 cursor-pointer appearance-none text-slate-700"
                 >
                   <option value="">Groups</option>
                   {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                 </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(u => {
          const { eligible } = checkEligibility(u.lastDonationDate);
          const donationCount = getDonationCount(u.id);
          const rank = getRankData(donationCount);

          return (
            <Card key={u.id} className="group overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem] hover:shadow-2xl transition-all duration-300 flex flex-col">
              {/* Cover Image Section */}
              <div className="h-28 w-full bg-slate-100 relative">
                {u.coverImage ? (
                  <img src={u.coverImage} className="w-full h-full object-cover" alt="cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300"></div>
                )}
                {/* Eligibility Indicator */}
                <div className={clsx("absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg", eligible ? "bg-green-500" : "bg-red-500")}>
                  {eligible ? 'Active' : 'Resting'}
                </div>
              </div>

              {/* Profile Content */}
              <div className="px-6 pb-6 flex flex-col items-center flex-1 relative">
                {/* Avatar Overlap with Border Color Status & Rank Badge */}
                <div className="-mt-12 mb-4 relative">
                  <div className={clsx(
                    "w-24 h-24 rounded-full border-[5px] shadow-xl overflow-hidden bg-white",
                    eligible ? "border-green-500" : "border-red-500"
                  )}>
                    {u.avatar ? (
                      <img src={u.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={u.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><UserIcon size={32} /></div>
                    )}
                  </div>
                  
                  {/* Blood Group Badge (Bottom Left) */}
                  <div className="absolute bottom-0 left-0 -translate-x-2 translate-y-1 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md z-10">
                    {u.bloodGroup.replace(/([+-])/, '')}<span className="text-[7px] align-top">{u.bloodGroup.slice(-1)}</span>
                  </div>

                  {/* Rank Badge (Bottom Right) */}
                  {rank && (
                    <div className={clsx(
                      "absolute bottom-0 right-0 translate-x-2 translate-y-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md z-10",
                      rank.bg, rank.color
                    )}>
                      <rank.icon size={14} fill="currentColor" />
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-900 text-center leading-tight mb-1">{u.name}</h3>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin size={12} /> {u.location || 'Unknown'}
                  </div>
                  {/* BL-ID Badge */}
                  {u.idNumber && (
                    <Badge color="purple" className="text-[10px] py-0.5 px-2 border border-purple-200 font-mono">
                      {u.idNumber}
                    </Badge>
                  )}
                </div>

                <div className="w-full grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Donate</p>
                      <p className="text-xs font-bold text-slate-700">{u.lastDonationDate ? new Date(u.lastDonationDate).toLocaleDateString() : 'Never'}</p>
                   </div>
                   <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-xs font-bold text-slate-700">{donationCount} Pts</p>
                   </div>
                </div>

                <div className="mt-auto w-full">
                  <Button onClick={() => handleViewProfile(u)} className="w-full rounded-2xl py-4 shadow-lg shadow-red-100 bg-red-600 hover:bg-red-700 group-hover:scale-[1.02] transition-transform">
                    {user ? "View Profile" : "Login to View"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
