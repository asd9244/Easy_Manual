import { api } from '@/src/api/apiService';

/** 홈 칩과 백엔드 `productType`·DB `manuals.product_type`과 동일한 문자열 */
export const GUIDE_PRODUCT_TYPE_FILTERS = ['전체', '에어컨', '냉장고', '세탁기'] as const;

export type GuideProductTypeFilter = (typeof GUIDE_PRODUCT_TYPE_FILTERS)[number];

export interface GuideTop5CategoryItem {
  rank: number;
  category: string;
  label: string;
  count: number;
}

export interface GuideTop5Response {
  productType: string;
  top5: GuideTop5CategoryItem[];
}

/**
 * 백엔드 QuestionCategory.name() 기준 — 홈 TOP 5 표시용 문장 (집계 키는 그대로 category)
 */
const GUIDE_DISPLAY_BY_CATEGORY: Record<string, string> = {
  MODEL_REGISTER: '모델 등록 방법이 궁금해요',
  CLEANING: '청소하는 방법을 알려주세요',
  FILTER: '필터 관련 가이드가 필요해요',
  MALFUNCTION: '고장·이상 증상을 해결하고 싶어요',
  REPAIR: '수리·점검 안내가 필요해요',
  USAGE: '사용법을 알고 싶어요',
  REMOTE: '리모컨 사용법을 알려주세요',
  INSTALL: '설치 방법을 알려주세요',
  WINTER_CARE: '겨울철 관리 방법이 궁금해요',
  ICE_MAKER: '아이스 메이커 사용법이 궁금해요',
  FREEZER_USAGE: '냉동고 사용법을 알려주세요',
  TEMPERATURE: '온도 설정·조절이 궁금해요',
  ETC: '기타 도움이 필요해요',
};

/** TOP 5 카드 제목·채팅 진입 시 초기 질문 문구 */
export function getGuideDisplayTitle(category: string, labelFallback: string): string {
  const mapped = GUIDE_DISPLAY_BY_CATEGORY[category];
  if (mapped) return mapped;
  return labelFallback ? `「${labelFallback}」 관련 가이드가 필요해요` : '가이드가 필요해요';
}

export async function fetchGuideTop5(productType: string): Promise<GuideTop5Response> {
  const response = await api.get<GuideTop5Response>('/guides/top5', {
    params: { productType },
  });
  return response.data;
}
