import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { PublicLayout } from '../components/PublicLayout';
import { Layout } from '../components/Layout';
import { Card, Input, Button, useToast, Toast, Badge } from '../components/UI';
import { HelpCircle, CheckCircle2, RotateCcw, Send, ArrowLeft, Search, Clock, MessageCircle, AlertCircle } from 'lucide-react';
import { submitHelpRequest, getUserHelpRequests, getHelpRequestsByPhone } from '../services/api';
import { HelpRequest, HelpStatus } from '../types';
import clsx from 'clsx';

export const HelpCenter = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'search'>('new');
  
  // History State
  const [history, setHistory] = useState<HelpRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Search State
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<HelpRequest[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'history' && user) {
      setHistoryLoading(true);
      getUserHelpRequests(user.id).then(data => {
        setHistory(data);
        setHistoryLoading(false);
      });
    }
  }, [isAuthenticated, activeTab, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
      userId: user?.id
    };

    try {
      await submitHelpRequest(data);
      setSubmitted(true);
    } catch (err) {
      showToast("Submission failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;
    setSearchLoading(true);
    try {
      const results = await getHelpRequestsByPhone(searchPhone.trim());
      setSearchResults(results);
      if (results.length === 0) {
        showToast("No records found.", "info");
      }
    } catch (e) {
      showToast("Search failed.", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  const RequestList = ({ requests, emptyMsg }: { requests: HelpRequest[], emptyMsg: string }) => (
    <div className="space-y-4">
      {requests.length > 0 ? requests.map(req => (
        <div key={req.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Clock size={12} />
              {new Date(req.timestamp).toLocaleDateString()}
            </div>
            <Badge color={req.status === HelpStatus.COMPLETE ? 'green' : (req.status === HelpStatus.REJECTED ? 'red' : 'yellow')}>
              {req.status}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-3">"{req.message}"</p>
          {req.remark && (
            <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 items-start">
              <MessageCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Admin Response</p>
                <p className="text-xs text-slate-600 leading-relaxed">{req.remark}</p>
              </div>
            </div>
          )}
        </div>
      )) : (
        <div className="text-center py-12 text-slate-400 font-bold italic border-2 border-dashed border-slate-100 rounded-3xl">
          {emptyMsg}
        </div>
      )}
    </div>
  );

  const content = (
    <div className={clsx("flex flex-col items-center", isAuthenticated ? "py-4" : "py-12 px-6 lg:py-20")}>
      <Toast {...toastState} onClose={hideToast} />
      
      {isAuthenticated && (
        <div className="w-full max-w-2xl mb-6 flex justify-between items-center">
            <button onClick={() => navigate('/support')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-colors text-sm">
                <ArrowLeft size={18} /> Back to Support
            </button>
        </div>
      )}

      <Card className="max-w-2xl w-full p-8 lg:p-12 border-0 shadow-2xl bg-white rounded-[2.5rem] relative overflow-hidden">
        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Help Center</h1>
          <p className="text-slate-500 font-medium mt-2">আপনার জিজ্ঞাসা বা সমস্যার সমাধান এখানে।</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('new')} 
            className={clsx("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'new' ? "bg-white shadow text-red-600" : "text-slate-500")}
          >
            New Request
          </button>
          {!isAuthenticated && (
            <button 
              onClick={() => setActiveTab('search')} 
              className={clsx("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'search' ? "bg-white shadow text-red-600" : "text-slate-500")}
            >
              Check Status
            </button>
          )}
          {isAuthenticated && (
            <button 
              onClick={() => setActiveTab('history')} 
              className={clsx("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'history' ? "bg-white shadow text-red-600" : "text-slate-500")}
            >
              My History
            </button>
          )}
        </div>

        {activeTab === 'new' && (
          submitted ? (
            <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-green-50">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Success!</h2>
              <p className="text-slate-500 font-bold mb-8">Your message has been sent successfully.</p>
              <Button onClick={handleReset} variant="outline" className="w-full py-4 rounded-xl gap-2">
                <RotateCcw size={18} /> Send Message Again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4">
              <Input 
                label="Full Name" 
                name="name" 
                placeholder="Enter your name" 
                defaultValue={user?.name || ''} 
                required 
              />
              <Input 
                label="Phone Number" 
                name="phone" 
                placeholder="Enter phone number" 
                defaultValue={user?.phone || ''} 
                required 
              />
              
              <div className="w-full">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Your Message</label>
                <textarea 
                  name="message" 
                  placeholder="Describe your issue or question..." 
                  required 
                  rows={5} 
                  className="w-full px-4 py-3.5 border border-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-slate-50 font-medium placeholder:text-slate-300 resize-none"
                />
              </div>

              <Button type="submit" isLoading={loading} className="w-full py-4 rounded-xl text-base shadow-xl shadow-red-100">
                <Send size={18} className="mr-2" /> Submit Request
              </Button>
            </form>
          )
        )}

        {activeTab === 'search' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <form onSubmit={handleSearch} className="relative">
               <Input 
                 placeholder="Enter phone number to search..." 
                 value={searchPhone}
                 onChange={(e) => setSearchPhone(e.target.value)}
                 className="pl-12 py-4 rounded-2xl border-2 border-slate-100 focus:border-red-100"
               />
               <Search className="absolute left-4 top-4 text-slate-300" size={20} />
               <Button type="submit" isLoading={searchLoading} className="w-full mt-4 py-4 rounded-xl">Check Status</Button>
            </form>

            {searchResults && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Search Results</h3>
                <RequestList requests={searchResults} emptyMsg="No requests found for this number." />
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {historyLoading ? (
              <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse">Loading History...</div>
            ) : (
              <RequestList requests={history} emptyMsg="You haven't submitted any requests yet." />
            )}
          </div>
        )}

      </Card>
    </div>
  );

  return isAuthenticated ? (
    <Layout>{content}</Layout>
  ) : (
    <PublicLayout>{content}</PublicLayout>
  );
};