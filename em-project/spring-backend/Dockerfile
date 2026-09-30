# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# Spring Boot 이미지 — "멀티 스테이지": 빌드용 JDK 이미지와 실행용 JRE 이미지를 분리해 용량을 줄입니다.
# 빌드: fixie 루트에서 docker compose build spring
# -----------------------------------------------------------------------------

# [스테이지 1] Gradle로 JAR 만드는 단계
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY gradlew gradlew.bat ./
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY src src

RUN chmod +x gradlew \
    && ./gradlew bootJar --no-daemon

# [스테이지 2] 실행만 하는 가벼운 JRE 이미지
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# root 로 실행하지 않도록 일반 사용자(보안·권한 권장)
RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p uploads

COPY --from=build /app/build/libs/*.jar app.jar
RUN chown -R appuser:appuser /app

USER appuser
# compose 의 "8080:8080" 과 맞춤
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
