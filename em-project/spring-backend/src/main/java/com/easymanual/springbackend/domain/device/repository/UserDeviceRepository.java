package com.easymanual.springbackend.domain.device.repository;

import com.easymanual.springbackend.domain.device.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.easymanual.springbackend.domain.user.entity.User;

import java.util.List;


// 최종적으로 생성된 UserDevice 엔티티를 DB에 영구 저장(Persist)하는 역할을 합니다.

public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    // 기본적인 CRUD(생성, 조회, 수정, 삭제) 기능은 JpaRepository를 상속받음으로써 자동으로 제공됩니다.

    // 특정 User 엔티티를 조건으로, 삭제되지 않은(ACTIVE) 모든 UserDevice 엔티티를 조회합니다.
    List<UserDevice> findAllByUserAndStatus(User user, UserDevice.DeviceStatus status);

    boolean existsByUser_IdAndManual_Id(Long userId, Long manualId);

    /** seed-user-*@localhost.local 계정에 연결된 활성 기기 (채팅방 시드용) */
    @Query("SELECT ud FROM UserDevice ud JOIN ud.user u WHERE u.email LIKE 'seed-user-%@localhost.local' AND ud.status = :status")
    List<UserDevice> findAllActiveForSeedUsers(@Param("status") UserDevice.DeviceStatus status);

}