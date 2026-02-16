
import React, { useEffect, useState } from 'react';
import { getLogs, deleteLogEntry } from '../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal } from '../components/UI';
import { useAuth } from '../AuthContext';
import { AuditLog } from '../types';
import { RotateCcw, User as UserIcon, Trash2, Clock, Activity, ShieldCheck, Filter } from 'lucide-react';
import clsx from 'clsx';

export const AdminSystemLogs = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filtering state
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (err) {
      showToast("Log retrieval failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    setActionLoading(true);
    try {
      await deleteLogEntry(deleteId, user);
      showToast("Log entry archived.");
      setDeleteId(null);
      fetchLogs();
    } catch (e) { showToast("Failed to delete log.", "error"); }
    finally { setActionLoading(false); }
  };

  // Get unique action codes for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();

  // Apply filtering
  const filteredLogs = actionFilter === 'ALL' 
    ? logs 
    : logs.filter(log => log.action === actionFilter);

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-slate-300 uppercase tracking-widest text-xs animate-pulse">Syncing Security Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Archive Log Entry?" 
        message="This entry will be moved to system archives and removed from active logs." 
        isLoading={actionLoading} 
      />
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Activity className="text-red-600" /> Security Audit Logs
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Monitoring global administrative events.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
           {/* Action Filter */}
           <div className="relative group w-full sm:w-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 pointer-events-none transition-colors">
                <Filter size={16} />
              </div>
              <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full sm:w-60 pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-red-500/10 shadow-sm appearance-none cursor-pointer"
              >
                <option value="ALL">All Event Types</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
           </div>

           <Button onClick={fetchLogs} variant="outline" className="w-full sm:w-auto flex items-center gap-3 rounded-[1.25rem] px-8 py-3.5 border-slate-200 shadow-sm hover:bg-white active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest">
             <RotateCcw size={16} className={clsx(loading && "animate-spin")} /> 
             Refresh Feed
           </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-2xl bg-white rounded-[3rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6">Actor</th>
                <th className="px-10 py-6">Action Code</th>
                <th className="px-10 py-6">Event Details</th>
                <th className="px-10 py-6 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-3 text-slate-400 font-bold text-xs">
                      <Clock size={14} className="opacity-50" />
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        {log.userAvatar ? (
                          <img src={log.userAvatar} className="w-full h-full object-cover" alt={log.userName} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserIcon className="p-2 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <span className="font-black text-slate-900">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <Badge color="blue" className="px-3 py-1 ring-4 ring-blue-50/50">{log.action}</Badge>
                  </td>
                  <td className="px-10 py-5 text-slate-600 font-medium max-w-md">{log.details}</td>
                  <td className="px-10 py-5 text-right">
                    <button 
                      onClick={() => setDeleteId(log.id)} 
                      className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm bg-white" 
                      title="Archive Entry"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic opacity-50">No logs matching filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6 pb-20 px-1">
        {filteredLogs.length > 0 ? filteredLogs.map(log => (
          <Card key={log.id} className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem] relative overflow-hidden group active:scale-[0.98] transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
                  {log.userAvatar ? (
                    <img src={log.userAvatar} className="w-full h-full object-cover" alt={log.userName} />
                  ) : (
                    <UserIcon className="text-slate-200" size={24} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 text-lg leading-tight truncate">{log.userName}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock size={12} className="text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <Badge color="blue" className="text-[8px] px-2 py-0.5 ring-4 ring-blue-50/50 uppercase tracking-tighter">{log.action}</Badge>
            </div>

            <div className="bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100 mb-6">
               <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                 "{log.details}"
               </p>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setDeleteId(log.id)} 
                className="flex items-center gap-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm border border-red-100"
              >
                <Trash2 size={16} /> Archive Event
              </button>
            </div>
          </Card>
        )) : (
          <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] bg-white rounded-[3rem] border-2 border-dashed border-slate-100 italic">
            No activity records found
          </div>
        )}
      </div>

      <div className="p-8 bg-blue-50/50 rounded-[3rem] border border-blue-100 flex items-start lg:items-center gap-6">
         <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center shadow-lg text-blue-600 flex-shrink-0">
            <ShieldCheck size={28} />
         </div>
         <div>
            <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Blockchain Security Protocol</p>
            <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
              SECURITY ADVISORY: Audit logs are recorded on an immutable ledger. Filtering allows administrators to perform rapid incident response. Please report any unauthorized access codes to the System Architect immediately.
            </p>
         </div>
      </div>
    </div>
  );
};
