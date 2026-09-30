# Postgres 덤프(`pixie.dump`)를 다른 환경에서 쓰는 방법

이 폴더의 **`pixie.dump`** 는 PostgreSQL **커스텀 포맷** 덤프입니다. (`pg_dump` 옵션 `-Fc` 로 만든 파일이며, **`pg_restore`로만** 복원합니다. `psql`로 넣는 일반 SQL 덤프와는 다릅니다.)

---

## 1. 미리 알아두면 좋은 것

| 항목 | 이 프로젝트(docker-compose) 기준 |
|------|----------------------------------|
| DB 이름 | `pixie` |
| DB 사용자 | `postgres` |
| 기본 비밀번호(예시) | `docker-compose.yml`에 정의된 값과 동일해야 함 |
| 컨테이너 이름(예시) | `pixie-postgres` |

- **PostgreSQL 버전**: 가능하면 덤프를 뗀 버전과 비슷한 서버에 복원하는 것이 안전합니다. 이 저장소는 **Postgres 18** 이미지를 씁니다.
- **민감 정보**: 덤프 안에는 실제 데이터(사용자, 로그 등)가 들어갈 수 있습니다. **공개 저장소에 올리거나 메일로 보낼 때는 주의**하세요.

---

## 2. 이 프로젝트 Docker 스택이 이미 떠 있는 경우 (가장 흔한 경우)

프로젝트 루트(`fixie/`)에서 Postgres만 먼저 띄웠거나, 전체 `docker compose up` 후 **`pixie-postgres`** 컨테이너가 있는 상태라고 가정합니다.

### 2-1. 덤프 파일을 컨테이너로 복사

PowerShell 예시(프로젝트 루트에서):

```powershell
docker cp .\dump\pixie.dump pixie-postgres:/tmp/pixie.dump
```

### 2-2. 복원 실행

**빈 DB에 넣기만 할 때** (같은 이름 DB가 비어 있거나 새로 만든 경우):

```powershell
docker exec pixie-postgres pg_restore -U postgres -d pixie -v /tmp/pixie.dump
```

**기존 `pixie` DB를 비우고 덤프 내용으로 맞추고 싶을 때** (주의: 기존 테이블·데이터가 삭제·덮어쓰기될 수 있음):

```powershell
docker exec pixie-postgres pg_restore -U postgres -d pixie --clean --if-exists -v /tmp/pixie.dump
```

- `-v` : 진행 로그를 조금 더 자세히 봅니다. 처음 할 때 추천합니다.
- 오류 메시지에 `already exists` 가 많이 나오면, 보통은 **이미 객체가 있어서**입니다. 그때는 **새 DB를 만들어 그쪽으로 복원**하는 방법(아래 3절)이 더 깔끔합니다.

### 2-3. 임시 파일 정리(선택)

```powershell
docker exec pixie-postgres rm /tmp/pixie.dump
```

---

## 3. “새 데이터베이스”를 만들어 거기로만 복원하고 싶을 때

기존 `pixie`를 건드리지 않고 **`pixie_from_dump`** 같은 이름으로 받고 싶다면:

```powershell
docker exec pixie-postgres psql -U postgres -c "CREATE DATABASE pixie_from_dump;"
docker cp .\dump\pixie.dump pixie-postgres:/tmp/pixie.dump
docker exec pixie-postgres pg_restore -U postgres -d pixie_from_dump -v /tmp/pixie.dump
```

애플리케이션(Spring 등)이 **`pixie` 이름만** 본다면, 연결 URL의 DB 이름을 바꾸거나, 나중에 DB 이름을 바꾸는 작업이 필요합니다. **로컬에서 데이터만 확인**할 목적이면 이 방식이 안전합니다.

---

## 4. Docker만 있고, 이 compose가 아닌 “남의 Postgres 컨테이너”에 넣을 때

1. Postgres 컨테이너 이름(또는 ID)을 확인합니다. (`docker ps`)
2. 그 컨테이너 안에 **복원할 DB**가 있어야 합니다. 없으면 컨테이너 안에서 `createdb` 또는 `psql`로 DB를 만듭니다.
3. `docker cp` 로 덤프를 컨테이너의 `/tmp/` 등에 넣은 뒤, **`pg_restore -U <사용자> -d <DB이름> /tmp/pixie.dump`** 를 실행합니다.

사용자·DB 이름·비밀번호는 **그 환경의 설정**을 따릅니다.

---

## 5. PC에 PostgreSQL을 직접 설치한 경우 (Docker 없음)

1. `pg_restore` 가 PATH에 있는지 확인합니다. (PostgreSQL 설치 시 함께 설치됨)
2. 복원할 DB를 만듭니다. 예:

   ```bash
   createdb -U postgres pixie
   ```

3. 덤프 파일 경로를 지정해 복원합니다.

   ```bash
   pg_restore -U postgres -d pixie -v C:\경로\pixie.dump
   ```

Windows에서는 **명령 프롬프트/PowerShell**에서 위와 같이 전체 경로를 넣으면 됩니다.

---

## 6. 자주 나오는 상황 정리

- **`pg_restore: error: input file does not appear to be a valid archive`**  
  → 파일이 손상되었거나, **커스텀 포맷이 아닌 다른 형식**입니다. `pixie.dump`가 맞는지 확인하세요.

- **권한/비밀번호 오류**  
  → `-U` 사용자와 실제 서버 설정, `pg_hba.conf` 등이 맞는지 확인하세요. Docker라면 `POSTGRES_PASSWORD` 와 일치하는지 봅니다.

- **복원은 됐는데 앱이 안 붙는다**  
  → 호스트·포트·DB 이름·Spring의 `DB_URL` 등 **연결 문자열**이 새 환경과 같은지 확인하세요.

---

## 7. 덤프를 다시 만드는 방법 (참고)

이 프로젝트의 Postgres 컨테이너(`pixie-postgres`)가 떠 있을 때, 커스텀 포맷으로 다시 뜨는 예시는 다음과 같습니다.

```powershell
docker exec pixie-postgres pg_dump -U postgres -d pixie -Fc -f /tmp/pixie.dump
docker cp pixie-postgres:/tmp/pixie.dump .\dump\pixie_new.dump
```

더 자세한 스택 설명은 저장소의 [`docs/docker-stack.md`](../docs/docker-stack.md) 를 참고하면 됩니다.
