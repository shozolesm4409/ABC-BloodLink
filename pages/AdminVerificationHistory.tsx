
import React, { useEffect, useState } from 'react';
import { getVerificationLogs } from '../services/api';
import { Card, Badge, Button } from '../components/UI';
import { ClipboardList, RotateCcw, Clock, User as UserIcon, ShieldCheck, Droplet, User } from 'lucide-react';
import { BloodGroup } from '../types';

export const AdminVerificationHistory = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getVerificationLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Calculate Blood Group Stats
  const groupCounts = logs.reduce((acc, log) => {
    const bg = log.bloodGroup || 'Unknown';
    acc[bg] = (acc[bg] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return (
    <div className="p-10 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.2em]">
      Retrieving History...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-100">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Verification History</h1>
            <p className="text-slate-500 font-medium">Log of public identity searches and authenticity checks.</p>
          </div>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2 rounded-xl">
          <RotateCcw size={18} /> Refresh Log
        </Button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.values(BloodGroup).map((bg) => (
          <div key={bg} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
             <span className="text-red-600 font-black text-lg">{bg}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{groupCounts[bg] || 0} Checks</span>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="p-1.5 px-6">Timestamp</th>
                <th className="p-1.5 px-6">Member Searched</th>
                <th className="p-1.5 px-6">Blood Group</th>
                <th className="p-1.5 px-6 text-right">System ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-1.5 px-6">
                    <div className="flex items-center gap-3 text-slate-400 font-bold">
                      <Clock size={14} />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-1.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100 shadow-sm">
                        <UserIcon size={14} className="text-slate-300" />
                      </div>
                      <span className="font-black text-slate-900 text-sm">{log.memberName}</span>
                    </div>
                  </td>
                  <td className="p-1.5 px-6">
                    <div className="flex items-center gap-2 text-red-600 font-black">
                       <Droplet size={14} className="fill-current" />
                       {log.bloodGroup}
                    </div>
                  </td>
                  <td className="p-1.5 px-6 text-right font-mono text-xs text-slate-400 font-bold">
                    {log.memberId}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-50">
                    No verification records found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {logs.length > 0 ? logs.map(log => (
          <Card key={log.id} className="p-5 border-0 shadow-sm bg-white rounded-[2rem] flex flex-col gap-4 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shadow-inner">
                      <UserIcon size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{log.memberName}</p>
                      <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">{log.memberId}</p>
                   </div>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100">
                   <Droplet size={14} className="fill-current" />
                   <span className="text-[10px] font-black">{log.bloodGroup}</span>
                </div>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-3 rounded-xl">
                <Clock size={12} />
                <span>Checked on {new Date(log.timestamp).toLocaleString()}</span>
             </div>
          </Card>
        )) : (
          <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
             No verification records found.
          </div>
        )}
      </div>
      
      <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center gap-4">
         <ShieldCheck size={24} className="text-blue-600" />
         <p className="text-xs font-medium text-blue-700 leading-relaxed">
           This menu stores tracking data from the public verification page. It helps monitors understand how often and which donor identities are being validated by external parties.
         </p>
      </div>
    </div>
  );
};
