
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Login, Register, ResetPassword } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Landing } from './pages/Landing';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { AdminDonations } from './pages/AdminDonations';
import { AdminSystemLogs } from './pages/AdminSystemLogs';
import { AdminArchives } from './pages/AdminArchives';
import { AdminPermissions } from './pages/AdminPermissions';
import { AdminPageCustomizer } from './pages/AdminPageCustomizer';
import { AdminSummary } from './pages/AdminSummary';
import { AdminRolePermissions } from './pages/AdminRolePermissions';
import { DonorDirectory } from './pages/DonorDirectory';
import { MyDonations } from './pages/MyDonations';
import { SupportCenter } from './pages/SupportCenter';
import { DonationFeedbackPage, FeedbackApprovalPage, PublicFeedbackPage } from './pages/Feedback';
import { MyNotice } from './pages/MyNotice';
import { AdminIDCards } from './pages/AdminIDCards';
import { VerifyMember } from './pages/VerifyMember';
import { AdminVerificationHistory } from './pages/AdminVerificationHistory';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { HelpCenter } from './pages/HelpCenter';
import { AdminHelpCenter } from './pages/AdminHelpCenter';
import { PublicNotices } from './pages/PublicNotices';
import { NoticeDetail } from './pages/NoticeDetail';
import { PublicFaqs } from './pages/PublicFaqs';
import { AdminFaqs } from './pages/AdminFaqs';
import { PublicLayout } from './components/PublicLayout';
import { UserRole, RolePermissions } from './types';

const { HashRouter, Routes, Route, Navigate } = ReactRouterDOM;

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  requiredPermission 
}: { 
  children?: React.ReactNode, 
  allowedRoles?: UserRole[],
  requiredPermission?: keyof RolePermissions['sidebar']
}) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  
  // SuperAdmin bypasses all role restrictions
  if (user?.role === UserRole.SUPERADMIN) return <Layout>{children}</Layout>;

  // Check strict role requirement
  const roleGranted = allowedRoles ? allowedRoles.includes(user.role) : true;
  
  // Check permission override if specific permission is required
  // If user has the specific sidebar permission enabled in their overrides/role settings, grant access
  const permissionGranted = requiredPermission 
    ? user?.permissions?.sidebar?.[requiredPermission] === true 
    : false;

  // Access is granted if Role matches OR Permission Override is true.
  // If allowedRoles is NOT provided, it means route is open to any auth user (e.g. Dashboard)
  // If requiredPermission IS provided, we check that.
  
  if (allowedRoles) {
    if (!roleGranted && !permissionGranted) {
       return <Navigate to="/dashboard" replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

// Removed redirection to Dashboard if authenticated to allow Landing page access via Logo
const RootRoute = () => {
  return <Landing />;
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Password Reset Routes */}
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route path="/public-feedbacks" element={<PublicFeedbackPage />} />
          <Route path="/public-notices" element={<PublicNotices />} />
          <Route path="/public-notices/:id" element={<NoticeDetail />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/faqs" element={<PublicFaqs />} />
          
          {/* Public Verification Route with PublicLayout */}
          <Route path="/verify/:idNumber?" element={<PublicLayout><VerifyMember /></PublicLayout>} />
          
          {/* Publicly accessible Directory with internal login prompt */}
          <Route path="/donors" element={<PublicLayout><DonorDirectory /></PublicLayout>} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-donations" element={<ProtectedRoute><MyDonations /></ProtectedRoute>} />
          
          {/* Protected Directory Route for Dashboard */}
          <Route path="/directory" element={<ProtectedRoute requiredPermission="donors"><DonorDirectory /></ProtectedRoute>} />
          
          <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><DonationFeedbackPage /></ProtectedRoute>} />
          <Route path="/notices" element={<ProtectedRoute><MyNotice /></ProtectedRoute>} />

          <Route path="/summary" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} requiredPermission="summary"><AdminSummary /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} requiredPermission="users"><AdminUserManagement /></ProtectedRoute>} />
          <Route path="/landing-settings" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} requiredPermission="landingSettings"><AdminPageCustomizer /></ProtectedRoute>} />
          <Route path="/manage-donations" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} requiredPermission="manageDonations"><AdminDonations /></ProtectedRoute>} />
          <Route path="/approve-feedback" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} requiredPermission="approveFeedback"><FeedbackApprovalPage /></ProtectedRoute>} />
          <Route path="/help-center-manage" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} requiredPermission="helpCenterManage"><AdminHelpCenter /></ProtectedRoute>} />
          <Route path="/moderate-faqs" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPERADMIN]} requiredPermission="moderateFaqs"><AdminFaqs /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} requiredPermission="notifications"><AdminPermissions /></ProtectedRoute>} />
          
          {/* Admin Integrated Verification Routes */}
          <Route path="/admin/verify/:idNumber?" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} requiredPermission="adminVerify"><VerifyMember /></ProtectedRoute>} />
          <Route path="/verification-history" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} requiredPermission="verificationHistory"><AdminVerificationHistory /></ProtectedRoute>} />
          
          <Route path="/role-permissions" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} requiredPermission="rolePermissions"><AdminRolePermissions /></ProtectedRoute>} />
          <Route path="/deleted-users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} requiredPermission="deletedUsers"><AdminArchives /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} requiredPermission="logs"><AdminSystemLogs /></ProtectedRoute>} />
          <Route path="/team-id-cards" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} requiredPermission="teamIdCards"><AdminIDCards /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
