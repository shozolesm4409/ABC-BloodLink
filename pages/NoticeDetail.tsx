import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoticeById } from '../services/api';
import { PublicLayout } from '../components/PublicLayout';
import { Card, Badge, Button } from '../components/UI';
import { Notice } from '../types';
import { Calendar, User as UserIcon, Pin, ArrowLeft, Tag } from 'lucide-react';
import clsx from 'clsx';

export const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getNoticeById(id).then((data) => {
        setNotice(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Notice...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!notice) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Notice Not Found</h2>
          <p className="text-slate-500 font-medium mb-6">The notice you are looking for may have been removed or archived.</p>
          <Button onClick={() => navigate('/public-notices')} variant="outline" className="rounded-xl">
            <ArrowLeft size={18} className="mr-2" /> Back to Notices
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="py-12 px-6 lg:py-20 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
          <button 
            onClick={() => navigate('/public-notices')} 
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-colors mb-8 text-sm"
          >
            <ArrowLeft size={18} /> Back to Board
          </button>

          <Card className="p-8 lg:p-12 border-0 shadow-2xl bg-white rounded-[2.5rem] relative overflow-hidden">
            {notice.pinned && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-white px-8 py-3 rounded-bl-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <Pin size={16} className="fill-current" /> Pinned
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                {notice.authorAvatar ? (
                  <img src={notice.authorAvatar} className="w-full h-full object-cover" alt={notice.authorName} />
                ) : (
                  <UserIcon className="p-3 text-slate-300 w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-tight mb-1">{notice.authorName}</p>
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {new Date(notice.timestamp).toLocaleDateString([], { dateStyle: 'long' })}
                    </span>
                  </div>
                  <Badge color="blue" className="text-[8px] py-0 px-2 uppercase tracking-tight">REF-{notice.id.substring(0,5)}</Badge>
                </div>
              </div>
            </div>

            <h1 className="text-2xl lg:text-4xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
              {notice.subject}
            </h1>

            <div className="prose prose-lg prose-slate max-w-none font-medium leading-relaxed text-slate-600">
               <div dangerouslySetInnerHTML={{ __html: notice.details }} />
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-2 text-slate-400">
                  <Tag size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Official Announcement</span>
               </div>
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                 {new Date(notice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};