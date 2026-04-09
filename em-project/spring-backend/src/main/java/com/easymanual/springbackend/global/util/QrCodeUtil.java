package com.easymanual.springbackend.global.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;
import java.util.UUID;

@Component
public class QrCodeUtil {

    // QR 코드가 물리적으로 저장될 서버 내의 폴더 경로를 지정합니다.
    // 기존 이미지 업로드 폴더 내부에 'qr' 폴더를 분리하여 관리합니다.
    private final String qrUploadDir = "uploads/qr/";

    public String generateAndSaveQrCode(String content) {
        // 1. 저장할 폴더가 서버에 존재하지 않는다면 자동으로 생성(mkdir)합니다.
        File directory = new File(qrUploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // 2. 파일명 중복 방지를 위해 UUID를 사용하여 고유한 파일명을 생성합니다.
        String uniqueFilename = "qr_" + UUID.randomUUID().toString() + ".png";
        String filePath = qrUploadDir + uniqueFilename;

        try {
            // 3. ZXing 라이브러리의 QRCodeWriter를 사용하여 입력받은 문자열(content)을
            // 200x200 픽셀 크기의 QR 코드 비트 매트릭스(BitMatrix)로 변환합니다.
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, 200, 200);

            // 4. 생성된 비트 매트릭스를 실제 PNG 이미지 파일로 하드디스크에 저장(Write)합니다.
            Path path = new File(filePath).toPath();
            MatrixToImageWriter.writeToPath(bitMatrix, "PNG", path);

            // 5. 프론트엔드가 이 QR 이미지에 접근할 수 있는 URL 경로를 반환합니다.
            // (WebMvcConfig의 정적 리소스 매핑 규칙에 따라 "/uploads/qr/파일명" 형태로 반환)
            return "/uploads/qr/" + uniqueFilename;

        } catch (Exception e) {
            // QR 생성 또는 파일 저장 중 오류가 발생하면 런타임 예외로 처리합니다.
            throw new RuntimeException("QR 코드 생성 및 저장 중 오류가 발생했습니다.", e);
        }
    }
}