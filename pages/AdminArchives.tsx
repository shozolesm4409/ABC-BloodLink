
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { 
  getDeletedUsers, restoreDeletedUser, permanentlyDeleteArchivedUser,
  getDeletedDonations, restoreDeletedDonation, permanentlyDeleteArchivedDonation,
  getDeletedFeedbacks, restoreDeletedFeedback, permanentlyDeleteArchivedFeedback,
  getDeletedNotices, restoreDeletedNotice, permanentlyDeleteArchivedNotice,
  getDeletedHelpRequests, restoreDeletedHelpRequest, permanentlyDeleteArchivedHelpRequest,
  getDeletedLogs, restoreDeletedLog, permanentlyDeleteArchivedLog
} from '../services/api';
import { Card, Button, Toast, useToast, ConfirmModal } from '../components/UI';
import { Trash2, RotateCcw, Clock, Archive, User, FileText, MessageSquare, AlertCircle, Database, Megaphone, Activity } from 'lucide-react';
import clsx from 'clsx';

export const AdminArchives = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<'USERS' | 'DONATIONS' | 'FEEDBACKS' | 'NOTICES' | 'HELP' | 'LOGS'>('USERS');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let data = [];
      switch(activeTab) {
        case 'USERS': data = await getDeletedUsers(); break;
        case 'DONATIONS': data = await getDeletedDonations(); break;
        case 'FEEDBACKS': data = await getDeletedFeedbacks(); break;
        case 'NOTICES': data = await getDeletedNotices(); break;
        case 'HELP': data = await getDeletedHelpRequests(); break;
        case 'LOGS': data = await getDeletedLogs(); break;
      }
      setItems(data);
    } catch (e) {
      showToast("Failed to fetch archives", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [activeTab]);

  const handleRestore = async (id: string) => {
    if (!user) return;
    try {
      switch(activeTab) {
        case 'USERS': await restoreDeletedUser(id, user); break;
        case 'DONATIONS': await restoreDeletedDonation(id, user); break;
        case 'FEEDBACKS': await restoreDeletedFeedback(id, user); break;
        case 'NOTICES': await restoreDeletedNotice(id, user); break;
        case 'HELP': await restoreDeletedHelpRequest(id, user); break;
        case 'LOGS': await restoreDeletedLog(id, user); break;
      }
      showToast("Item restored successfully");
      fetchItems();
    } catch (e) {
      showToast("Restore failed", "error");
    }
  };

  const handlePermanentDelete = async () => {
    if (!user || !confirmId) return;
    try {
      if (activeTab === 'USERS') await permanentlyDeleteArchivedUser(confirmId, user);
      else if (activeTab === 'DONATIONS') await permanentlyDeleteArchivedDonation(confirmId, user);
      else if (activeTab === 'FEEDBACKS') await permanentlyDeleteArchivedFeedback(confirmId, user);
      else if (activeTab === 'NOTICES') await permanentlyDeleteArchivedNotice(confirmId, user);
      else if (activeTab === 'HELP') await permanentlyDeleteArchivedHelpRequest(confirmId, user);
      else if (activeTab === 'LOGS') await permanentlyDeleteArchivedLog(confirmId, user);
      
      showToast("Item permanently deleted");
      fetchItems();
      setConfirmId(null);
    } catch (e) {
      showToast("Delete failed", "error");
    }
  };

  const TabButton = ({ tab, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
        activeTab === tab ? "bg-white shadow-md text-red-600" : "text-slate-500 hover:bg-white/50"
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handlePermanentDelete} title="Permanently Delete?" message="This action cannot be undone. The record will be wiped from the database." />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">System Archives</h1>
          <p className="text-sm text-slate-500 font-medium">Recover or purge deleted records.</p>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar pb-2 lg:pb-1.5">
         <TabButton tab="USERS" label="Users" icon={User} />
         <TabButton tab="DONATIONS" label="Donations" icon={Database} />
         <TabButton tab="FEEDBACKS" label="Feedback" icon={MessageSquare} />
         <TabButton tab="NOTICES" label="Notices" icon={Megaphone} />
         <TabButton tab="HELP" label="Help Desk" icon={AlertCircle} />
         <TabButton tab="LOGS" label="Audit Logs" icon={Activity} />
      </div>

      {loading ? (
        <div className="p-20 text-center font-black text-slate-300 animate-pulse">Scanning Archives...</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-10 py-5">Record Info</th>
                    <th className="px-10 py-5">Deleted By</th>
                    <th className="px-10 py-5">Deleted At</th>
                    <th className="px-10 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-5">
                        <div className="font-bold text-slate-700">
                          {activeTab === 'USERS' && item.name}
                          {activeTab === 'DONATIONS' && `Donation: ${item.userName} (${item.units}ml)`}
                          {activeTab === 'FEEDBACKS' && `Feedback: "${item.message?.substring(0,30)}..."`}
                          {activeTab === 'NOTICES' && item.subject}
                          {activeTab === 'HELP' && `Help: ${item.name} (${item.phone})`}
                          {activeTab === 'LOGS' && `Log: ${item.action}`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {item.id}</div>
                      </td>
                      <td className="px-10 py-5 text-xs font-bold text-slate-600">{item.deletedBy || 'Unknown'}</td>
                      <td className="px-10 py-5 text-slate-400 text-xs font-bold">
                        <div className="flex items-center gap-2">
                           <Clock size={14} className="opacity-50" />
                           {new Date(item.deletedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-10 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleRestore(item.id)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm bg-white" title="Restore"><RotateCcw size={20}/></button>
                          <button onClick={() => setConfirmId(item.id)} className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl shadow-sm bg-white" title="Purge"><Trash2 size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic">Archive is empty</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {items.map(item => (
              <Card key={item.id} className="p-6 border-0 shadow-lg bg-white rounded-[2rem] relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-black text-slate-800 text-lg mb-1">
                      {activeTab === 'USERS' && item.name}
                      {activeTab === 'DONATIONS' && `Donation from ${item.userName}`}
                      {activeTab === 'FEEDBACKS' && "Feedback Entry"}
                      {activeTab === 'NOTICES' && item.subject}
                      {activeTab === 'HELP' && item.name}
                      {activeTab === 'LOGS' && item.action}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {activeTab === 'USERS' && item.role}
                      {activeTab === 'DONATIONS' && `${item.units}ml • ${item.userBloodGroup}`}
                      {activeTab === 'FEEDBACKS' && `"${item.message?.substring(0, 50)}..."`}
                      {activeTab === 'NOTICES' && `Type: ${item.type}`}
                      {activeTab === 'HELP' && item.phone}
                      {activeTab === 'LOGS' && item.details}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    {activeTab === 'USERS' && <User size={20} className="text-slate-400" />}
                    {activeTab === 'DONATIONS' && <Database size={20} className="text-slate-400" />}
                    {activeTab === 'FEEDBACKS' && <MessageSquare size={20} className="text-slate-400" />}
                    {activeTab === 'NOTICES' && <Megaphone size={20} className="text-slate-400" />}
                    {activeTab === 'HELP' && <AlertCircle size={20} className="text-slate-400" />}
                    {activeTab === 'LOGS' && <Activity size={20} className="text-slate-400" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <div className="flex-1">
                      <span className="block text-[8px] text-slate-300 mb-0.5">Deleted By</span>
                      {item.deletedBy || 'System'}
                   </div>
                   <div className="w-px h-6 bg-slate-200 mx-2"></div>
                   <div className="flex-1 text-right">
                      <span className="block text-[8px] text-slate-300 mb-0.5">Deleted At</span>
                      {new Date(item.deletedAt).toLocaleDateString()}
                   </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleRestore(item.id)} 
                    className="flex-1 py-3 rounded-xl bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} /> Restore
                  </button>
                  <button 
                    onClick={() => setConfirmId(item.id)} 
                    className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Purge
                  </button>
                </div>
              </Card>
            ))}
            {items.length === 0 && (
              <div className="p-10 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                <Archive size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No archives found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
