
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getAllFaqs, addFaq, updateFaq, deleteFaq, toggleFaqVisibility } from '../services/api';
import { Card, Button, Toast, useToast, ConfirmModal, Input } from '../components/UI';
import { FAQ } from '../types';
import { FileQuestion, Plus, Edit, Trash2, Eye, EyeOff, X, CornerDownRight, MessageCircle } from 'lucide-react';
import clsx from 'clsx';

export const AdminFaqs = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FAQ | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await getAllFaqs();
      setFaqs(data);
    } catch (e) {
      showToast("Failed to fetch FAQs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openAddModal = () => {
    setEditItem(null);
    setFormQuestion('');
    setFormAnswer('');
    setShowModal(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditItem(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    try {
      if (editItem) {
        await updateFaq(editItem.id, { question: formQuestion, answer: formAnswer }, user);
        showToast("FAQ Updated.");
      } else {
        await addFaq({ question: formQuestion, answer: formAnswer }, user);
        showToast("FAQ Created.");
      }
      setShowModal(false);
      fetchFaqs();
    } catch (e) {
      showToast("Operation failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    setActionLoading(true);
    try {
      await deleteFaq(deleteId, user);
      showToast("FAQ Deleted.");
      setDeleteId(null);
      fetchFaqs();
    } catch (e) {
      showToast("Delete failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleFaqVisibility(id, !currentStatus);
      showToast(`FAQ is now ${!currentStatus ? 'Visible' : 'Hidden'}.`);
      fetchFaqs();
    } catch (e) {
      showToast("Toggle failed.", "error");
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Loading FAQ's...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete FAQ?" 
        message="This action will permanently remove this Question and Answer."
        isLoading={actionLoading}
      />

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-lg p-8 shadow-2xl bg-white border-0 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 {editItem ? <Edit className="text-blue-600" /> : <Plus className="text-green-600" />} 
                 {editItem ? 'Edit FAQ' : 'Add New FAQ'}
               </h3>
               <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Question" value={formQuestion} onChange={e => setFormQuestion(e.target.value)} required placeholder="e.g. How can I donate?" />
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Answer</label>
                <textarea 
                  value={formAnswer} 
                  onChange={e => setFormAnswer(e.target.value)} 
                  required 
                  rows={5} 
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  placeholder="Enter the detailed answer..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <Button type="submit" isLoading={actionLoading} className="flex-1 py-4 rounded-2xl shadow-xl">
                  {editItem ? 'Save Changes' : 'Create FAQ'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-xl shadow-purple-100">
            <FileQuestion size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Moderate FAQ's</h1>
            <p className="text-sm text-slate-500 font-medium">Manage public questions and answers.</p>
          </div>
        </div>
        <Button onClick={openAddModal} className="rounded-2xl px-8 py-4 shadow-xl shadow-purple-100 bg-purple-600 hover:bg-purple-700 border-0 text-white">
          <Plus className="mr-2" size={18} /> Add New FAQ
        </Button>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-6 w-20 text-center">No.</th>
                <th className="px-8 py-6">Knowledge Base Content</th>
                <th className="px-8 py-6 text-right w-48">Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {faqs.map((faq, index) => (
                <tr key={faq.id} className={clsx("hover:bg-slate-50/50 transition-colors group", !faq.isVisible && "bg-slate-50 opacity-75 grayscale")}>
                  <td className="px-8 py-8 text-center font-black text-slate-300 text-sm align-top pt-8">{index + 1}</td>
                  <td className="px-8 py-8 align-top">
                    <div className="flex gap-5">
                       {/* Q Icon */}
                       <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-sm text-sm border border-blue-100">Q</div>
                       </div>
                       
                       <div className="space-y-6 w-full max-w-3xl">
                          <div>
                             <p className="text-lg font-black text-slate-800 leading-snug">{faq.question}</p>
                          </div>
                          
                          <div className="flex gap-4">
                             <div className="flex-shrink-0 mt-1">
                                <CornerDownRight size={20} className="text-slate-300" />
                             </div>
                             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 w-full relative transition-all group-hover:bg-white group-hover:shadow-sm">
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{faq.answer}</p>
                                <div className="absolute -top-3 -left-2 bg-white text-slate-300 rounded-full p-1 border border-slate-100 shadow-sm">
                                   <MessageCircle size={14} fill="currentColor" className="opacity-50" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right align-top pt-8">
                    <div className="flex flex-col items-end gap-3">
                       <div className={clsx("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-2", faq.isVisible ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-100 text-slate-400 border-slate-200")}>
                          {faq.isVisible ? 'Published' : 'Draft / Hidden'}
                       </div>
                       
                       <div className="flex items-center gap-1 bg-white border border-slate-100 p-1.5 rounded-xl shadow-sm">
                          <button 
                            onClick={() => openEditModal(faq)} 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <div className="w-px h-6 bg-slate-100"></div>
                          <button 
                            onClick={() => handleToggle(faq.id, faq.isVisible)} 
                            className={clsx(
                              "p-2 rounded-lg transition-all",
                              faq.isVisible ? "text-slate-400 hover:text-orange-500 hover:bg-orange-50" : "text-orange-500 bg-orange-50 hover:bg-orange-100"
                            )}
                            title={faq.isVisible ? "Hide" : "Show"}
                          >
                            {faq.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <div className="w-px h-6 bg-slate-100"></div>
                          <button 
                            onClick={() => setDeleteId(faq.id)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic border-2 border-dashed border-slate-100 m-8 rounded-[2rem]">
                    No FAQs found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
