
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { addNotice, updateNotice, subscribeToNotices, deleteNotice, getUsers, getAppPermissions, ADMIN_EMAIL } from '../services/api';
import { Card, Button, Input, Badge, Toast, useToast, ConfirmModal } from '../components/UI';
import { Megaphone, Plus, Trash2, Edit2, Clock, User as UserIcon, Type, Palette, UserPlus, X, Send, Search, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify, ShieldCheck, Newspaper, Bell, Sparkles, MoreVertical, Pin, ListFilter, LayoutGrid, Type as FontIcon, Baseline, ChevronDown, Globe } from 'lucide-react';
import { Notice, User, UserRole, AppPermissions, NoticeType } from '../types';
import clsx from 'clsx';

const { Link } = ReactRouterDOM;

export const MyNotice = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [deleteNoticeId, setDeleteNoticeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PUBLIC' | 'PRIVATE' | 'WEB'>('PUBLIC');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const editorRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>(NoticeType.PUBLIC);
  const [isPinned, setIsPinned] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    getAppPermissions().then(setPerms);
    const unsubscribe = subscribeToNotices((data) => {
      setNotices(data);
      setLoading(false);
    }, (err) => {
      console.error("Notice sync error:", err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN || user?.email.trim().toLowerCase() === ADMIN_EMAIL;
  
  // Effective Permission Check
  const canPost = (() => {
    if (!user) return false;
    // 1. Check specific override
    if (user.permissions?.rules?.canPostNotice !== undefined) return user.permissions.rules.canPostNotice;
    // 2. Super Admins always can
    if (user.role === UserRole.SUPERADMIN) return true;
    // 3. Fallback to Role Global Permission
    const roleKey = user.role.toLowerCase() as keyof AppPermissions;
    return perms?.[roleKey]?.rules?.canPostNotice ?? isStaff;
  })();

  // Filter notices based on role and tab
  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.subject.toLowerCase().includes(searchQuery.toLowerCase());
    // Filter strictly by active tab type
    if (activeTab === 'WEB') {
        return matchesSearch && n.type === NoticeType.WEB;
    }
    if (activeTab === 'PRIVATE') {
        return matchesSearch && n.type === NoticeType.PRIVATE && isStaff;
    }
    // Default to PUBLIC
    return matchesSearch && n.type === NoticeType.PUBLIC;
  }).sort((a, b) => {
    // Pinned notices first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const applyStyle = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !editorRef.current?.innerHTML.trim()) {
      showToast("Subject and details required.", "warning");
      return;
    }

    setIsPosting(true);
    const details = editorRef.current.innerHTML;

    try {
      if (editModeId) {
        await updateNotice(editModeId, { subject, details, type: noticeType, pinned: isPinned }, user);
        showToast("Notice updated.");
      } else {
        await addNotice({ 
          subject, 
          details, 
          authorId: user.id, 
          authorName: user.name, 
          authorAvatar: user.avatar || '', 
          timestamp: new Date().toISOString(), 
          type: noticeType,
          pinned: isPinned
        }, user);
        showToast("Notice published.");
      }
      resetEditor();
      setShowCreate(false);
    } catch (e) {
      showToast("Operation failed.", "error");
    } finally {
      setIsPosting(false);
    }
  };

  const startEdit = (notice: Notice) => {
    setEditModeId(notice.id);
    setSubject(notice.subject);
    setNoticeType(notice.type);
    setIsPinned(!!notice.pinned);
    setShowCreate(true);
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = notice.details; }, 50);
  };

  const resetEditor = () => {
    setEditModeId(null);
    setSubject('');
    setNoticeType(NoticeType.PUBLIC);
    setIsPinned(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const confirmDelete = async () => {
    if (!user || !deleteNoticeId) return;
    try {
      await deleteNotice(deleteNoticeId, user);
      showToast("Notice archived.");
      setDeleteNoticeId(null);
    } catch (e) { showToast("Action failed.", "error"); }
  };

  const TabButton = ({ type, label }: { type: string, label: string }) => (
    <button 
      onClick={() => setActiveTab(type as any)} 
      className={clsx(
        "pb-2 text-sm font-bold transition-all px-1",
        activeTab === type ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {label}
    </button>
  );

  const publicCount = notices.filter(n => n.type === 'PUBLIC').length;
  const webCount = notices.filter(n => n.type === 'WEB').length;
  const privateCount = notices.filter(n => n.type === 'PRIVATE').length;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteNoticeId} onClose={() => setDeleteNoticeId(null)} onConfirm={confirmDelete} title="Delete Note?" message="This note will be moved to system archives." />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pt-4">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
             Official Board
           </h1>
           <div className="flex items-center gap-6 mt-4 border-b border-slate-200">
              <TabButton type="PUBLIC" label={`Public (${publicCount})`} />
              <TabButton type="WEB" label={`Web Notice (${webCount})`} />
              {isStaff && <TabButton type="PRIVATE" label={`Private (${privateCount})`} />}
           </div>
        </div>

        {canPost && (
          <Button 
            onClick={() => setShowCreate(true)} 
            className="rounded-xl px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-xs shadow-md border-0"
          >
            <Plus size={18} className="mr-2" /> Post Notice
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 bg-white/50 p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 group w-full">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
           <input 
             type="text" 
             placeholder="Search notes..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full pl-12 pr-4 py-2.5 bg-transparent border-0 text-sm font-medium outline-none focus:ring-0"
           />
        </div>
        <button 
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"
        >
          <ListFilter size={14} /> Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 opacity-20">
           <LayoutGrid className="animate-pulse mb-4" size={48} />
           <p className="font-black uppercase text-xs tracking-widest">Syncing Nodes...</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotices.map(n => (
              <NoteCard key={n.id} note={n} onEdit={startEdit} onDelete={(id) => setDeleteNoticeId(id)} isStaff={canPost} />
            ))}
            {filteredNotices.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                <Newspaper size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold italic text-sm">No notices found in this category.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <Card className="w-full max-w-3xl bg-white border-0 shadow-2xl rounded-[1.5rem] overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-600">{editModeId ? 'Refine Note' : 'New Note'}</h2>
                 <button onClick={() => { setShowCreate(false); resetEditor(); }} className="absolute right-4 p-2 hover:bg-slate-200 rounded-xl transition-all"><X size={18}/></button>
              </div>
              <form onSubmit={handlePostNotice} className="p-6 space-y-6">
                 {/* Mobile Layout: Title in one row, Controls in another. Web Layout: Flex row side-by-side */}
                 <div className="flex flex-col lg:flex-row items-start gap-4">
                    <textarea 
                      placeholder="Title of announcement..." 
                      value={subject} 
                      onChange={e => setSubject(e.target.value)} 
                      required 
                      rows={2}
                      className="w-full lg:flex-1 bg-transparent border-0 border-b-2 border-slate-100 rounded-none px-0 shadow-none text-lg font-bold placeholder:text-slate-300 focus:border-blue-500 outline-none resize-none custom-scrollbar py-2" 
                    />
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <select 
                        value={noticeType} 
                        onChange={e => setNoticeType(e.target.value as NoticeType)}
                        className="flex-1 lg:flex-none bg-slate-100 border-0 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                      >
                         <option value={NoticeType.PUBLIC}>Public</option>
                         <option value={NoticeType.PRIVATE}>Private</option>
                         {isStaff && <option value={NoticeType.WEB}>Web Notice</option>}
                      </select>
                      <label className="flex-1 lg:flex-none flex items-center justify-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all border border-slate-200">
                        <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Pin</span>
                        <Pin size={14} className={clsx(isPinned ? "text-blue-600 fill-blue-600" : "text-slate-400")} />
                      </label>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                        <ToolbarButton label="B" onClick={() => applyStyle('bold')} className="font-bold" />
                        <ToolbarButton label="I" onClick={() => applyStyle('italic')} className="italic" />
                        <ToolbarButton label="U" onClick={() => applyStyle('underline')} className="underline" />
                        
                        <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>
                        
                        <div className="relative group">
                          <ToolbarButton icon={Baseline} title="Text Color" />
                          <input type="color" onChange={(e) => applyStyle('foreColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                        <div className="relative group">
                          <ToolbarButton icon={Highlighter} title="Highlight Color" />
                          <input type="color" onChange={(e) => applyStyle('hiliteColor', e.target.value)} defaultValue="#FFFF00" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>

                        <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

                        <ToolbarButton icon={AlignLeft} onClick={() => applyStyle('justifyLeft')} />
                        <ToolbarButton icon={AlignCenter} onClick={() => applyStyle('justifyCenter')} />
                        <ToolbarButton icon={AlignRight} onClick={() => applyStyle('justifyRight')} />
                        <ToolbarButton icon={AlignJustify} onClick={() => applyStyle('justifyFull')} />

                        <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

                        <div className="relative group flex items-center px-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200">
                          <FontIcon size={14} className="text-slate-500 mr-2" />
                          <select 
                            onChange={(e) => applyStyle('fontSize', e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer py-1"
                          >
                            <option value="1">Small</option>
                            <option value="3" selected>Normal</option>
                            <option value="5">Large</option>
                            <option value="7">Huge</option>
                          </select>
                        </div>
                    </div>
                    <div 
                      ref={editorRef} 
                      contentEditable 
                      className="min-h-[300px] max-h-[300px] p-6 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 custom-scrollbar overflow-y-auto text-sm leading-relaxed"
                    />
                 </div>

                 <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button type="submit" isLoading={isPosting} className="rounded-xl px-10 py-3.5 bg-blue-600 hover:bg-blue-700 shadow-xl text-sm">
                       {editModeId ? 'Update Notice' : 'Post Notice'}
                    </Button>
                 </div>
              </form>
           </Card>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .note-preview-content * { margin: 0 !important; font-size: inherit !important; line-height: inherit !important; }
        .note-preview-content { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
      `}} />
    </div>
  );
};

interface NoteCardProps {
  note: Notice;
  onEdit: (n: Notice) => void;
  onDelete: (id: string) => void;
  isStaff: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete, isStaff }) => (
  <Card className={clsx(
    "p-6 border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-2xl group flex flex-col justify-between border-t-2 relative",
    note.pinned ? "border-blue-600 shadow-blue-50" : "border-transparent hover:border-blue-500"
  )}>
     {note.pinned && (
       <div className="absolute top-4 right-4 text-blue-600 bg-blue-50 p-1.5 rounded-lg shadow-sm">
         <Pin size={14} className="fill-current" />
       </div>
     )}
     <div>
        <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-100 flex-shrink-0">
                 {note.authorAvatar ? <img src={note.authorAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2 text-slate-300 w-full h-full" />}
              </div>
              <div>
                 <p className="text-[11px] font-black text-slate-900 leading-none">{note.authorName}</p>
                 <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                   {new Date(note.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
           </div>
           
           {isStaff && (
             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-14">
                <button onClick={() => onEdit(note)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Edit2 size={16}/></button>
                <button onClick={() => onDelete(note.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
             </div>
           )}
        </div>

        <h4 className="text-[15px] font-black text-slate-800 mb-3 tracking-tight line-clamp-2 leading-snug">
           {note.subject}
        </h4>
        <div 
          className="text-sm text-slate-500 leading-relaxed note-preview-content h-20" 
          dangerouslySetInnerHTML={{ __html: note.details }} 
        />
     </div>

     <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge color={note.type === 'PUBLIC' ? 'green' : (note.type === 'WEB' ? 'purple' : 'blue')} className="text-[8px] py-0.5 px-2 rounded-md">
             {note.type === 'WEB' ? 'WEB NOTICE' : note.type}
          </Badge>
          {note.pinned && <Badge color="yellow" className="text-[8px] py-0.5 px-2 rounded-md">PINNED</Badge>}
        </div>
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">REF-{note.id.substring(0, 5)}</span>
     </div>
  </Card>
);

const ToolbarButton = ({ icon: Icon, label, onClick, className, title }: any) => (
  <button 
    type="button" 
    onClick={onClick}
    title={title}
    className={clsx(
      "w-9 h-9 flex items-center justify-center hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-600 active:scale-90",
      className
    )}
  >
    {Icon ? <Icon size={16} /> : <span className="text-xs font-black">{label}</span>}
  </button>
);
