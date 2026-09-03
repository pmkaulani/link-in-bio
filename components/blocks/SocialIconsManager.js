'use client';
import { useDashboard } from '../../app/dashboard/DashboardContext';
import SocialLinksManager from '../profile/SocialLinksManager';

export default function SocialIconsManager() {
  const { profile, updateProfile } = useDashboard();
  return <SocialLinksManager profile={profile} updateProfile={updateProfile} />;
}
