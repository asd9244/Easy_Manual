import { LucideIcon } from 'lucide-react';
// --- Types ---
export type Screen = 'splash' | 'tutorial' | 'auth' | 'home' | 'garage' | 'chat' | 'history' | 'settings' | 'scan' | 'profile'| 'theme-select';

export type ThemeType = 'magician' | 'forest' | 'expert' | 'home';

export interface Theme {
  id: ThemeType;
  name: string;
  primary: string;
  secondary: string;
  vibe: string;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  image: string;
  icon?: any;
}

export interface Message {
  id: string;
  sender: 'user' | 'fixie';
  text: string;
  type?: 'guide' | 'status';
  videoUrl?: string;
  locatorImage?: string;
  attachments?: string[];
}