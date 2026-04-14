-- manuals / models 시드 (중복 시 스킵)
-- manuals: UNIQUE(manual_code) 기준 ON CONFLICT DO NOTHING
-- models: 동일 (manual_id, name) 이 이미 있으면 INSERT 생략 (NOT EXISTS)
-- 실행: psql -U postgres -d pixie -f seed_manuals_models_idempotent.sql

BEGIN;

-- ========== manuals ==========
INSERT INTO manuals (created_at, updated_at, covered_model_names, manual_code, product_type, representative_model_name, qr_code_url)
VALUES
  (NOW(), NOW(), 'SQ06EJ1WES, SQ06EJ1WAS, SQ06EJ1WCS, SQ06EJ1WAJ, SQ07EJ3WES, SQ07EJ1WBS, SQ07EJ1WCS, SQ09EJ1WAS, SQ09EJ1WES, SQ11EJ1WES, SQ06EJ1WEN', 'GMDS_MFL71890611_05_250625_00_WEB', '에어컨', '휘센 벽걸이 에어컨', NULL),
  (NOW(), NOW(), 'FX25WSQX, FX25WSQ-KW, FX25ESER, FX25GSGR, FX25ENR, FX25GNR', 'WM_KOR_MFL71792815_11_251204_00_OM_WEB', '세탁기', '엘지 트롬 세탁기', NULL),
  (NOW(), NOW(), 'S836P022, S836MQQ012, S836MRQ032, S836MEQ032, S836MTE032', 'REF_KOR_MFL71401523_00_250731_00_OM_WEB', '냉장고', '엘지 디오스 양문형 냉장고', NULL)
ON CONFLICT (manual_code) DO NOTHING;

-- ========== models (manual_code 로 manual_id 조회) ==========
INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ06EJ1WES', '/uploads/qr/qr_a449a8dd-cc0b-40fa-bb6a-0b526a5dbe9f.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ06EJ1WES');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ06EJ1WAS', '/uploads/qr/qr_7e4c62dc-3ca8-40a1-96a8-8db57a880eb3.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ06EJ1WAS');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ06EJ1WCS', '/uploads/qr/qr_e4475ce0-743d-479c-aa8e-b6c02ed847a5.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ06EJ1WCS');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ06EJ1WAJ', '/uploads/qr/qr_44372f48-00c9-4f31-9b05-31ae1441d016.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ06EJ1WAJ');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ07EJ3WES', '/uploads/qr/qr_98be1079-79e2-437e-927c-81ff2319fb2b.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ07EJ3WES');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ07EJ1WBS', '/uploads/qr/qr_25349f7b-ac88-456f-8c37-b2544ee957be.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ07EJ1WBS');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ07EJ1WCS', '/uploads/qr/qr_d546bf6b-7972-4cde-b0c9-0379067b402b.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ07EJ1WCS');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ09EJ1WAS', '/uploads/qr/qr_4f2a98b1-5165-44f2-997b-568cc85dfd4a.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ09EJ1WAS');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ09EJ1WES', '/uploads/qr/qr_9dd3e59b-79ea-4faa-884f-c064b40ac0c3.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ09EJ1WES');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ11EJ1WES', '/uploads/qr/qr_762f13fc-4e24-4fa6-8b29-d5d061198696.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ11EJ1WES');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'SQ06EJ1WEN', '/uploads/qr/qr_dfe9dc67-5569-46c8-90a2-ea87e958d145.png', m.id, '에어컨' FROM manuals m WHERE m.manual_code = 'GMDS_MFL71890611_05_250625_00_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'SQ06EJ1WEN');

-- 세탁기 WM_KOR_...
INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'FX25WSQX', '/uploads/qr/qr_9cd4b71d-2424-4fdc-8705-35b933b34ff1.png', m.id, '세탁기' FROM manuals m WHERE m.manual_code = 'WM_KOR_MFL71792815_11_251204_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'FX25WSQX');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'FX25WSQ-KW', '/uploads/qr/qr_e13ccebb-0d56-46c6-90b0-1d7d60bed890.png', m.id, '세탁기' FROM manuals m WHERE m.manual_code = 'WM_KOR_MFL71792815_11_251204_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'FX25WSQ-KW');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'FX25ESER', '/uploads/qr/qr_74dbdbfe-99fc-413a-838d-971ae69465f0.png', m.id, '세탁기' FROM manuals m WHERE m.manual_code = 'WM_KOR_MFL71792815_11_251204_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'FX25ESER');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'FX25GSGR', '/uploads/qr/qr_255dbbe1-481f-4d31-a51a-e8c41c03f509.png', m.id, '세탁기' FROM manuals m WHERE m.manual_code = 'WM_KOR_MFL71792815_11_251204_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'FX25GSGR');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'FX25ENR', '/uploads/qr/qr_ecad84cc-8c40-4ea4-b9a1-c57f1ecd232e.png', m.id, '세탁기' FROM manuals m WHERE m.manual_code = 'WM_KOR_MFL71792815_11_251204_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'FX25ENR');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'FX25GNR', '/uploads/qr/qr_4d76a64a-91b9-4b7b-8c70-d8fec601b1c2.png', m.id, '세탁기' FROM manuals m WHERE m.manual_code = 'WM_KOR_MFL71792815_11_251204_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'FX25GNR');

-- 냉장고 REF_KOR_...
INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'S836P022', '/uploads/qr/qr_c9bad778-b0d6-4b3e-bc0b-3e21b3d9000f.png', m.id, '냉장고' FROM manuals m WHERE m.manual_code = 'REF_KOR_MFL71401523_00_250731_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'S836P022');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'S836MQQ012', '/uploads/qr/qr_36eee04a-7ec3-493b-bfba-8c2c5c54cf0a.png', m.id, '냉장고' FROM manuals m WHERE m.manual_code = 'REF_KOR_MFL71401523_00_250731_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'S836MQQ012');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'S836MRQ032', '/uploads/qr/qr_e9938ffd-0906-4981-88cd-35233ca676b4.png', m.id, '냉장고' FROM manuals m WHERE m.manual_code = 'REF_KOR_MFL71401523_00_250731_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'S836MRQ032');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'S836MEQ032', '/uploads/qr/qr_c83b3589-05b2-44e7-ae6c-ad97f9000b14.png', m.id, '냉장고' FROM manuals m WHERE m.manual_code = 'REF_KOR_MFL71401523_00_250731_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'S836MEQ032');

INSERT INTO models (name, qr_code_url, manual_id, product_type)
SELECT 'S836MTE032', '/uploads/qr/qr_aae5d05e-3603-4371-bd57-0cb90648c149.png', m.id, '냉장고' FROM manuals m WHERE m.manual_code = 'REF_KOR_MFL71401523_00_250731_00_OM_WEB'
AND NOT EXISTS (SELECT 1 FROM models x WHERE x.manual_id = m.id AND x.name = 'S836MTE032');

COMMIT;
