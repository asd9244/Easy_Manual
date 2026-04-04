package com.easymanual.springbackend.domain.user.repository;

import com.easymanual.springbackend.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// DB에서 유저를 찾거나 저장하는 인터페이스입니다. Spring Data JPA가 알아서 코드를 만들어주기 때문에 우리는 껍데기만 만들면 됩니다.

// JpaRepository<다룰 엔티티, 엔티티의 PK 타입> 을 상속받으면 기본 CRUD(저장,조회,수정,삭제)가 자동 완성됩니다.
public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일로 유저가 이미 존재하는지 확인하는 기능 (회원가입 중복 검사용)
    boolean existsByEmail(String email);

    // 이메일로 유저 정보를 찾아오는 기능 (나중에 로그인할 때 씁니다)
    Optional<User> findByEmail(String email);
}