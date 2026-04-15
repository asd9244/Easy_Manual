import { Camera, ScanText, CheckCircle2, WashingMachine, Wind } from 'lucide-react';
import { Device, Theme } from '../types/index';

// --- Mock Data ---
export const MOCK_DEVICES: Device[] = [
  { id: '1', name: '스마트 세탁기', model: 'LG-V900', image: 'https://picsum.photos/seed/washer/400/400', icon: WashingMachine },
  { id: '2', name: '공기 청정기', model: 'Dyson-PH04', image: 'https://picsum.photos/seed/purifier/400/400', icon: Wind },
];

export const TUTORIAL_STEPS = [
  {
    icon: Camera,
    title: "스캔",
    description: "가전의 모델명이나 궁금한 부분을 찍으세요.",
    color: "bg-theme-primary"
  },
  {
    icon: ScanText,
    title: "분석",
    description: "픽시가 복잡한 설명서를 순식간에 읽어드려요.",
    color: "bg-theme-secondary"
  },
  {
    icon: CheckCircle2,
    title: "해결",
    description: "쉬운 설명과 영상으로 고민을 바로 해결하세요.",
    color: "bg-theme-primary"
  }
];

export const THEMES: Theme[] = [
  // 1. Base44 Sky: 맑고 쨍한 하늘색과 상큼한 복숭아 핑크
  { id: 'magician', name: 'Base44 Sky', primary: '#8ACDF6', secondary: '#FFC8A8', vibe: 'Clear, Vibrant, Fresh' },
  
  // 2. Morning Dew: 생기 도는 티파니 민트와 산뜻한 레몬 노랑
  { id: 'forest', name: 'Morning Dew', primary: '#6AD1C8', secondary: '#FDE073', vibe: 'Natural, Bright, Dewy' },
  
  // 3. Misty Blue: 신뢰감 있는 또렷한 스카이블루와 라벤더
  { id: 'expert', name: 'Misty Blue', primary: '#7BAAF7', secondary: '#D2A8E5', vibe: 'Neat, Professional, Sharp' },
  
  // 4. Cozy Room: 따뜻하게 구운 라떼 색상과 선명한 코랄 오렌지
  { id: 'home', name: 'Cozy Room', primary: '#E0B890', secondary: '#FFA07A', vibe: 'Warm, Pastel, Vivid' }
];