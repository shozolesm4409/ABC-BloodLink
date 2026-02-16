
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { updateUserProfile, changePassword, getAppPermissions, requestIDCardAccess, getUserDonations, getUserFeedbacks } from '../services/api';
import { Card, Input, Button, Select, Badge, Toast, useToast } from '../components/UI';
import { User, BloodGroup, AppPermissions, UserRole, DonationStatus, DonationRecord, DonationFeedback, FeedbackStatus } from '../types';
import { UserCircle, Lock, Camera, Upload, IdCard, Download, X, Clock, ShieldAlert, Trophy, Award, Star, Medal, Edit3, Image as ImageIcon, Key, LayoutDashboard, History, MessageSquareQuote, ChevronRight, Activity, Droplet, Mail, Phone, MapPin, Hash, User as UserIcon, Check, Wallpaper } from 'lucide-react';
import { IDCardFrame } from './AdminIDCards';
import { toJpeg } from 'html-to-image';
import Cropper from 'react-easy-crop';
import clsx from 'clsx';

// Rank Helper function
export const getRankData = (count: number) => {
  if (count >= 16) return { name: 'Hero', color: 'text-orange-600', bg: 'bg-orange-50', icon: Star, shadow: 'shadow-orange-200' };
  if (count >= 11) return { name: 'Diamond', color: 'text-blue-400', bg: 'bg-blue-50', icon: Trophy, shadow: 'shadow-blue-200' };
  if (count >= 8) return { name: 'Platinum', color: 'text-slate-400', bg: 'bg-slate-100', icon: Award, shadow: 'shadow-slate-200' };
  if (count >= 4) return { name: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-50', icon: Trophy, shadow: 'shadow-yellow-200' };
  if (count >= 1) return { name: 'Silver', color: 'text-slate-400', bg: 'bg-slate-50', icon: Medal, shadow: 'shadow-slate-200' };
  return null;
};

const AVATAR_TEMPLATES = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Zack',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sasha',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya'
];

const COVER_TEMPLATES = [
  'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=1000&auto=format&fit=crop', // Red blood cells abstract
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1000&auto=format&fit=crop', // Abstract red flow
  'https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?q=80&w=1000&auto=format&fit=crop', // Red abstract
  'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1000&auto=format&fit=crop', // Geometric Pattern
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop', // DNA / Medical
  'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=1000&auto=format&fit=crop', // Cell abstract
];

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
  const [coverPreview, setCoverPreview] = useState<string>(user?.coverImage || '');
  
  // Stats State
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  
  // View/Edit Mode State
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [editTab, setEditTab] = useState<'profile' | 'image' | 'password'>('profile');

  // Crop States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [showCardModal, setShowCardModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    getAppPermissions().then(setPerms); 
    if (user) {
      setAvatarPreview(user.avatar || '');
      setCoverPreview(user.coverImage || '');
      Promise.all([getUserDonations(user.id), getUserFeedbacks(user.id)]).then(([d, f]) => {
        setDonations(d);
        setFeedbacks(f);
      });
    }
  }, [user]);

  if (!user) return null;

  const donationCount = donations.filter(d => d.status === DonationStatus.COMPLETED).length;
  const rank = getRankData(donationCount);

  // Helper to check effective permissions (Override > Global)
  const canEditProfile = (() => {
    if (user.permissions?.rules?.canEditProfile !== undefined) {
      return user.permissions.rules.canEditProfile;
    }
    const roleKey = user.role.toLowerCase() as keyof AppPermissions;
    if (user.role === UserRole.SUPERADMIN) return true;
    return perms?.[roleKey]?.rules?.canEditProfile ?? (user.role !== UserRole.USER); // Default fallback
  })();

  const isRestricted = !canEditProfile;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size must be under 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropType('avatar');
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size must be under 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        setCropType('cover');
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSaveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setImgUploading(true);
    try {
      const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      const updates = cropType === 'avatar' 
        ? { avatar: croppedBase64 } 
        : { coverImage: croppedBase64 };

      const updatedUser = await updateUserProfile(user.id, updates, user);
      updateUser(updatedUser);
      
      if (cropType === 'avatar') {
        setAvatarPreview(croppedBase64);
        showToast("Profile photo synchronized.");
      } else {
        setCoverPreview(croppedBase64);
        showToast("Cover photo synchronized.");
      }
      
      setImageToCrop(null);
      setCropType(null);
    } catch (err) {
      showToast("Failed to process image.", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const handleAvatarTemplateClick = async (url: string) => {
    setImgUploading(true);
    try {
      const updatedUser = await updateUserProfile(user.id, { avatar: url }, user);
      updateUser(updatedUser);
      setAvatarPreview(url);
      showToast("Avatar updated from template.");
    } catch (err) {
      showToast("Failed to update avatar.", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const handleCoverTemplateClick = async (url: string) => {
    setImgUploading(true);
    try {
      const updatedUser = await updateUserProfile(user.id, { coverImage: url }, user);
      updateUser(updatedUser);
      setCoverPreview(url);
      showToast("Cover updated from template.");
    } catch (err) {
      showToast("Failed to update cover.", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const handleIDCardClick = async () => {
    if (user.hasIDCardAccess) {
      setShowCardModal(true);
    } else if (!user.idCardAccessRequested) {
      setIsRequesting(true);
      try {
        await requestIDCardAccess(user);
        updateUser({ ...user, idCardAccessRequested: true });
        showToast("ID Card access request sent to Admin.");
      } catch (err) {
        showToast("Request failed.", "error");
      } finally {
        setIsRequesting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRestricted) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updates: Partial<User> = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      location: formData.get('location') as string,
      bloodGroup: formData.get('bloodGroup') as BloodGroup,
    };

    try {
      const updatedUser = await updateUserProfile(user.id, updates, user);
      updateUser(updatedUser);
      showToast("Profile synchronized successfully.");
    } catch (err) { showToast("Failed to update profile.", "error"); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwdLoading(true);
    const formData = new FormData(e.currentTarget);
    const current = formData.get('currentPassword') as string;
    const newPwd = formData.get('newPassword') as string;
    const confirm = formData.get('confirmPassword') as string;

    if (newPwd !== confirm) {
      showToast("PIN matching error.", "error");
      setPwdLoading(false);
      return;
    }

    try {
      await changePassword(user.id, user.name, current, newPwd);
      showToast("PIN updated successfully.");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) { showToast(err.message || 'Update failed.', "error"); }
    finally { setPwdLoading(false); }
  };

  const downloadIDCard = async () => {
    if (!cardRef.current) return;
    try {
      await new Promise(r => setTimeout(r, 600));
      const dataUrl = await toJpeg(cardRef.current, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 4,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `BloodLink-ID-${user.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast("ID Card downloaded successfully.");
    } catch (err) {
      console.error('Download error:', err);
      showToast("Download failed.", "error");
    }
  };

  const StatBox = ({ label, count, color, icon: Icon }: any) => (
    <div className={clsx("flex items-center justify-between p-4 rounded-2xl border bg-white shadow-sm", color)}>
       <div className="flex items-center gap-3">
          <Icon size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-xl font-black">{count}</span>
    </div>
  );

  const IdentityRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
       <div className="flex items-center gap-3">
          <Icon size={16} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
       </div>
       <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <Toast {...toastState} onClose={hideToast} />
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
         <div className="flex items-center gap-4">
           <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-100"><UserCircle size={32} /></div>
           <div>
             <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">Profile Management</h1>
             <p className="text-slate-500 font-medium text-xs lg:text-sm">Update your digital identity and security settings.</p>
           </div>
         </div>
         <div className="flex gap-3 w-full md:w-auto">
            {user.hasIDCardAccess ? (
              <Button onClick={handleIDCardClick} variant="outline" className="flex-1 md:flex-none rounded-2xl border-slate-200 text-slate-600">
                <IdCard className="mr-2" size={18} /> My ID Card
              </Button>
            ) : (
              <Button onClick={handleIDCardClick} isLoading={isRequesting} className="flex-1 md:flex-none rounded-2xl shadow-xl shadow-red-100 bg-slate-900 text-white">
                <ShieldAlert className="mr-2" size={18} /> Request ID
              </Button>
            )}
            
            {viewMode === 'view' ? (
              <Button onClick={() => setViewMode('edit')} className="flex-1 md:flex-none rounded-2xl shadow-xl shadow-red-100">
                <Edit3 className="mr-2" size={18} /> Edit Profile
              </Button>
            ) : (
              <Button onClick={() => setViewMode('view')} variant="outline" className="flex-1 md:flex-none rounded-2xl border-slate-200 text-slate-600">
                <LayoutDashboard className="mr-2" size={18} /> View Profile
              </Button>
            )}
         </div>
      </div>

      {viewMode === 'view' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4">
           {/* Main Profile Card (Wider: col-span-3) */}
           <Card className="lg:col-span-3 p-0 border-0 shadow-2xl bg-white rounded-[2.5rem] relative overflow-hidden text-center h-fit">
              <div className="h-32 w-full relative overflow-hidden">
                {coverPreview ? (
                  <img src={coverPreview} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600"></div>
                )}
                {/* Overlay gradient for text contrast if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>
              
              <div className="px-8 pb-8 -mt-20">
                 <div className="relative mb-6 inline-block">
                    <div className="w-40 h-40 mx-auto bg-white rounded-[2rem] p-2 shadow-xl">
                       <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative border-4 border-slate-50">
                          {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <UserCircle size={64} className="text-slate-200 w-full h-full p-4" />}
                       </div>
                    </div>
                    {rank && (
                       <div className={clsx("absolute bottom-0 right-0 translate-x-1/4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-2 border-white", rank.bg, rank.color)}>
                          <rank.icon size={20} fill="currentColor" />
                       </div>
                    )}
                 </div>
                 
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">{user.name}</h2>
                 <div className="flex justify-center gap-2 mb-8">
                    <Badge color="red" className="px-3 py-1 text-[10px] ring-1 ring-red-100">{user.bloodGroup} Donor</Badge>
                    <Badge color="blue" className="px-3 py-1 text-[10px] ring-1 ring-blue-100">{user.role}</Badge>
                 </div>
                 
                 <div className="text-left space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                       <Upload size={14} /> Identity Details
                    </h3>
                    <div className="space-y-3">
                      <IdentityRow label="BL ID Number" value={user.idNumber || 'N/A'} icon={Hash} />
                      <IdentityRow label="Email Address" value={user.email} icon={Mail} />
                      <IdentityRow label="Full Identity Name" value={user.name} icon={UserIcon} />
                      <IdentityRow label="Primary Phone" value={user.phone} icon={Phone} />
                      <IdentityRow label="Blood Group" value={user.bloodGroup} icon={Droplet} />
                      <IdentityRow label="Current City" value={user.location} icon={MapPin} />
                    </div>
                 </div>
              </div>
           </Card>

           {/* Stats Section (Narrower: col-span-2) */}
           <div className="lg:col-span-2 space-y-8">
              {/* Stacked Vertically as requested */}
              <div className="flex flex-col gap-6">
                 <Card className="p-6 border-0 shadow-xl bg-slate-50 rounded-[2.5rem]">
                    <h3 className="text-[11px] font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest">
                       <History className="text-red-500" size={18} /> My Donate Summary
                    </h3>
                    <div className="space-y-3">
                       <StatBox 
                         label="Pending" 
                         count={donations.filter(d => d.status === DonationStatus.PENDING).length} 
                         color="text-yellow-700 border-yellow-200/50" 
                         icon={Clock} 
                       />
                       <StatBox 
                         label="Completed" 
                         count={donations.filter(d => d.status === DonationStatus.COMPLETED).length} 
                         color="text-green-700 border-green-200/50" 
                         icon={Activity} 
                       />
                       <StatBox 
                         label="Rejected" 
                         count={donations.filter(d => d.status === DonationStatus.REJECTED).length} 
                         color="text-red-700 border-red-200/50" 
                         icon={X} 
                       />
                    </div>
                 </Card>

                 <Card className="p-6 border-0 shadow-xl bg-slate-50 rounded-[2.5rem]">
                    <h3 className="text-[11px] font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest">
                       <MessageSquareQuote className="text-blue-500" size={18} /> Post Feedback Summary
                    </h3>
                    <div className="space-y-3">
                       <StatBox 
                         label="Pending" 
                         count={feedbacks.filter(d => d.status === FeedbackStatus.PENDING).length} 
                         color="text-yellow-700 border-yellow-200/50" 
                         icon={Clock} 
                       />
                       <StatBox 
                         label="Approved" 
                         count={feedbacks.filter(d => d.status === FeedbackStatus.APPROVED).length} 
                         color="text-green-700 border-green-200/50" 
                         icon={Activity} 
                       />
                       <StatBox 
                         label="Rejected" 
                         count={feedbacks.filter(d => d.status === FeedbackStatus.REJECTED).length} 
                         color="text-red-700 border-red-200/50" 
                         icon={X} 
                       />
                    </div>
                 </Card>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-4">
           {/* Sidebar Navigation */}
           <div className="lg:col-span-1 space-y-2">
              <button 
                onClick={() => setEditTab('profile')} 
                className={clsx("w-full flex items-center justify-between p-4 rounded-2xl transition-all", editTab === 'profile' ? "bg-red-600 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-50")}
              >
                 <div className="flex items-center gap-3"><UserCircle size={18} /><span className="font-bold text-sm">Profile</span></div>
                 <ChevronRight size={16} className={clsx(editTab === 'profile' ? "text-white" : "text-slate-300")} />
              </button>
              <button 
                onClick={() => setEditTab('image')} 
                className={clsx("w-full flex items-center justify-between p-4 rounded-2xl transition-all", editTab === 'image' ? "bg-red-600 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-50")}
              >
                 <div className="flex items-center gap-3"><ImageIcon size={18} /><span className="font-bold text-sm">Image Upload</span></div>
                 <ChevronRight size={16} className={clsx(editTab === 'image' ? "text-white" : "text-slate-300")} />
              </button>
              <button 
                onClick={() => setEditTab('password')} 
                className={clsx("w-full flex items-center justify-between p-4 rounded-2xl transition-all", editTab === 'password' ? "bg-red-600 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-50")}
              >
                 <div className="flex items-center gap-3"><Key size={18} /><span className="font-bold text-sm">Change Password</span></div>
                 <ChevronRight size={16} className={clsx(editTab === 'password' ? "text-white" : "text-slate-300")} />
              </button>
           </div>

           {/* Content Area */}
           <div className="lg:col-span-3">
              {editTab === 'profile' && (
                <Card className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem] animate-in fade-in">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3"><Upload size={16} /> Identity Details</h3>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2"><Input label="BL ID Number (Protected)" value={user.idNumber} disabled className="opacity-50 font-mono" /></div>
                    <div className="md:col-span-2"><Input label="Email Address (Locked)" value={user.email} disabled className="opacity-50" /></div>
                    <div className="md:col-span-2"><Input label="Full Identity Name" name="name" defaultValue={user.name} disabled={isRestricted} /></div>
                    <Input label="Primary Phone" name="phone" defaultValue={user.phone} disabled={isRestricted} />
                    <Select label="Blood Group" name="bloodGroup" defaultValue={user.bloodGroup} disabled={isRestricted}>
                        {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </Select>
                    <div className="md:col-span-2"><Input label="Current City / Area" name="location" defaultValue={user.location} disabled={isRestricted} /></div>
                    <div className="md:col-span-2 pt-6 flex justify-end">
                      <Button type="submit" isLoading={loading} disabled={isRestricted} className="w-full lg:w-auto px-12 py-5 rounded-2xl shadow-xl shadow-red-100">
                        {isRestricted ? "Profile Locked by Admin" : "Synchronize Identity"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {editTab === 'image' && (
                <Card className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem] animate-in fade-in">
                   {/* Avatar Upload Section */}
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3"><ImageIcon size={16} /> Avatar Upload</h3>
                   
                   <div className="flex flex-col items-center gap-8 mb-12">
                      <div className="w-40 h-40 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                         {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <UserCircle size={64} className="text-slate-300" />}
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={32} />
                         </div>
                      </div>
                      
                      <div className="w-full max-w-sm text-center">
                         <label className={clsx(
                           "block w-full py-4 rounded-2xl bg-blue-50 text-blue-600 font-bold border border-blue-100 cursor-pointer hover:bg-blue-100 transition-all",
                           isRestricted && "opacity-50 pointer-events-none"
                         )}>
                            Choose Image from Device
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={isRestricted} />
                         </label>
                         <p className="text-[10px] font-medium text-slate-400 mt-3 mb-8">Supported formats: JPG, PNG. Max size: 2MB.</p>
                      </div>

                      <div className="w-full pt-8 border-t border-slate-100">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Or Select Avatar Template</h4>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {AVATAR_TEMPLATES.map((url, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => handleAvatarTemplateClick(url)}
                                disabled={imgUploading || isRestricted}
                                className={clsx(
                                  "aspect-square rounded-2xl bg-slate-50 border-2 overflow-hidden hover:border-red-500 hover:shadow-md transition-all relative group",
                                  avatarPreview === url ? "border-red-600 ring-2 ring-red-100" : "border-slate-100"
                                )}
                              >
                                 <img src={url} alt={`Template ${idx + 1}`} className="w-full h-full object-cover" />
                                 {avatarPreview === url && (
                                   <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                      <div className="bg-red-600 text-white rounded-full p-1"><Check size={12} /></div>
                                   </div>
                                 )}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Cover Upload Section */}
                   <div className="pt-8 border-t-2 border-dashed border-slate-100">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3"><Wallpaper size={16} /> Cover Upload</h3>
                      
                      <div className="flex flex-col gap-8">
                         <div className="w-full h-32 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200 overflow-hidden relative group">
                            {coverPreview ? <img src={coverPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 opacity-20"></div>}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Camera className="text-white" size={32} />
                            </div>
                         </div>

                         <div className="w-full max-w-sm mx-auto text-center">
                            <label className={clsx(
                              "block w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold border border-red-100 cursor-pointer hover:bg-red-100 transition-all",
                              isRestricted && "opacity-50 pointer-events-none"
                            )}>
                               Upload Cover Photo
                               <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" disabled={isRestricted} />
                            </label>
                         </div>

                         <div className="w-full pt-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Blood Related Templates</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                               {COVER_TEMPLATES.map((url, idx) => (
                                 <button 
                                   key={idx} 
                                   onClick={() => handleCoverTemplateClick(url)}
                                   disabled={imgUploading || isRestricted}
                                   className={clsx(
                                     "h-24 rounded-2xl bg-slate-50 border-2 overflow-hidden hover:border-red-500 hover:shadow-md transition-all relative group",
                                     coverPreview === url ? "border-red-600 ring-2 ring-red-100" : "border-slate-100"
                                   )}
                                 >
                                    <img src={url} alt={`Cover Template ${idx + 1}`} className="w-full h-full object-cover" />
                                    {coverPreview === url && (
                                      <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                         <div className="bg-red-600 text-white rounded-full p-1"><Check size={12} /></div>
                                      </div>
                                    )}
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </Card>
              )}

              {editTab === 'password' && (
                <Card className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem] animate-in fade-in">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3"><Lock size={16} /> Security Center Layout</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md mx-auto">
                    <Input label="Current PIN" name="currentPassword" type="password" required />
                    <Input label="New PIN" name="newPassword" type="password" required />
                    <Input label="Confirm PIN" name="confirmPassword" type="password" required />
                    <Button type="submit" variant="secondary" className="w-full py-4 rounded-2xl shadow-xl" isLoading={pwdLoading}>Update Credentials</Button>
                  </form>
                </Card>
              )}
           </div>
        </div>
      )}

      {/* Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="relative w-full max-w-lg aspect-square bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'cover' ? 3 : 1}
                cropShape={cropType === 'avatar' ? 'round' : 'rect'}
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
           </div>
           
           <Card className="w-full max-w-lg mt-8 p-8 space-y-6 bg-white border-0 rounded-[2.5rem]">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                   <span>Adjust Frame</span>
                   <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min={1} 
                  max={3} 
                  step={0.1} 
                  value={zoom} 
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>
              
              <div className="flex gap-4">
                <Button onClick={handleSaveCroppedImage} isLoading={imgUploading} className="flex-1 py-4 rounded-2xl shadow-xl bg-red-600">
                  <Upload size={18} className="mr-2" /> Crop & Save
                </Button>
                <Button variant="outline" onClick={() => { setImageToCrop(null); setCropType(null); }} className="flex-1 py-4 border-slate-200 text-slate-400 rounded-2xl">
                  Cancel
                </Button>
              </div>
           </Card>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
           <div className="max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col items-center gap-6">
             <IDCardFrame user={user} ref={cardRef} />
             <div className="flex gap-4 w-full">
               <Button onClick={downloadIDCard} className="flex-1 rounded-2xl py-4 shadow-2xl">
                 <Download size={18} className="mr-2" /> Download JPG
               </Button>
               <Button onClick={() => setShowCardModal(false)} variant="outline" className="flex-1 bg-white rounded-2xl py-4 text-slate-400 border-slate-200">
                 Close
               </Button>
             </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, button, .no-print, .space-y-8 > *:not(.id-card-container) { display: none !important; }
          body, main { background: white !important; padding: 0 !important; margin: 0 !important; }
          .id-card-container { margin: 0 auto !important; box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}} />
    </div>
  );
};
