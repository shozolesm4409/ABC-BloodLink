
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getHelpRequests, updateHelpRequest, deleteHelpRequest } from '../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal, Select, Input } from '../components/UI';
import { HelpRequest, HelpStatus, UserRole } from '../types';
import { HelpCircle, Save, Trash2, Edit2, CheckCircle2, AlertCircle, XCircle, Search, Filter } from 'lucide-react';
import clsx from 'clsx';

export const AdminHelpCenter = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HelpStatus>(HelpStatus.PENDING);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action States
  const [editItem, setEditItem] = useState<HelpRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, { status: HelpStatus, text: string }>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getHelpRequests();
      setRequests(data);
      // Initialize local state for inline editing
      const initialRemarks: any = {};
      data.forEach(req => {
        initialRemarks[req.id] = { status: req.status, text: req.remark || '' };
      });
      setRemarks(initialRemarks);
    } catch (e) {
      showToast("Failed to fetch requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRemarkChange = (id: string, field: 'status' | 'text', value: string) => {
    setRemarks(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = async (id: string) => {
    if (!user || !remarks[id]) return;
    setSavingId(id);
    try {
      await updateHelpRequest(id, {
        status: remarks[id].status,
        remark: remarks[id].text
      }, user);
      showToast("Request updated successfully.");
      fetchData();
    } catch (e) {
      showToast("Update failed.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteHelpRequest(deleteId, user);
      showToast("Request deleted.");
      setDeleteId(null);
      fetchData();
    } catch (e) {
      showToast("Delete failed.", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !editItem) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
    };
    
    try {
      await updateHelpRequest(editItem.id, updates, user);
      showToast("Details updated.");
      setEditItem(null);
      fetchData();
    } catch (e) {
      showToast("Update failed.", "error");
    }
  };

  const isSuperAdmin = user?.role === UserRole.SUPERADMIN;

  const filteredRequests = requests.filter(req => {
    const matchesFilter = req.status === filter;
    const matchesSearch = req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.phone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const TabButton = ({ status, label, icon: Icon, color }: any) => (
    <button 
      onClick={() => setFilter(status)}
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        filter === status ? `bg-white shadow-lg ${color}` : "text-slate-400 hover:bg-white/50"
      )}
    >
      <Icon size={16} /> {label}
      <span className={clsx("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", filter === status ? "bg-slate-100" : "bg-slate-200 text-slate-500")}>
        {requests.filter(r => r.status === status).length}
      </span>
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete Request?" 
        message="This action cannot be undone." 
      />

      {editItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-lg p-8 shadow-2xl bg-white border-0 rounded-[2.5rem]">
            <h3 className="text-xl font-black text-slate-900 mb-6">Edit Request Details</h3>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <Input label="Name" name="name" defaultValue={editItem.name} required />
              <Input label="Phone" name="phone" defaultValue={editItem.phone} required />
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Message</label>
                <textarea name="message" defaultValue={editItem.message} rows={4} className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none" required />
              </div>
              <div className="flex gap-4 pt-2">
                <Button type="submit" className="flex-1 rounded-xl">Update</Button>
                <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1 rounded-xl">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-xl shadow-purple-100">
            <HelpCircle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Help Center Manage</h1>
            <p className="text-sm text-slate-500 font-medium">Support tickets and inquiries.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          <TabButton status={HelpStatus.PENDING} label="Pending" icon={AlertCircle} color="text-yellow-600" />
          <TabButton status={HelpStatus.COMPLETE} label="Complete" icon={CheckCircle2} color="text-green-600" />
          <TabButton status={HelpStatus.REJECTED} label="Rejected" icon={XCircle} color="text-red-600" />
        </div>
        <div className="relative w-full md:w-80">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search by name or phone..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
           />
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
        {loading ? (
          <div className="p-20 text-center font-black text-slate-300 animate-pulse">Loading Requests...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-6 py-5 w-16">SL</th>
                  <th className="px-6 py-5">Name & Phone</th>
                  <th className="px-6 py-5 max-w-xs">Message</th>
                  <th className="px-6 py-5 w-64">Remark / Status</th>
                  {isSuperAdmin && <th className="px-6 py-5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900">{req.name}</p>
                      <p className="text-xs font-bold text-slate-500">{req.phone}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-600 font-medium line-clamp-2" title={req.message}>{req.message}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <select 
                          value={remarks[req.id]?.status || HelpStatus.PENDING}
                          onChange={(e) => handleRemarkChange(req.id, 'status', e.target.value)}
                          className={clsx(
                            "w-full px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer appearance-none",
                            remarks[req.id]?.status === HelpStatus.COMPLETE ? "bg-green-50 text-green-700 border-green-200" :
                            remarks[req.id]?.status === HelpStatus.REJECTED ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-yellow-50 text-yellow-700 border-yellow-200"
                          )}
                        >
                          <option value={HelpStatus.PENDING}>Pending</option>
                          <option value={HelpStatus.COMPLETE}>Complete</option>
                          <option value={HelpStatus.REJECTED}>Rejected</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="Add remark..." 
                          value={remarks[req.id]?.text || ''}
                          onChange={(e) => handleRemarkChange(req.id, 'text', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-400 outline-none"
                        />
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleSave(req.id)} disabled={savingId === req.id} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Save Changes">
                            <Save size={16} className={clsx(savingId === req.id && "animate-pulse")} />
                          </button>
                          <button onClick={() => setEditItem(req)} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-200 transition-all shadow-sm" title="Edit Details">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteId(req.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic">No requests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
