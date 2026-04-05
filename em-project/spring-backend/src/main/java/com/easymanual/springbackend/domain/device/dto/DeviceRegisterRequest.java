package com.easymanual.springbackend.domain.device.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 클라이언트가 전송하는 JSON 데이터(모델명, 별명)를 자바 객체로 바인딩(매핑)하기 위한 클래스입니다.

@Getter
@NoArgsConstructor
public class DeviceRegisterRequest {

    // 클라이언트가 입력한 실제 에어컨/세탁기 모델명 (예: "FQ17SADWE2")
    private String modelName;

    // 클라이언트가 설정한 기기의 식별용 별명 (예: "거실 에어컨")
    private String alias;
}