package com.easymanual.springbackend.domain.file.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

// 클라이언트가 HTTP 통신을 통해 전송한 MultipartFile(파일 데이터 객체)을 받아서, 파일 이름이 중복되지 않도록 고유한 이름(UUID)으로 변경한 뒤, 서버의 지정된 폴더에 물리적으로 저장(Save)하는 비즈니스 로직을 담당합니다.

@Service
public class FileService {

    // 이미지가 물리적으로 저장될 서버 내의 폴더 경로를 지정합니다.
    // 프로젝트 최상위 경로에 'uploads'라는 폴더를 사용합니다.
    private final String uploadDir = "uploads/";

    public String uploadImage(MultipartFile file) {
        // 1. 클라이언트가 파일을 첨부하지 않은 경우 예외를 발생시킵니다.
        if (file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }

        // 2. 저장할 폴더가 서버에 존재하지 않는다면 자동으로 생성(mkdir)합니다.
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // 3. 파일명 중복으로 인한 덮어쓰기를 방지하기 위해, UUID(고유 식별자)를 생성하여 원본 파일명에 붙여줍니다.
        // 예: "my_photo.jpg" -> "123e4567-e89b-12d3-a456-426614174000_my_photo.jpg"
        String originalFilename = file.getOriginalFilename();
        String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;

        // 4. 최종적으로 파일이 저장될 절대 경로 객체를 생성합니다.
        File destinationFile = new File(uploadDir + uniqueFilename);

        try {
            // 5. 메모리에 있는 파일 데이터를 지정한 물리적 하드디스크 경로로 전송(저장)합니다.
            file.transferTo(destinationFile);
        } catch (IOException e) {
            // 파일 저장 중 디스크 용량 부족이나 권한 문제 등이 발생하면 런타임 예외로 처리합니다.
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.", e);
        }

        // 6. 저장이 완료되면, 클라이언트가 이 이미지를 조회할 수 있는 URL 경로를 문자열로 반환합니다.
        // WebMvcConfig에서 설정한 매핑 규칙에 따라 "/uploads/파일명" 형태로 반환합니다.
        return "/uploads/" + uniqueFilename;
    }
}