
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getDonations, updateDonationStatus, deleteDonationRecord } from '../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal } from '../components/UI';
import { DonationRecord, DonationStatus } from '../types';
import { Database, Check, X, Trash2, Search, Filter, User, MapPin, Clock } from 'lucide-react';
import clsx from 'clsx';

export const AdminDonations = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDonations();
      setDonations(data);
    } catch (e) {
      showToast("Failed to load donations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatus = async (id: string, status: DonationStatus) => {
    if (!user) return;
    try {
      await updateDonationStatus(id, status, user);
      showToast(`Donation marked as ${status}`);
      fetchData();
    } catch (e) {
      showToast("Update failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteDonationRecord(deleteId, user);
      showToast("Record archived");
      setDeleteId(null);
      fetchData();
    } catch (e) {
      showToast("Delete failed", "error");
    }
  };

  const filtered = donations.filter(d => {
    const matchesFilter = filter === 'ALL' || d.status === filter;
    const matchesSearch = d.userName.toLowerCase().includes(search.toLowerCase()) || 
                          d.location.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Loading Records...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Archive Record?" message="This donation record will be moved to archives." />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Donation Records</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and verify blood donation history.</p>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="relative group flex-1 lg:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor or location..." className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold w-full lg:w-64 outline-none focus:ring-2 focus:ring-red-500/20" />
           </div>
           <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black uppercase tracking-widest outline-none cursor-pointer">
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
           </select>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">Donor</th>
                <th className="px-8 py-5">Details</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-300"/>}
                       </div>
                       <div>
                          <p className="font-black text-slate-900">{d.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.userBloodGroup}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-slate-600 font-bold text-xs"><MapPin size={14} className="text-slate-400"/> {d.location}</div>
                       <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest"><Clock size={12}/> {new Date(d.donationDate).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-8 py-5"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')}>{d.status}</Badge></td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {d.status === DonationStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm" title="Approve"><Check size={18}/></button>
                          <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm" title="Reject"><X size={18}/></button>
                        </>
                      )}
                      <button onClick={() => setDeleteId(d.id)} className="p-2.5 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm" title="Archive Record"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-black uppercase tracking-widest italic">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
