import { LucideIcon } from 'lucide-react';
// --- Types ---
export type Screen = 'splash' | 'tutorial' | 'auth' | 'home' | 'garage' | 'chat' | 'history' | 'settings' | 'scan' | 'profile'| 'theme-select' | 'report' | 'share' | 'settings-notifications' | 'settings-language' | 'settings-privacy' | 'settings-help';

export type ThemeType = 'magician' | 'forest' | 'expert' | 'home';

export interface Theme {
  id: ThemeType;
  name: string;
  primary: string;
  secondary: string;
  vibe: string;
}

export interface Device {
  id: string; // 혹은 number
  name: string;
  model: string; // 모델명 (예: FQ17SADWE2)
  alias?: string; // 유저 기기 등록 테이블(UserDevice)의 alias "거실 에어컨"
  image?: string;
  icon?: any;
}

export interface Message {
  id: string; // 혹은 number
  senderType: 'USER' | 'AI'; // 백엔드의 senderType(USER/AI)에 대응
  text: string;
  type?: 'guide' | 'status';
  videoUrl?: string; // 옵션
  locatorImage?: string; // 옵션
  mediaUrl?: string; // S3 주소 등을 담을 사진/음성 첨부 기능
  referencedPage?: number | string; // AI의 답변 출처를 표기하기 위해
  manualImageUrl?: string; // 백엔드에서 AI가 찾은 매뉴얼 내 위치 이미지
  attachments?: string[]; // 프론트엔드 UI용 배열
}