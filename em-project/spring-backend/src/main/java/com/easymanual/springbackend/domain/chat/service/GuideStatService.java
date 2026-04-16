package com.easymanual.springbackend.domain.chat.service;

import com.easymanual.springbackend.domain.chat.dto.GuideTop5Response;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository.CategoryStatProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuideStatService {

    private static final int TOP_N = 5;
    /** 프론트 칩 "전체"와 동일한 값 */
    public static final String PRODUCT_TYPE_ALL = "전체";

    private final ChatRoomRepository chatRoomRepository;

    @Transactional(readOnly = true)
    public GuideTop5Response getTop5(String productType) {
        List<CategoryStatProjection> stats = PRODUCT_TYPE_ALL.equals(productType)
                ? chatRoomRepository.findCategoryStatsAll(PageRequest.of(0, TOP_N))
                : chatRoomRepository.findCategoryStatsByProductType(
                        productType, PageRequest.of(0, TOP_N));

        List<GuideTop5Response.CategoryRankItem> items = new ArrayList<>();
        for (int i = 0; i < stats.size(); i++) {
            CategoryStatProjection stat = stats.get(i);
            items.add(new GuideTop5Response.CategoryRankItem(
                    i + 1,
                    stat.getCategory().name(),
                    stat.getCategory().getLabel(),
                    stat.getCount()
            ));
        }

        return new GuideTop5Response(productType, items);
    }
}
