import type { Device } from '@/src/types/index';
import type { GuideProductTypeFilter } from '@/src/services/guideService';

/**
 * TOP 5에서 선택한 제품군 칩에 맞게 등록 기기 목록을 필터한다.
 * `전체`이면 순서 유지한 복사본을 반환한다.
 */
export function filterDevicesByGuideProductType(
  devices: Device[],
  filter: GuideProductTypeFilter,
): Device[] {
  if (filter === '전체') return [...devices];
  return devices.filter((d) => d.productType === filter);
}
