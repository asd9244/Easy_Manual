package com.easymanual.springbackend.domain.file.service;

import com.easymanual.springbackend.global.error.ErrorMessages;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class FileService {

    private final String uploadDir = "uploads/";

    public String uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException(ErrorMessages.FILE_UPLOAD_EMPTY);
        }

        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String originalFilename = file.getOriginalFilename();
        String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;

        File destinationFile = new File(uploadDir + uniqueFilename);

        try {
            file.transferTo(destinationFile);
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.", e);
        }

        return "/uploads/" + uniqueFilename;
    }
}
