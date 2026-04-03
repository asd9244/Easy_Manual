package com.easymanual.springbackend.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// BaseTimeEntity 시간 자동화 기능이 작동하려면 이 설정 파일이 꼭 필요합니다.


 @Configuration
@EnableJpaAuditing
public class JpaConfig {
}
