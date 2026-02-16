
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  requestSupportAccess, 
  sendMessage, 
  subscribeToRoomMessages, 
  subscribeToAllSupportRooms, 
  subscribeToAllIncomingMessages, 
  markMessagesAsRead,
  getUsers,
  getAppPermissions
} from '../services/api';
import { Card, Button, Input, Badge, Toast, useToast } from '../components/UI';
import { LifeBuoy, Lock, BookOpen, MessageSquare, PhoneCall, HelpCircle, CheckCircle, Send, ArrowLeft, Search, User as UserIcon, AlertCircle, ArrowRight, ShieldAlert, Paperclip, Smile, MoreHorizontal, MessageCircle, X } from 'lucide-react';
import { ChatMessage, UserRole, User, AppPermissions } from '../types';
import clsx from 'clsx';

const { useNavigate } = ReactRouterDOM;

const EMOJIS = ['❤️', '🩸', '🙏', '😊', '👍', '💪', '🏥', '🚑', '💉', '🙌', '✨', '🔥', '🤝', '👋', '🌟', '💝'];

export const SupportCenter = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  
  const [activeView, setActiveView] = useState<'hub' | 'system-list' | 'system-chat' | 'user-list' | 'private-chat'>('hub');
  
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [supportRooms, setSupportRooms] = useState<Record<string, { user: User, lastMsg: string, timestamp: string, unread: number }>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAppPermissions().then(setPerms);
    if (user) {
      // Only fetch users if access is granted to avoid permission errors if rules are strict
      if (user.hasSupportAccess || user.role !== UserRole.USER) {
        getUsers().then(users => {
          setAllUsers(users);
        }).catch(() => {});
      }
      
      const unsubscribeUnread = subscribeToAllIncomingMessages(user.id, (msgs) => {
        const counts: Record<string, number> = {};
        msgs.forEach(m => {
          const key = m.roomId.startsWith('SUPPORT_') ? (user.role === UserRole.USER ? 'SYSTEM' : m.senderId) : m.senderId;
          counts[key] = (counts[key] || 0) + 1;
        });
        setUnreadCounts(counts);
      }, (err) => {
        console.debug("Unread incoming subscription restricted:", err.message);
      });
      
      return () => unsubscribeUnread();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN) {
      const unsubscribeRooms = subscribeToAllSupportRooms((msgs) => {
        // Fix: Explicitly type the temporary rooms record to avoid 'unknown' errors
        const rooms: Record<string, { user: User, lastMsg: string, timestamp: string, unread: number }> = {};
        msgs.forEach(m => {
          if (m.roomId.startsWith('SUPPORT_')) {
            const userId = m.roomId.replace('SUPPORT_', '');
            const targetUser = allUsers.find(u => u.id === userId);
            if (targetUser) {
              // Fix: Added null checks and typed access for timestamp comparison
              if (!rooms[userId] || m.timestamp > rooms[userId].timestamp) {
                rooms[userId] = {
                  user: targetUser,
                  lastMsg: m.text,
                  timestamp: m.timestamp,
                  unread: 0
                };
              }
            }
          }
        });
        setSupportRooms(prev => {
          // Fix: Correctly update state with new rooms while preserving unread counts
          Object.keys(rooms).forEach(id => {
            if (prev[id]) rooms[id].unread = prev[id].unread;
          });
          return rooms;
        });
      }, (err) => {
        console.debug("Support rooms subscription restricted:", err.message);
      });
      return () => unsubscribeRooms();
    }
  }, [allUsers, user]);

  useEffect(() => {
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.EDITOR || user.role === UserRole.SUPERADMIN)) {
      const unsubscribeUnreads = subscribeToAllIncomingMessages(user.id, (unreads) => {
        setSupportRooms(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(uid => {
            // Fix: Cast updated[uid] or use any to allow spreading when inferred as unknown
            const existing = updated[uid];
            if (existing) {
              updated[uid] = {
                ...existing,
                unread: unreads.filter(m => m.senderId === uid && m.roomId.startsWith('SUPPORT_')).length
              };
            }
          });
          return updated;
        });
      }, (err) => {
        console.debug("Admin thread counts restricted:", err.message);
      });
      return () => unsubscribeUnreads();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setPermissionError(null);
    let unsubscribe: () => void = () => {};

    const handleError = (err: any) => {
      if (err.code === 'permission-denied') {
        setPermissionError("Access denied by security policy. Verification required.");
      }
    };

    // Helper to determine the correct receiver ID to mark as read based on context
    // If I'm Admin in Support Chat, I read messages sent to 'SYSTEM'.
    // If I'm User in Support Chat, I read messages sent to ME (from Admin).
    // If I'm in Private Chat, I read messages sent to ME.
    const isStaffUser = user.role === UserRole.ADMIN || user.role === UserRole.EDITOR || user.role === UserRole.SUPERADMIN;
    const myReceiverId = (activeView === 'system-chat' && isStaffUser) ? 'SYSTEM' : user.id;

    const attemptMarkRead = (rid: string) => {
       markMessagesAsRead(rid, myReceiverId).catch(() => {});
    };

    if (activeView === 'system-chat') {
      const targetRoomId = user.role === UserRole.USER ? `SUPPORT_${user.id}` : `SUPPORT_${selectedRecipient?.id}`;
      
      unsubscribe = subscribeToRoomMessages(targetRoomId, (msgs) => {
        setMessages(msgs);
        // Real-time check: If there are unread messages for ME while chat is open, mark read immediately
        const hasUnread = msgs.some(m => !m.read && m.receiverId === myReceiverId);
        if (hasUnread) {
           attemptMarkRead(targetRoomId);
        }
      }, handleError);

      // Initial read check on open
      if (selectedRecipient || user.role === UserRole.USER) {
        attemptMarkRead(targetRoomId);
      }

    } else if (activeView === 'private-chat' && selectedRecipient) {
      const roomId = [user.id, selectedRecipient.id].sort().join('_');
      
      unsubscribe = subscribeToRoomMessages(roomId, (msgs) => {
        setMessages(msgs);
        // Real-time check for private chat
        const hasUnread = msgs.some(m => !m.read && m.receiverId === user.id);
        if (hasUnread) {
           attemptMarkRead(roomId);
        }
      }, handleError);

      // Initial read check on open
      attemptMarkRead(roomId);
    }

    return () => unsubscribe();
  }, [activeView, selectedRecipient, user]);

  useEffect(() => {
    if (activeView === 'system-chat' || activeView === 'private-chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeView]);

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await requestSupportAccess(user);
      updateUser({ ...user, supportAccessRequested: true });
      showToast("Access requested successfully.");
    } catch (e) {
      showToast("Request failed.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const hasAccess = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN || user?.hasSupportAccess;

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
        <Toast {...toastState} onClose={hideToast} />
        <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white rounded-[2rem]">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <Lock size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Support Center Locked</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              সাপোর্ট সেন্টার এবং মেসেঞ্জার শুধুমাত্র ভেরিফাইড ইউজারদের জন্য। এ্যাডমিনের সাথে যোগাযোগ করতে এক্সেস রিকোয়েস্ট পাঠান।
            </p>
          </div>
          
          {user?.supportAccessRequested ? (
            <div className="p-6 bg-yellow-50 text-yellow-700 rounded-2xl flex items-center justify-center gap-3 border border-yellow-100 font-black uppercase tracking-widest text-xs">
              <ShieldAlert size={18} /> Request Pending Approval
            </div>
          ) : (
            <Button onClick={handleRequestAccess} isLoading={isRequesting} className="w-full py-5 rounded-2xl text-lg shadow-xl shadow-blue-100 bg-blue-600 hover:bg-blue-700">
              Request Access to Support
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN;

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    let roomId = '';
    let receiverId = '';

    if (activeView === 'system-chat') {
      if (user.role === UserRole.USER) {
        roomId = `SUPPORT_${user.id}`;
        receiverId = 'SYSTEM';
      } else if (selectedRecipient) {
        roomId = `SUPPORT_${selectedRecipient.id}`;
        receiverId = selectedRecipient.id;
      }
    } else if (activeView === 'private-chat' && selectedRecipient) {
      roomId = [user.id, selectedRecipient.id].sort().join('_');
      receiverId = selectedRecipient.id;
    }

    const msg = {
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar || '',
      receiverId,
      roomId,
      text: newMessage,
      isAdminReply: isStaff
    };

    try {
      await sendMessage(msg);
      setNewMessage('');
    } catch (e: any) {
      showToast("Message could not be sent.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleBackNavigation = () => {
    if (activeView === 'private-chat') {
      setActiveView('user-list');
      setSelectedRecipient(null);
    } else if (activeView === 'system-chat' && isStaff) {
      setActiveView('system-list');
      setSelectedRecipient(null);
    } else {
      setActiveView('hub');
      setSelectedRecipient(null);
    }
    setPermissionError(null);
  };

  const renderChat = (title: string, icon: any, targetUser?: User) => (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-3 lg:p-4 rounded-3xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 lg:gap-4">
            <button onClick={handleBackNavigation} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors">
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                {targetUser?.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" /> : React.createElement(icon, { size: 24, className: "text-blue-600" })}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm lg:text-lg font-black text-slate-900 tracking-tight leading-none truncate max-w-[120px] lg:max-w-none">{title}</h1>
                <p className="text-[8px] lg:text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Live Connection</p>
              </div>
            </div>
         </div>
         <button className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-300">
            <MoreHorizontal size={20} />
         </button>
      </div>

      <Card className="flex-1 flex flex-col border-0 shadow-2xl overflow-hidden rounded-[2.5rem] bg-white relative">
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
         
         <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar relative z-10">
            {messages.map((msg) => (
              <div key={msg.id} className={clsx("flex flex-col group", msg.senderId === user?.id ? "items-end" : "items-start")}>
                <div className={clsx(
                  "max-w-[85%] lg:max-w-[75%] p-4 rounded-3xl text-sm font-medium shadow-sm transition-all duration-300",
                  msg.senderId === user?.id 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : (msg.isAdminReply ? "bg-red-50 text-red-900 rounded-bl-none border border-red-100" : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200")
                )}>
                  {msg.senderId !== user?.id && (
                    <p className="text-[9px] font-black uppercase opacity-60 mb-1.5 flex items-center gap-1.5">
                      {msg.senderName} {msg.isAdminReply && <Badge color="red" className="text-[7px] py-0 px-1">STAFF</Badge>}
                    </p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 px-2">
                   <span className="text-[8px] lg:text-[9px] text-slate-400 font-bold opacity-60 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
         </div>
         
         <div className="p-4 lg:p-6 bg-white border-t border-slate-100 relative z-20">
           {showEmojiPicker && (
             <div ref={emojiRef} className="absolute bottom-full left-4 lg:left-6 mb-2 p-4 bg-white rounded-3xl shadow-[0_10px_50px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-[100] animate-in slide-in-from-bottom-2 duration-200">
               <div className="grid grid-cols-4 gap-2">
                 {EMOJIS.map(e => (
                   <button key={e} onClick={() => addEmoji(e)} className="w-10 h-10 text-xl flex items-center justify-center hover:bg-slate-50 rounded-xl transition-colors">{e}</button>
                 ))}
               </div>
             </div>
           )}
           <form onSubmit={handleSendMessage} className="flex items-center gap-2 lg:gap-4 bg-slate-50 p-1 lg:p-2 rounded-[2rem] border border-slate-100 shadow-inner">
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={clsx("p-2 lg:p-3 transition-colors", showEmojiPicker ? "text-blue-600" : "text-slate-400 hover:text-blue-600")}><Smile size={22}/></button>
              <button type="button" className="p-2 lg:p-3 text-slate-400 hover:text-blue-600 transition-colors hidden sm:block"><Paperclip size={18}/></button>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-transparent border-0 px-2 py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                disabled={isSending || !!permissionError}
              />
              <button 
                type="submit" 
                disabled={isSending || !newMessage.trim() || !!permissionError}
                className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl"
              >
                <Send size={18} />
              </button>
           </form>
         </div>
      </Card>
    </div>
  );

  if (activeView === 'system-list' && isStaff) {
    // Fix: Cast the room list mapping results to avoid 'unknown' errors in components
    const roomList = (Object.entries(supportRooms) as [string, { user: User, lastMsg: string, timestamp: string, unread: number }][]).sort((a,b) => b[1].timestamp.localeCompare(a[1].timestamp));
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in duration-500">
         <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('hub')} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
              <ArrowLeft size={24} className="text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Support Threads</h1>
              <p className="text-slate-500 font-medium text-sm">Managing user-wise support communications.</p>
            </div>
         </div>
         <Card className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-white rounded-[3rem] border-0 shadow-2xl custom-scrollbar">
            {roomList.length > 0 ? roomList.map(([uid, data]) => (
              <div key={uid} onClick={() => { setSelectedRecipient(data.user); setActiveView('system-chat'); }} className="flex items-center justify-between p-5 bg-slate-50 hover:bg-red-50 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-red-100 group">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center border-2 border-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform relative">
                       {data.user.avatar ? <img src={data.user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-slate-200" size={24} />}
                       {data.unread > 0 && (
                         <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white animate-bounce">
                           {data.unread}
                         </span>
                       )}
                    </div>
                    <div className="min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="font-black text-slate-900 text-lg group-hover:text-red-600 transition-colors">{data.user.name}</p>
                         {data.unread > 0 && <Badge color="green" className="text-[7px] py-0.5 px-1.5">NEW MESSAGE</Badge>}
                       </div>
                       <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] lg:max-w-none">{data.lastMsg}</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black text-slate-300">{new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight size={20} className="text-slate-200 group-hover:text-red-500 transition-colors" />
                 </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 italic">
                 <MessageCircle size={64} className="mb-4 text-slate-200" />
                 <p className="font-bold text-slate-400">No active threads.</p>
              </div>
            )}
         </Card>
      </div>
    );
  }

  if (activeView === 'user-list') {
    const filteredUsers = allUsers.filter(u => 
      u.id !== user?.id && 
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setActiveView('hub')} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                <ArrowLeft size={24} className="text-slate-400" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Messenger</h1>
                <p className="text-slate-500 font-medium text-sm">Direct private messaging with the community.</p>
              </div>
           </div>
           <div className="relative w-full md:w-80 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input 
               type="text" 
               placeholder="Find a lifesaver..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-xl shadow-slate-200/50 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all"
             />
           </div>
        </div>

        <Card className="flex-1 flex flex-col border-0 shadow-2xl overflow-hidden rounded-[3rem] bg-white p-4 lg:p-6">
          <div className="flex-1 overflow-y-auto space-y-3 lg:space-y-4 pr-2 custom-scrollbar">
            {filteredUsers.length > 0 ? filteredUsers.map(u => (
              <div key={u.id} onClick={() => { setSelectedRecipient(u); setActiveView('private-chat'); }} className="flex items-center justify-between p-4 lg:p-5 bg-slate-50 hover:bg-blue-50 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-blue-100 group">
                <div className="flex items-center gap-4 lg:gap-5">
                  <div className="relative">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-[1.5rem] bg-white flex items-center justify-center border-2 border-white shadow-lg overflow-hidden transition-transform">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-200" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-lg flex items-center justify-center text-[8px] font-black border-2 border-white">{u.bloodGroup}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-slate-900 text-base lg:text-lg group-hover:text-blue-600 transition-colors leading-none">{u.name}</p>
                      {unreadCounts[u.id] > 0 && <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg ring-2 ring-white">{unreadCounts[u.id]}</span>}
                    </div>
                    <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">{u.location || 'Donor Hub'}</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 italic">
                 <Search size={48} className="mb-4 text-slate-200" />
                 <p className="font-bold text-slate-400">No members found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (activeView === 'system-chat') {
    return renderChat(
      user?.role === UserRole.USER ? "Staff Support" : (selectedRecipient?.name || "System Support"), 
      MessageSquare, 
      selectedRecipient || undefined
    );
  }

  if (activeView === 'private-chat') {
    return renderChat(
      selectedRecipient?.name || "Messenger", 
      UserIcon, 
      selectedRecipient || undefined
    );
  }

  // Fix: Explicitly cast values to numbers and filter for unreadTotal calculation to avoid arithmetic type errors
  const unreadTotal = (Object.values(unreadCounts) as number[]).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto px-4 lg:px-0">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex items-center gap-4 lg:gap-6 border-b border-slate-100 pb-8">
        <div className="p-4 lg:p-5 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-100"><LifeBuoy size={32} /></div>
        <div>
          <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter">Support Hub</h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium">Safe communication gateway for the community.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
        <div onClick={() => setActiveView('user-list')} className="cursor-pointer group">
          <SupportLinkCard icon={BookOpen} title="Messenger" description="Secure end-to-end chat with heroes." color="blue" badge={unreadTotal - (unreadCounts['SYSTEM'] || 0)} />
        </div>
        {/* Staff Support Card Removed as requested */}
        {isStaff && (
          <div onClick={() => setActiveView('system-list')} className="cursor-pointer group">
            <SupportLinkCard icon={MessageSquare} title="Staff Support" description="Direct line to system administrators." color="green" badge={unreadCounts['SYSTEM'] || 0} />
          </div>
        )}
        <div onClick={() => navigate('/help-center')} className="cursor-pointer group">
          <SupportLinkCard icon={HelpCircle} title="Help Center" description="Submit tickets for general inquiries." color="red" />
        </div>
      </div>

      <Card className="p-8 lg:p-10 border-0 shadow-2xl bg-white rounded-[3rem] overflow-hidden relative">
        <h3 className="font-black text-xl lg:text-2xl mb-8 lg:mb-10 flex items-center gap-4 text-slate-900 relative z-10"><HelpCircle className="text-blue-600" size={32} /> Common Questions</h3>
        <div className="space-y-6 lg:space-y-8 relative z-10">
          <div className="p-5 lg:p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <p className="font-black text-slate-800 mb-2 flex items-center gap-3 text-sm lg:text-base"><CheckCircle size={20} className="text-green-500 flex-shrink-0" /> How do I verify my donation?</p>
            <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed lg:pl-8">Our staff team will review and approve it within 24-48 hours after submission.</p>
          </div>
          <div className="p-5 lg:p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <p className="font-black text-slate-800 mb-2 flex items-center gap-3 text-sm lg:text-base"><CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Is my phone number private?</p>
            <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed lg:pl-8">Contact info is only visible to verified users with administrator permission.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const SupportLinkCard = ({ icon: Icon, title, description, color, badge }: any) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    green: "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
    red: "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white"
  };

  return (
    <Card className="p-6 lg:p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white rounded-[2.5rem] h-full flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className={clsx("w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-colors shadow-sm", colorStyles[color as keyof typeof colorStyles])}>
            <Icon size={28} />
          </div>
          {badge > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg ring-4 ring-white animate-bounce">
              {badge} NEW
            </span>
          )}
        </div>
        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{title}</h3>
        <p className="text-slate-500 font-medium text-sm leading-relaxed">{description}</p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-600 transition-colors">
        <span>Open</span> <ArrowRight size={14} />
      </div>
    </Card>
  );
};
