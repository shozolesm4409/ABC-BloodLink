
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole, AppPermissions, RolePermissions, DonationStatus, HelpStatus } from '../types';
import { 
  getAppPermissions, 
  getUsers, 
  getDonations, 
  subscribeToAllIncomingMessages, 
  getAllFeedbacks,
  getHelpRequests,
  ADMIN_EMAIL
} from '../services/api';
import { 
  LayoutDashboard, 
  UserCircle, 
  Droplet, 
  Search, 
  FileText, 
  LogOut, 
  Menu, 
  History,
  Users,
  Trash2,
  Bell,
  LifeBuoy,
  MessageSquareQuote,
  CheckCircle2,
  Monitor,
  Megaphone,
  Database,
  UsersRound,
  ChevronRight,
  PieChart,
  Settings,
  IdCard,
  ShieldCheck,
  ClipboardList,
  Lock,
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import clsx from 'clsx';

const { Link, useLocation, useNavigate } = ReactRouterDOM;

interface BadgeConfig {
  count: number;
  color: 'red' | 'blue' | 'green';
}

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  
  const [counts, setCounts] = useState({
    donations: 0,
    access: 0,
    messenger: 0,
    support: 0,
    feedbacks: 0,
    helpRequests: 0
  });

  useEffect(() => {
    getAppPermissions().then(setPerms);
    
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN) {
      const fetchCounts = async () => {
        try {
          const [users, donations, feedbacks, helpReqs] = await Promise.all([
            getUsers(), 
            getDonations(), 
            getAllFeedbacks(),
            getHelpRequests()
          ]);
          setCounts(prev => ({
            ...prev,
            access: users.filter(u => u.directoryAccessRequested || u.supportAccessRequested || u.feedbackAccessRequested || u.idCardAccessRequested).length,
            donations: donations.filter(d => d.status === DonationStatus.PENDING).length,
            feedbacks: feedbacks.filter(f => f.status === 'PENDING').length,
            helpRequests: helpReqs.filter(h => h.status === HelpStatus.PENDING).length
          }));
        } catch (e) {
          console.error("Failed to fetch notification counts", e);
        }
      };
      fetchCounts();
    }

    if (user) {
      const unsubscribeMessages = subscribeToAllIncomingMessages(user.id, (msgs) => {
        const relevantMsgs = msgs.filter(m => m.receiverId === user.id || (user.role !== UserRole.USER && m.roomId.startsWith('SUPPORT_')));
        const messengerCount = relevantMsgs.filter(m => !m.roomId.startsWith('SUPPORT_')).length;
        const supportCount = relevantMsgs.filter(m => m.roomId.startsWith('SUPPORT_')).length;
        setCounts(prev => ({ ...prev, messenger: messengerCount, support: supportCount }));
      }, (err) => {
        console.debug("Layout message subscription restricted");
      });
      return () => unsubscribeMessages();
    }
  }, [user, location.pathname]); 

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label, badges }: { to: string, icon: any, label: string, badges?: BadgeConfig[] }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={clsx(
          "flex items-center justify-between px-2 py-1.5 rounded-xl transition-all duration-200 group relative",
          isActive 
            ? "bg-red-50 text-red-600 font-bold shadow-sm" 
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={clsx(isActive ? "text-red-600" : "text-slate-400 group-hover:text-slate-600")} />
          <span className="text-[13px] tracking-tight">{label}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {badges?.filter(b => b.count > 0).map((b, i) => (
            <span 
              key={i}
              className={clsx(
                "text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm animate-in zoom-in-50",
                b.color === 'red' ? "bg-red-600" : b.color === 'blue' ? "bg-blue-600" : "bg-green-600"
              )}
            >
              {b.count}
            </span>
          ))}
          {(!badges || badges.every(b => b.count === 0)) && isActive && (
            <ChevronRight size={14} className="text-red-300" />
          )}
        </div>
      </Link>
    );
  };

  const SidebarSection = ({ title, children }: { title: string, children?: React.ReactNode }) => {
    const hasVisibleChildren = React.Children.toArray(children).some(child => !!child);
    if (!hasVisibleChildren) return null;

    return (
      <div className="space-y-1 mb-6">
        <h3 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</h3>
        <div className="space-y-0.5">{children}</div>
      </div>
    );
  };

  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || user?.email.trim().toLowerCase() === ADMIN_EMAIL;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isEditor = user?.role === UserRole.EDITOR;

  let basePerms: any = {
    dashboard: true, profile: true, history: true, donors: true, feedback: true, myNotice: true
  };

  if (perms) {
    if (isSuperAdmin) {
      basePerms = perms.superadmin?.sidebar || { 
        summary: true, dashboard: true, profile: true, history: true, donors: true, users: true, manageDonations: true, 
        logs: true, rolePermissions: true, supportCenter: true, feedback: true, approveFeedback: true, 
        landingSettings: true, myNotice: true, notifications: true, adminVerify: true, 
        verificationHistory: true, teamIdCards: true, deletedUsers: true, helpCenterManage: true, moderateFaqs: true
      };
    } else if (isAdmin) {
      basePerms = perms.admin?.sidebar || basePerms;
    } else if (isEditor) {
      basePerms = perms.editor?.sidebar || basePerms;
    } else {
      basePerms = perms.user?.sidebar || basePerms;
    }
  } else if (isSuperAdmin) {
    // If perms not loaded yet, default superadmin to all access to prevent flickering or lockout
    basePerms = { 
      summary: true, dashboard: true, profile: true, history: true, donors: true, users: true, manageDonations: true, 
      logs: true, rolePermissions: true, supportCenter: true, feedback: true, approveFeedback: true, 
      landingSettings: true, myNotice: true, notifications: true, adminVerify: true, 
      verificationHistory: true, teamIdCards: true, deletedUsers: true, helpCenterManage: true, moderateFaqs: true
    };
  }

  // Determine effective permissions by merging base permissions with user overrides
  // Ensure SuperAdmin always has critical access even if overrides exist (failsafe)
  const s = user?.permissions?.sidebar 
    ? { ...basePerms, ...user.permissions.sidebar } 
    : basePerms;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col shadow-2xl lg:shadow-none h-screen overflow-hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Link to="/" className="h-20 flex-shrink-0 flex items-center px-6 gap-3 mb-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-100 ring-4 ring-red-50">
            <Droplet className="text-white fill-current" size={22} />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tighter block leading-none">BloodLink</span>
            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Management Hub</span>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
          <SidebarSection title="User Hub">
            {s.dashboard && <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
            {s.profile && <NavItem to="/profile" icon={UserCircle} label="Account Profile" />}
            {s.history && <NavItem to="/my-donations" icon={History} label="My Donate" />}
          </SidebarSection>

          <SidebarSection title="Community">
             {s.donors && <NavItem to="/directory" icon={Search} label="Donor Directory" />}
             {s.myNotice && <NavItem to="/notices" icon={Megaphone} label="Board Notices" />}
             {s.supportCenter && (
               <NavItem 
                 to="/support" 
                 icon={LifeBuoy} 
                 label="Support Center" 
                 badges={[
                   { count: counts.messenger, color: 'blue' },
                   { count: counts.support, color: 'green' }
                 ]} 
               />
             )}
             {/* Help Center removed from sidebar */}
             {s.feedback && <NavItem to="/feedback" icon={MessageSquareQuote} label="Post Feedback" />}
          </SidebarSection>

          <SidebarSection title="Content Admin">
            {s.landingSettings && <NavItem to="/landing-settings" icon={Monitor} label="Page Customizer" />}
            {s.manageDonations && <NavItem to="/manage-donations" icon={Database} label="Donation Records" badges={[{ count: counts.donations, color: 'red' }]} />}
            {s.approveFeedback && <NavItem to="/approve-feedback" icon={CheckCircle2} label="Moderate Feedback" badges={[{ count: counts.feedbacks, color: 'red' }]} />}
            {s.helpCenterManage && <NavItem to="/help-center-manage" icon={HelpCircle} label="Help Center manage" badges={[{ count: counts.helpRequests, color: 'red' }]} />}
            {s.moderateFaqs && <NavItem to="/moderate-faqs" icon={FileQuestion} label="Moderate FAQ's" />}
          </SidebarSection>

          <SidebarSection title="People Control">
            {s.summary && <NavItem to="/summary" icon={PieChart} label="System Summary" />}
            {s.users && <NavItem to="/users" icon={UsersRound} label="Manage Users" />}
            {s.notifications && <NavItem to="/notifications" icon={Bell} label="Access Requests" badges={[{ count: counts.access, color: 'red' }]} />}
            {s.adminVerify && <NavItem to="/admin/verify" icon={ShieldCheck} label="Verify Identity" />}
            {s.verificationHistory && <NavItem to="/verification-history" icon={ClipboardList} label="Verification History" />}
            {s.teamIdCards && <NavItem to="/team-id-cards" icon={IdCard} label="Team ID Cards" />}
          </SidebarSection>

          <SidebarSection title="System Intel">
            {s.rolePermissions && <NavItem to="/role-permissions" icon={Lock} label="Role Permissions" />}
            {s.deletedUsers && <NavItem to="/deleted-users" icon={Trash2} label="System Archives" />}
            {s.logs && <NavItem to="/logs" icon={FileText} label="Activity Logs" />}
          </SidebarSection>
        </div>

        <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 bg-white rounded-l border border-slate-200 shadow-sm mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black overflow-hidden border border-red-100">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-slate-900 truncate">{user?.name}</p>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors bg-white rounded-xl border border-slate-200 hover:border-red-100 shadow-sm active:scale-95"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-0 h-screen overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex-shrink-0 flex items-center justify-between px-3 shadow-sm z-40 sticky top-0">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-red-600 rounded-l flex items-center justify-center">
              <Droplet className="text-white fill-current" size={18} />
            </div>
            <span className="font-black text-slate-900 tracking-tighter text-lg">BloodLink</span>
          </Link>
          <div className="hidden lg:block">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Authenticated Session</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50/50 rounded-l border border-slate-100 lg:hidden">
            <Menu size={20} className="text-slate-700" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-2 lg:p-4 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
