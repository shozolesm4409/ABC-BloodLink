
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { submitFeedback, getUserFeedbacks, getAllFeedbacks, updateFeedbackStatus, deleteFeedback, subscribeToApprovedFeedbacks, updateFeedbackMessage, toggleFeedbackVisibility } from '../services/api';
import { Card, Button, Input, Toast, useToast, Badge, ConfirmModal } from '../components/UI';
import { DonationFeedback, FeedbackStatus, UserRole } from '../types';
import { MessageSquareQuote, Send, Clock, Check, X, Trash2, User, Quote, Edit3, Eye, EyeOff } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import clsx from 'clsx';

export const DonationFeedbackPage = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<DonationFeedback[]>([]);

  useEffect(() => {
    if (user) {
      getUserFeedbacks(user.id).then(setHistory);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setLoading(true);
    try {
      await submitFeedback(message, user);
      showToast("Feedback submitted for review.");
      setMessage('');
      getUserFeedbacks(user.id).then(setHistory);
    } catch (e) {
      showToast("Submission failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="text-center space-y-4 py-8">
         <div className="w-16 h-16 bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl shadow-red-200">
            <MessageSquareQuote size={32} />
         </div>
         <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Share Your Journey</h1>
         <p className="text-slate-500 font-medium max-w-lg mx-auto">Your stories inspire others to save lives. Share your experience with the BloodLink community.</p>
      </div>

      <Card className="p-8 border-0 shadow-2xl bg-white rounded-[2.5rem]">
         <form onSubmit={handleSubmit}>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write about your donation experience..."
              className="w-full p-6 bg-slate-50 border-0 rounded-2xl text-lg font-medium text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-red-100 outline-none resize-none min-h-[150px]"
              required
            />
            <div className="flex justify-end mt-6">
               <Button type="submit" isLoading={loading} className="px-8 py-4 rounded-2xl text-base shadow-xl bg-red-600 hover:bg-red-700">
                  <Send size={18} className="mr-2" /> Post Feedback
               </Button>
            </div>
         </form>
      </Card>

      <div className="space-y-6">
         <h3 className="text-xl font-black text-slate-900 px-2">My History</h3>
         {history.length > 0 ? history.map(f => (
           <Card key={f.id} className="p-6 border-0 shadow-lg bg-white rounded-[2rem] flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                    <Badge color={f.status === 'APPROVED' ? 'green' : (f.status === 'REJECTED' ? 'red' : 'yellow')}>{f.status}</Badge>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> {new Date(f.timestamp).toLocaleDateString()}</span>
                 </div>
                 <p className="text-slate-600 font-medium italic">"{f.message}"</p>
              </div>
           </Card>
         )) : <div className="text-center py-10 text-slate-300 font-black uppercase tracking-widest">No history yet</div>}
      </div>
    </div>
  );
};

export const FeedbackApprovalPage = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  
  const [editingFeedback, setEditingFeedback] = useState<DonationFeedback | null>(null);
  const [editMessage, setEditMessage] = useState('');

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await getAllFeedbacks();
      setFeedbacks(data);
    } catch (e) {
      showToast("Failed to fetch feedbacks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleStatusUpdate = async (id: string, status: FeedbackStatus) => {
    try {
      await updateFeedbackStatus(id, status, true); // visible by default on approve
      showToast(`Feedback ${status.toLowerCase()}.`);
      fetchFeedbacks();
    } catch (e) { showToast("Action failed", "error"); }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      await toggleFeedbackVisibility(id, !current);
      showToast(`Visibility toggled.`);
      fetchFeedbacks();
    } catch (e) { showToast("Action failed", "error"); }
  };

  const handleDelete = async () => {
    if (!user || !deleteFeedbackId) return;
    try {
      await deleteFeedback(deleteFeedbackId, user);
      showToast("Feedback archived.");
      setDeleteFeedbackId(null);
      fetchFeedbacks();
    } catch (e) { showToast("Delete failed", "error"); }
  };

  const handleSaveEdit = async () => {
    if (!user || !editingFeedback) return;
    try {
      await updateFeedbackMessage(editingFeedback.id, editMessage, user);
      showToast("Content updated.");
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (e) { showToast("Update failed", "error"); }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Loading Feedbacks...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteFeedbackId} onClose={() => setDeleteFeedbackId(null)} onConfirm={handleDelete} title="Archive Feedback?" message="This feedback will be moved to archives." />

      {editingFeedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
           <Card className="w-full max-w-lg p-8 shadow-2xl bg-white border-0 rounded-[2.5rem]">
              <h3 className="text-xl font-black text-slate-900 mb-4">Edit Feedback</h3>
              <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl mb-4 h-32 resize-none outline-none focus:ring-2 focus:ring-blue-100" />
              <div className="flex gap-4">
                 <Button onClick={handleSaveEdit} className="flex-1 rounded-xl">Save</Button>
                 <Button variant="outline" onClick={() => setEditingFeedback(null)} className="flex-1 rounded-xl">Cancel</Button>
              </div>
           </Card>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
         <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Moderate Feedback</h1>
            <p className="text-sm text-slate-500 font-medium">Review community posts.</p>
         </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">Author</th>
                <th className="px-8 py-5">Message</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Visibility</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {feedbacks.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <User size={20} className="p-2 text-slate-300 w-full h-full" />}
                       </div>
                       <div>
                          <p className="font-black text-slate-900">{f.userName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(f.timestamp).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-slate-600 font-medium italic line-clamp-2 max-w-xs">"{f.message}"</p>
                  </td>
                  <td className="px-8 py-5"><Badge color={f.status === 'APPROVED' ? 'green' : (f.status === 'REJECTED' ? 'red' : 'yellow')}>{f.status}</Badge></td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleVisibility(f.id, f.isVisible)} 
                      disabled={f.status !== FeedbackStatus.APPROVED}
                      className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        f.isVisible ? "bg-blue-50 text-blue-600 shadow-sm ring-4 ring-blue-50" : "bg-slate-50 text-slate-300 opacity-50 grayscale"
                      )}
                      title={f.isVisible ? "Visible on landing page" : "Hidden from landing page"}
                    >
                      {f.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {f.status === FeedbackStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.APPROVED)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Approve">
                            <Check size={20} />
                          </button>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Reject">
                            <X size={20} />
                          </button>
                        </>
                      )}
                      <button onClick={() => { setEditingFeedback(f); setEditMessage(f.message); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit message">
                        <Edit3 size={20} />
                      </button>
                      <button onClick={() => setDeleteFeedbackId(f.id)} className="p-2 text-slate-500 hover:text-red-600 transition-colors" title="Delete feedback">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const PublicFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToApprovedFeedbacks((data) => {
      setFeedbacks(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <PublicLayout>
      <div className="py-20 px-6 lg:px-10 bg-[#f8f9fa] min-h-screen">
         <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="text-center">
               <div className="w-20 h-20 bg-red-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-200">
                  <MessageSquareQuote size={40} />
               </div>
               <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4">Donor Voices</h1>
               <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">Real stories from real heroes who are making a difference in the community.</p>
            </div>

            {loading ? <div className="text-center py-20 opacity-30 font-black uppercase text-slate-400">Loading Stories...</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {feedbacks.map(f => (
                   <div key={f.id} className="bg-white p-10 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col hover:transform hover:-translate-y-2 transition-all duration-300">
                      <Quote size={48} className="text-red-100 fill-current mb-6" />
                      <p className="text-slate-700 font-bold text-lg leading-relaxed mb-10 flex-1">"{f.message}"</p>
                      
                      <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
                         <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                            {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <User className="p-3 text-slate-300 w-full h-full" />}
                         </div>
                         <div>
                            <p className="font-black text-slate-900 text-lg leading-tight">{f.userName}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(f.timestamp).toLocaleDateString()}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            )}
         </div>
      </div>
    </PublicLayout>
  );
};
