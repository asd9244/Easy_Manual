package com.easymanual.springbackend.global.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// 이 클래스는 우리가 application.yml에 적어두었던 비밀키(Secret Key)를 가져와서, 위조가 불가능한 안전한 토큰을 만들어냅니다.


@Component // 스프링이 이 기계를 알아서 관리하도록 등록합니다.
public class JwtProvider {

    private final SecretKey secretKey;
    private final long expirationTime;

    // application.yml에 적어둔 jwt.secret과 jwt.expiration 값을 가져와서 기계를 세팅합니다.
    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationTime) {
        // 우리가 적은 비밀문자를 컴퓨터가 이해할 수 있는 진짜 '암호키'로 변환합니다.
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationTime = expirationTime;
    }

    // 핵심 기능: 유저의 이메일을 받아서 JWT 팔찌(문자열)를 만들어주는 메서드
    public String createToken(String email) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + expirationTime); // 지금 시간 + 24시간

        return Jwts.builder()
                .subject(email) // 팔찌에 유저의 이메일 이름을 적어둡니다.
                .issuedAt(now) // 팔찌 발급 시간
                .expiration(validity) // 팔찌 만료 시간 (24시간 뒤면 끊어짐)
                .signWith(secretKey) // 우리 서버만의 비밀키로 도장을 쾅! 찍습니다. (위조 방지)
                .compact(); // 최종적으로 긴 문자열(토큰)로 압축해서 반환합니다.
    }

    // 1. 팔찌(토큰)에 적힌 '이메일'을 읽어내는 기능
    public String getEmail(String token) {
        return Jwts.parser()
                .verifyWith(secretKey) // 우리 서버의 비밀키로 열어봅니다.
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject(); // 아까 subject에 넣었던 email을 꺼냅니다.
    }

    // 2. 이 팔찌(토큰)가 위조되지 않았고, 유효기간이 안 지났는지 검사하는 기능
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true; // 에러 없이 열리면 진짜 팔찌!
        } catch (Exception e) {
            return false; // 유효기간이 지났거나, 위조되었으면 가짜 팔찌!
        }
    }
}