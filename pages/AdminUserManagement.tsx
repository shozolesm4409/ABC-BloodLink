
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  getUsers, 
  deleteUserRecord, 
  updateUserProfile, 
  adminForceChangePassword, 
  handleDirectoryAccess,
  handleSupportAccess,
  handleFeedbackAccess,
  handleIDCardAccess,
  toggleUserSuspension,
  getDonations,
  generateUserId,
  ADMIN_EMAIL
} from '../services/api';
import { Card, Badge, Button, Input, Toast, useToast, ConfirmModal, Select } from '../components/UI';
import { User, UserRole, BloodGroup, DonationStatus } from '../types';
import { Search, User as UserIcon, Trash2, Key, Layout, Shield, ShieldCheck, UserCheck, MessageSquare, LifeBuoy, X, Edit2, Ban, IdCard, MoreVertical, Phone, MapPin, Star, Trophy, Medal, Award, Wand2, Settings, Fingerprint, Edit, Filter } from 'lucide-react';
import { getRankData } from './Profile';
import clsx from 'clsx';

const { useNavigate } = ReactRouterDOM;

const AccessHub = ({ users, onAction, searchQuery, accessType, accessStatus }: { 
  users: User[], 
  onAction: (uid: string, type: 'directory' | 'support' | 'feedback' | 'idcard', approve: boolean) => void,
  searchQuery: string,
  accessType: string,
  accessStatus: string
}) => {
  
  // Filter Logic for Access Hub
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // If "ALL Types" is selected, just return based on search
    if (accessType === 'ALL') return true;

    // Specific access check
    let hasAccess = false;
    let isRequested = false;

    if (accessType === 'directory') {
      hasAccess = !!u.hasDirectoryAccess;
      isRequested = !!u.directoryAccessRequested;
    } else if (accessType === 'support') {
      hasAccess = !!u.hasSupportAccess;
      isRequested = !!u.supportAccessRequested;
    } else if (accessType === 'feedback') {
      hasAccess = !!u.hasFeedbackAccess;
      isRequested = !!u.feedbackAccessRequested;
    } else if (accessType === 'idcard') {
      hasAccess = !!u.hasIDCardAccess;
      isRequested = !!u.idCardAccessRequested;
    }

    if (accessStatus === 'ALL') return true;
    if (accessStatus === 'REQUESTED') return isRequested;
    if (accessStatus === 'ACTIVE') return hasAccess;
    if (accessStatus === 'REVOKED') return !hasAccess && !isRequested;

    return true;
  });

  const AccessItem = ({ title, requested, has, type, uid, icon: Icon, color }: any) => {
    // If a specific type is selected for filtering, hide non-relevant items within the card
    if (accessType !== 'ALL' && accessType !== type) return null;

    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-red-100 transition-all">
        <div className="flex items-center gap-3">
          <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center", has ? color : "bg-slate-100 text-slate-400")}>
            <Icon size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5">{title}</p>
            <div className="flex items-center gap-2">
              {has ? (
                <Badge color="green" className="text-[8px] py-0 px-1.5">Active</Badge>
              ) : requested ? (
                <Badge color="yellow" className="text-[8px] py-0 px-1.5">Requested</Badge>
              ) : (
                <Badge color="gray" className="text-[8px] py-0 px-1.5">No Access</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {requested ? (
            <>
              <button onClick={() => onAction(uid, type, true)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><UserCheck size={14}/></button>
              <button onClick={() => onAction(uid, type, false)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><X size={14}/></button>
            </>
          ) : (
            <button 
              onClick={() => onAction(uid, type, !has)}
              className={clsx("text-[9px] font-black px-3 py-1.5 rounded-lg transition-all border uppercase tracking-widest", has ? "text-red-600 border-red-100 bg-red-50 hover:bg-red-600 hover:text-white" : "text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white")}
            >
              {has ? 'Revoke' : 'Grant'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {filteredUsers.length > 0 ? filteredUsers.map(u => (
        <Card key={u.id} className="p-6 border-0 shadow-lg bg-white rounded-[2rem] overflow-hidden group">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-white shadow-md overflow-hidden flex items-center justify-center font-black text-slate-400">
                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
              </div>
              <div className={clsx("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm", u.role === UserRole.SUPERADMIN ? "bg-purple-600" : (u.role === UserRole.ADMIN ? "bg-red-500" : (u.role === UserRole.EDITOR ? "bg-blue-500" : "bg-green-500")))}></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 truncate tracking-tight mb-0.5">{u.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.email}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <AccessItem title="Directory Access" requested={u.directoryAccessRequested} has={u.hasDirectoryAccess} type="directory" uid={u.id} icon={Search} color="bg-red-50 text-red-600" />
            <AccessItem title="Support Access" requested={u.supportAccessRequested} has={u.hasSupportAccess} type="support" uid={u.id} icon={LifeBuoy} color="bg-blue-50 text-blue-600" />
            <AccessItem title="Feedback Access" requested={u.feedbackAccessRequested} has={u.hasFeedbackAccess} type="feedback" uid={u.id} icon={MessageSquare} color="bg-green-50 text-green-600" />
            <AccessItem title="ID Card Access" requested={u.idCardAccessRequested} has={u.hasIDCardAccess} type="idcard" uid={u.id} icon={IdCard} color="bg-orange-50 text-orange-600" />
          </div>
        </Card>
      )) : (
        <div className="col-span-full py-20 text-center opacity-40">
           <Search size={48} className="mx-auto mb-4 text-slate-300" />
           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No users found matching access criteria</p>
        </div>
      )}
    </div>
  );
};

export const AdminUserManagement = () => {
  const { user: admin } = useAuth();
  const navigate = useNavigate();
  const { toastState, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [userRankMap, setUserRankMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'users' | 'access-hub'>('users');
  
  // Access Hub Filter States
  const [accessSearch, setAccessSearch] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('ALL');
  const [accessStatusFilter, setAccessStatusFilter] = useState('ALL');
  
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<{id: string, current: boolean} | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([getUsers(), getDonations()]);
      
      // Calculate rank map
      const map: Record<string, number> = {};
      d.filter(record => record.status === DonationStatus.COMPLETED).forEach(rec => {
        map[rec.userId] = (map[rec.userId] || 0) + 1;
      });
      
      setUserRankMap(map);
      setUsers(u);
    } catch (e) { showToast("Failed to fetch data", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const isSuperAdminViewer = admin?.role === UserRole.SUPERADMIN || admin?.email.trim().toLowerCase() === ADMIN_EMAIL;

  const handleDelete = async () => {
    if (!admin || !deleteUserId) return;
    setActionLoading(true);
    try {
      await deleteUserRecord(deleteUserId, admin);
      showToast("User account archived.");
      setDeleteUserId(null);
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleSuspendToggle = async () => {
    if (!admin || !suspendUserId) return;
    setActionLoading(true);
    try {
      await toggleUserSuspension(suspendUserId.id, !suspendUserId.current, admin);
      showToast(`User ${!suspendUserId.current ? 'suspended' : 'reinstated'}.`);
      setSuspendUserId(null);
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!admin) return;
    if (newRole === UserRole.SUPERADMIN && !isSuperAdminViewer) {
      showToast("Only a SuperAdmin can assign this role.", "error");
      return;
    }
    try {
      await updateUserProfile(userId, { role: newRole }, admin);
      showToast("Role updated.");
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
  };

  const handleAccessAction = async (uid: string, type: 'directory' | 'support' | 'feedback' | 'idcard', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(uid, approve, admin);
      else if (type === 'support') await handleSupportAccess(uid, approve, admin);
      else if (type === 'feedback') await handleFeedbackAccess(uid, approve, admin);
      else if (type === 'idcard') await handleIDCardAccess(uid, approve, admin);
      showToast("Access updated.");
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
  };

  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !editUser) return;
    setActionLoading(true);
    try {
      await updateUserProfile(editUser.id, {
        name: editUser.name,
        phone: editUser.phone,
        location: editUser.location,
        bloodGroup: editUser.bloodGroup
      }, admin);
      showToast("User details updated.");
      setEditUser(null);
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleForcePassword = async () => {
    if (!admin || !pwdUser || !newPassword) return;
    setActionLoading(true);
    try {
      await adminForceChangePassword(pwdUser.id, newPassword, admin);
      showToast("Password reset triggered.");
      setPwdUser(null);
      setNewPassword('');
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleGenerateId = async (userId: string) => {
    if (!admin) return;
    try {
      await generateUserId(userId, admin);
      showToast("New BL ID generated.");
      fetchData();
    } catch (e) {
      showToast("ID Generation failed.", "error");
    }
  };

  // User List filtering
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const superAdminsCount = users.filter(u => u.role === UserRole.SUPERADMIN).length;
  const adminsCount = users.filter(u => u.role === UserRole.ADMIN).length;
  const editorsCount = users.filter(u => u.role === UserRole.EDITOR).length;
  const usersCount = users.filter(u => u.role === UserRole.USER).length;

  const StatPill = ({ icon: Icon, label, count, color }: any) => (
    <div className={clsx("flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm")}>
       <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", color)}>
          <Icon size={20} />
       </div>
       <div>
          <p className="text-xl font-black text-slate-900 leading-none">{count}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
       </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Syncing...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      
      <ConfirmModal 
        isOpen={!!deleteUserId} 
        onClose={() => setDeleteUserId(null)} 
        onConfirm={handleDelete} 
        title="Archive User?" 
        message="This will move the user to system archives." 
        isLoading={actionLoading} 
      />

      <ConfirmModal 
        isOpen={!!suspendUserId} 
        onClose={() => setSuspendUserId(null)} 
        onConfirm={handleSuspendToggle} 
        title={suspendUserId?.current ? "Reinstate User?" : "Suspend User?"} 
        message={suspendUserId?.current ? "User will regain access to the platform." : "User will be blocked from logging into the platform immediately."} 
        isLoading={actionLoading} 
      />

      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white border-0 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Edit2 className="text-red-600" /> Edit Identity</h3>
               <button onClick={() => setEditUser(null)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateUserDetails} className="space-y-6">
              <Input label="Full Name" value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone Number" value={editUser.phone} onChange={e => setEditUser({...editUser, phone: e.target.value})} required />
                <Select label="Blood Group" value={editUser.bloodGroup} onChange={e => setEditUser({...editUser, bloodGroup: e.target.value as BloodGroup})}>
                  {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </Select>
              </div>
              <Input label="Location" value={editUser.location} onChange={e => setEditUser({...editUser, location: e.target.value})} required />
              <div className="pt-4 flex gap-4">
                <Button type="submit" isLoading={actionLoading} className="flex-1 py-4 rounded-2xl">Update User</Button>
                <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1 py-4 rounded-2xl">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {pwdUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white border-0 rounded-[2.5rem]">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><Key size={32} /></div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">System PIN Reset</h3>
              <p className="text-sm text-slate-500 font-medium">Resetting password for <span className="text-red-600 font-bold">{pwdUser.name}</span></p>
            </div>
            <div className="space-y-6">
              <Input type="password" label="New Password / PIN" placeholder="Enter strong password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <div className="flex gap-4">
                <Button onClick={handleForcePassword} isLoading={actionLoading} disabled={!newPassword} className="flex-1 py-4 rounded-2xl">Confirm Reset</Button>
                <Button variant="outline" onClick={() => { setPwdUser(null); setNewPassword(''); }} className="flex-1 py-4 rounded-2xl">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">User Management</h1>
          <p className="text-sm text-slate-500 font-medium">Control global access and system privileges.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 overflow-x-auto no-scrollbar">
          {['users', 'access-hub'].map((t: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={clsx("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === t ? "bg-white shadow-md text-red-600" : "text-slate-500")}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <StatPill icon={Fingerprint} label="Super Admin" count={superAdminsCount} color="bg-purple-50 text-purple-600" />
             <StatPill icon={Shield} label="Total Admin" count={adminsCount} color="bg-red-50 text-red-600" />
             <StatPill icon={Edit} label="Total Editor" count={editorsCount} color="bg-blue-50 text-blue-600" />
             <StatPill icon={UserIcon} label="Total Users" count={usersCount} color="bg-green-50 text-green-600" />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
             <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none shadow-sm focus:ring-4 focus:ring-red-500/10 transition-all" 
                />
             </div>
             <div className="relative group min-w-[200px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={18} />
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none shadow-sm focus:ring-4 focus:ring-red-500/10 transition-all appearance-none cursor-pointer text-slate-600"
                >
                   <option value="ALL">All Roles</option>
                   <option value={UserRole.USER}>User</option>
                   <option value={UserRole.EDITOR}>Editor</option>
                   <option value={UserRole.ADMIN}>Admin</option>
                   <option value={UserRole.SUPERADMIN}>Super Admin</option>
                </select>
             </div>
          </div>
          
          {/* Desktop Table View */}
          <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white rounded-[2rem]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-6 py-5">Profile</th>
                  <th className="px-6 py-5">BL ID</th>
                  <th className="px-6 py-5">Email</th>
                  <th className="px-6 py-5">Role</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(u => {
                  const count = userRankMap[u.id] || 0;
                  const rank = getRankData(count);
                  
                  return (
                    <tr key={u.id} className={clsx("transition-colors", u.isSuspended ? "bg-red-50/50" : "hover:bg-slate-50")}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                            "w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border border-white shadow-sm relative transition-all",
                            rank ? `ring-2 ${rank.color.replace('text-', 'ring-')}` : "bg-slate-100"
                          )}>
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-300" />}
                            {u.isSuspended && <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center text-red-600"><Ban size={14}/></div>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="font-black text-slate-900">{u.name}</p>
                               {rank && <Badge className={clsx("text-[6px] py-0 px-1", rank.bg, rank.color)}>{rank.name}</Badge>}
                            </div>
                            {u.isSuspended && <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">Suspended</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-bold font-mono">
                        {u.idNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-bold">{u.email}</td>
                      <td className="px-6 py-5">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} 
                          disabled={(u.role === UserRole.SUPERADMIN && !isSuperAdminViewer) || (u.email === ADMIN_EMAIL)}
                          className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer text-slate-700 disabled:opacity-50"
                        >
                          {Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN || isSuperAdminViewer).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => navigate('/role-permissions', { state: { selectedUserId: u.id } })} 
                             title="Manage Permissions" 
                             className="p-2 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                           >
                             <Settings size={18} />
                           </button>
                           {(!u.idNumber || u.idNumber === '00000') && (
                             <button onClick={() => handleGenerateId(u.id)} title="Generate BL ID" className="p-2 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"><Wand2 size={18} /></button>
                           )}
                           <button onClick={() => setSuspendUserId({id: u.id, current: !!u.isSuspended})} disabled={u.role === UserRole.SUPERADMIN} className={clsx("p-2 rounded-xl transition-all", u.isSuspended ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50", u.role === UserRole.SUPERADMIN && "opacity-0 pointer-events-none")}><Ban size={18} /></button>
                           <button onClick={() => setEditUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} title="Edit User" className="p-2 text-slate-300 hover:text-blue-600 transition-colors disabled:opacity-20"><Edit2 size={18} /></button>
                           <button onClick={() => setPwdUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} title="Change Password" className="p-2 text-slate-300 hover:text-orange-500 transition-colors disabled:opacity-20"><Key size={18} /></button>
                           <button onClick={() => setDeleteUserId(u.id)} disabled={u.role === UserRole.SUPERADMIN || u.email === admin?.email} title="Delete User" className="p-2 text-slate-300 hover:text-red-600 disabled:opacity-0 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
             {filteredUsers.map(u => {
               const count = userRankMap[u.id] || 0;
               const rank = getRankData(count);

               return (
                 <Card key={u.id} className={clsx("p-6 border-0 shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden", u.isSuspended && "opacity-75")}>
                   <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-4">
                        <div className={clsx(
                          "w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md flex items-center justify-center relative",
                          rank ? `ring-4 ${rank.color.replace('text-', 'ring-')}` : "bg-slate-100"
                        )}>
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300" />}
                          {u.isSuspended && <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center text-red-600"><Ban size={18}/></div>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-black text-slate-900 text-lg leading-tight">{u.name}</p>
                             {rank && <Badge className={clsx("text-[8px] py-0 px-2", rank.bg, rank.color)}>{rank.name}</Badge>}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[180px]">{u.email}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1">{u.idNumber || 'No ID'}</p>
                        </div>
                     </div>
                     <div className="absolute top-4 right-4">
                       <Badge color={u.role === UserRole.SUPERADMIN ? 'red' : (u.role === UserRole.ADMIN ? 'red' : (u.role === UserRole.EDITOR ? 'blue' : 'green'))} className="text-[8px] px-3 py-1 ring-4 ring-slate-50">
                         {u.role}
                       </Badge>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2 border border-slate-100">
                         <Shield size={14} className="text-red-500" />
                         <span className="text-[10px] font-black text-slate-700">{u.bloodGroup} Group</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2 border border-slate-100">
                         <MapPin size={14} className="text-blue-500" />
                         <span className="text-[10px] font-bold text-slate-600 truncate">{u.location}</span>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-5 border-t border-slate-100 gap-3">
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} 
                        disabled={(u.role === UserRole.SUPERADMIN && !isSuperAdminViewer) || (u.email === ADMIN_EMAIL)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer text-slate-700 shadow-inner"
                      >
                        {Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN || isSuperAdminViewer).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => navigate('/role-permissions', { state: { selectedUserId: u.id } })}
                           className="p-3 rounded-2xl bg-green-50 text-green-600 border border-green-100 shadow-md"
                         >
                           <Settings size={20} />
                         </button>
                         {(!u.idNumber || u.idNumber === '00000') && (
                           <button onClick={() => handleGenerateId(u.id)} className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-md">
                             <Wand2 size={20} />
                           </button>
                         )}
                         <button onClick={() => setSuspendUserId({id: u.id, current: !!u.isSuspended})} disabled={u.role === UserRole.SUPERADMIN} className={clsx("p-3 rounded-2xl transition-all shadow-md", u.isSuspended ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                           <Ban size={20} />
                         </button>
                         <button onClick={() => setEditUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} className="p-3 rounded-2xl bg-white border border-slate-100 text-blue-600 shadow-md">
                           <Edit2 size={20} />
                         </button>
                         <button onClick={() => setPwdUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} className="p-3 rounded-2xl bg-white border border-slate-100 text-orange-600 shadow-md">
                           <Key size={20} />
                         </button>
                         <button onClick={() => setDeleteUserId(u.id)} disabled={u.role === UserRole.SUPERADMIN || u.email === admin?.email} className="p-3 rounded-2xl bg-white border border-slate-100 text-red-600 shadow-md">
                           <Trash2 size={20} />
                         </button>
                      </div>
                   </div>
                 </Card>
               );
             })}
          </div>
        </div>
      )}

      {activeTab === 'access-hub' && (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-3xl shadow-sm border border-slate-100">
              <div className="relative flex-1 group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search user name..." 
                   value={accessSearch} 
                   onChange={(e) => setAccessSearch(e.target.value)} 
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20 transition-all" 
                 />
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                 <select 
                   value={accessTypeFilter}
                   onChange={(e) => setAccessTypeFilter(e.target.value)}
                   className="flex-1 md:w-48 px-4 py-3 bg-slate-50 border-0 rounded-2xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer focus:ring-2 focus:ring-red-500/20 text-slate-600"
                 >
                    <option value="ALL">All Types</option>
                    <option value="directory">Directory Access</option>
                    <option value="support">Support Access</option>
                    <option value="feedback">Feedback Access</option>
                    <option value="idcard">ID Card Access</option>
                 </select>

                 <select 
                   value={accessStatusFilter}
                   onChange={(e) => setAccessStatusFilter(e.target.value)}
                   className="flex-1 md:w-48 px-4 py-3 bg-slate-50 border-0 rounded-2xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer focus:ring-2 focus:ring-red-500/20 text-slate-600"
                 >
                    <option value="ALL">All Status</option>
                    <option value="REQUESTED">Requested</option>
                    <option value="ACTIVE">Granted / Active</option>
                    <option value="REVOKED">Revoked / None</option>
                 </select>
              </div>
           </div>

           <AccessHub 
             users={users} 
             onAction={handleAccessAction} 
             searchQuery={accessSearch}
             accessType={accessTypeFilter}
             accessStatus={accessStatusFilter}
           />
        </div>
      )}
    </div>
  );
};
