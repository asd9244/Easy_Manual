import { LucideIcon } from 'lucide-react';
// --- Types ---
export type Screen = 'splash' | 'tutorial' | 'auth' | 'home' | 'garage' | 'chat' | 'history' | 'settings' | 'scan' | 'profile'| 'theme-select' | 'share' | 'settings-notifications' | 'settings-language' | 'settings-privacy' | 'settings-help';

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
  alias?: string;
  productType?: string;
  image?: string;
  icon?: any;
}

export interface DeviceModel {
  id: number;
  name: string;
  /** manuals.product_type과 동일 (모델 행 단위 구분) */
  productType: string;
  qrCodeUrl: string;
}

export interface ManualSearchResponse {
  manualId: number;
  productType: string;
  representativeModelName: string;
  models: DeviceModel[];
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
  manualImageUrls?: string[]; // 백엔드에서 AI가 찾은 매뉴얼 이미지 URL 리스트
  attachments?: string[]; // 프론트엔드 UI용 배열
  manualLink?: string; // 추가: 매뉴얼 버튼용 링크
  solutionStats?: string; // 추가: 해결 통계 지표 (예: "10명 중 3명 해결")
}