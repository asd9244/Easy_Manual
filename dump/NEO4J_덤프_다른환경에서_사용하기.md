# Neo4j 덤프(`neo4j.dump`)를 다른 환경에서 쓰는 방법

이 폴더의 **`neo4j.dump`** 는 Neo4j **공식 관리 도구**로 만든 **아카이브 한 개**입니다. PostgreSQL의 `pg_dump` 파일과 **호환되지 않으며**, 반드시 **`neo4j-admin database load`** 로 복원합니다.

---

## 1. Postgres 덤프와 뭐가 다른가요?

| 구분 | Postgres (`pixie.dump`) | Neo4j (`neo4j.dump`) |
|------|-------------------------|----------------------|
| 도구 | `pg_dump` / `pg_restore` | `neo4j-admin database dump` / `load` |
| 서버 실행 중 덤프 | 보통 가능 | **불가** — DB가 **실행 중인 Neo4j에 마운트된 상태**면 덤프할 수 없음 |
| 복원 시 | DB 이름·파일 경로 위주 | **덤프 파일이 들어 있는 “폴더”** 경로(`--from-path`)를 지정 |
| 파일 크기 | 데이터량과 비슷한 편 | 스토어가 희소(sparse)하면 **아주 작게** 나올 수 있음(정상일 수 있음) |

즉, Neo4j는 “한 번에 파일만 복사해서 끝”보다 **잠깐 서버를 멈추고**, **볼륨과 경로**를 맞추는 단계가 더 중요합니다.

---

## 2. 이 프로젝트(docker-compose)에서 쓰는 값

| 항목 | 값(예시) |
|------|----------|
| 그래프 DB 이름 | `neo4j` (Neo4j 기본 DB 이름) |
| 컨테이너 이름 | `pixie-neo4j` |
| 데이터 볼륨 | Compose 프로젝트에 따라 이름이 달라질 수 있음 → **아래 3절에서 확인 방법** |
| 브라우저 UI / Bolt | `7474` / `7687` (`docker-compose.yml` 참고) |
| 초기 계정(예시) | `NEO4J_AUTH` — `docker-compose.yml`의 `neo4j/비밀번호` |

**민감 정보:** 그래프 안에 서비스·사용자 관련 데이터가 들어갈 수 있습니다. **GitHub 등 공개 저장소에는 올리지 마세요.** (저장소 `.gitignore`에 `dump/neo4j.dump` 가 포함되어 있습니다.)

---

## 3. 데이터 볼륨 이름 확인하기 (중요)

덤프·복원은 **`pixie-neo4j`가 쓰는 Docker 볼륨**과 같은 볼륨을 써야 합니다. PC마다 Compose 프로젝트 폴더 이름이 다르면 볼륨 이름도 달라질 수 있습니다.

PowerShell (출력에서 **Destination이 `/data`인 줄의 Name**이 볼륨 이름입니다):

```powershell
docker inspect pixie-neo4j --format '{{range .Mounts}}{{println .Name .Destination}}{{end}}'
```

출력 예: `fixie_neo4j_data /data`  

이후 예시에서는 이 이름을 **`NEO4J_VOLUME`** 이라고 부릅니다. (본인 환경에 맞게 바꾸세요.)

---

## 4. 덤프 새로 뜨기 (이미 `neo4j.dump`가 있어도 갱신할 때)

### 4-1. 왜 Neo4j를 멈춰야 하나요?

Neo4j는 **실행 중인 서버에 연결된 DB**는 덤프할 수 없습니다. 그래서 **`pixie-neo4j` 컨테이너를 잠시 중지**합니다. (그동안 Neo4j를 쓰는 앱은 연결 실패가 날 수 있습니다.)

### 4-2. 절차 (권장: `docker cp`로 호스트에 저장)

프로젝트 루트에서:

```powershell
# 1) Neo4j 중지
docker stop pixie-neo4j

# 2) 일회용 컨테이너로 덤프 (데이터 볼륨만 마운트)
docker run --name neo4j-dump-once -v NEO4J_VOLUME:/data neo4j:5 neo4j-admin database dump neo4j --to-path=/tmp --overwrite-destination=true --verbose

# 3) 호스트의 dump 폴더로 복사 (Windows에서 바인드 마운트 이슈를 피하려면 이 방식이 안전합니다)
docker cp neo4j-dump-once:/tmp/neo4j.dump .\dump\neo4j.dump

# 4) 일회용 컨테이너 삭제
docker rm neo4j-dump-once

# 5) Neo4j 다시 시작
docker start pixie-neo4j
```

`NEO4J_VOLUME` 은 3절에서 확인한 볼륨 이름으로 바꿉니다.

**파일이 생각보다 작은 경우:** Neo4j는 디스크에 큰 영역을 미리 잡아 둔 뒤 실제 데이터만 쓰는 경우가 많아, 덤프 아카이브는 **압축되어 수 KB~수십 MB**로 나올 수 있습니다. “용량이 작다”만으로 실패한 것은 아닙니다.

### 4-3. 덤프 내용만 확인하고 싶을 때 (복원 없음)

```powershell
docker run --rm -v "${PWD}/dump:/import" neo4j:5 neo4j-admin database load neo4j --from-path=/import --info
```

`dump` 폴더 안에 **`neo4j.dump` 파일**이 있어야 합니다. (`--from-path`는 **파일이 아니라 폴더**입니다.)

---

## 5. 다른 PC / 새 Docker 환경에서 복원하기

전제: **Neo4j 5.x** 계열 이미지를 사용하는 것이 안전합니다. 이 저장소는 `neo4j:5` 를 씁니다.

### 5-1. 준비

1. `neo4j.dump` 를 복사해 둡니다 (예: 프로젝트의 `dump` 폴더).
2. 복원 대상이 **기존 `pixie-neo4j`와 같은 볼륨**이면, 역시 **Neo4j가 그 볼륨을 쓰며 떠 있으면 안 됩니다.**

```powershell
docker stop pixie-neo4j
```

### 5-2. 복원 (`database load`)

`--from-path` 에는 **`neo4j.dump`가 들어 있는 디렉터리**를 넘깁니다.

PowerShell (프로젝트 루트에서):

```powershell
docker run --rm -v NEO4J_VOLUME:/data -v "${PWD}/dump:/import" neo4j:5 neo4j-admin database load neo4j --from-path=/import --overwrite-destination=true --verbose
```

- **`--overwrite-destination=true`**: 이미 `neo4j` DB 데이터가 있으면 **덮어씁니다.** 실수 방지를 위해 운영 데이터가 있는 볼륨에서는 신중히 사용하세요.
- 끝난 뒤:

```powershell
docker start pixie-neo4j
```

### 5-3. “완전히 새 볼륨”에만 넣고 싶을 때

1. `docker-compose.yml`에서 Neo4j 볼륨을 새 이름으로 바꾸거나, 기존 볼륨을 쓰지 않는 새 스택을 띄웁니다.
2. 위 `database load` 에서 `-v 새볼륨:/data` 로 연결한 뒤 한 번만 로드합니다.

---

## 6. 자주 막히는 메시지

- **`It is not possible to dump a database that is mounted in a running Neo4j server`**  
  → Neo4j 컨테이너가 **실행 중**입니다. `docker stop pixie-neo4j` 후 다시 덤프하세요.

- **`It is not possible to replace a database that is mounted in a running Neo4j server`** (복원 시)  
  → 마찬가지로 **먼저 중지**한 뒤 `database load` 를 실행하세요.

- **`--from-path` 를 파일 경로로 줬더니 실패**  
  → `--from-path`는 **디렉터리**입니다. 그 안에 `neo4j.dump` 가 있어야 합니다.

---

## 7. 더 읽을 거리

- 스택 전체(포트, 의존 서비스): [`docs/docker-stack.md`](../docs/docker-stack.md)
- Postgres 덤프: [`POSTGRES_덤프_다른환경에서_사용하기.md`](POSTGRES_덤프_다른환경에서_사용하기.md)
