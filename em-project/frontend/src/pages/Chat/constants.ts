export const MIN_LOADING_TIME = 2500;

export interface CategoryItem {
  value: string;
  label: string;
}

const PRODUCT_CATEGORIES: Record<string, CategoryItem[]> = {
  '에어컨': [
    { value: 'MODEL_REGISTER', label: '모델 등록' },
    { value: 'CLEANING', label: '에어컨 청소' },
    { value: 'FILTER', label: '에어컨 필터' },
    { value: 'MALFUNCTION', label: '에어컨 고장' },
    { value: 'REPAIR', label: '에어컨 수리' },
    { value: 'REMOTE', label: '에어컨 리모컨' },
    { value: 'INSTALL', label: '에어컨 설치' },
    { value: 'ETC', label: '기타' },
  ],
  '세탁기': [
    { value: 'MODEL_REGISTER', label: '모델 등록' },
    { value: 'CLEANING', label: '세탁기 청소' },
    { value: 'FILTER', label: '세탁기 필터' },
    { value: 'MALFUNCTION', label: '세탁기 고장' },
    { value: 'USAGE', label: '세탁기 사용법' },
    { value: 'REPAIR', label: '세탁기 수리' },
    { value: 'WINTER_CARE', label: '겨울철 세탁기 관리' },
    { value: 'ETC', label: '기타' },
  ],
  '냉장고': [
    { value: 'MODEL_REGISTER', label: '모델 등록' },
    { value: 'CLEANING', label: '냉장고 청소' },
    { value: 'ICE_MAKER', label: '아이스 메이커' },
    { value: 'MALFUNCTION', label: '냉장고 고장' },
    { value: 'USAGE', label: '냉장고 사용법' },
    { value: 'FREEZER_USAGE', label: '냉동고 사용법' },
    { value: 'REPAIR', label: '냉장고 수리' },
    { value: 'TEMPERATURE', label: '냉장고 온도' },
    { value: 'ETC', label: '기타' },
  ],
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { value: 'MODEL_REGISTER', label: '모델 등록' },
  { value: 'MALFUNCTION', label: '고장' },
  { value: 'REPAIR', label: '수리' },
  { value: 'CLEANING', label: '청소' },
  { value: 'USAGE', label: '사용법' },
  { value: 'ETC', label: '기타' },
];

/**
 * productType이 있으면 정확히 매칭, 없으면 deviceName에서 키워드로 추측 (폴백).
 */
export function getCategoriesForProductType(
  productType: string | null | undefined,
  deviceName?: string | null,
): CategoryItem[] {
  if (productType && PRODUCT_CATEGORIES[productType]) {
    return PRODUCT_CATEGORIES[productType];
  }
  if (deviceName) {
    for (const key of Object.keys(PRODUCT_CATEGORIES)) {
      if (deviceName.includes(key)) return PRODUCT_CATEGORIES[key];
    }
  }
  return DEFAULT_CATEGORIES;
}
