# Realtime Event Monitoring Platform (Backend)

IoT / 스마트 안전관리 환경에서 발생하는 이벤트(센서 데이터, 알람 등)를 수집·저장하고,  
**Redis Pub/Sub + WebSocket**을 이용해 실시간으로 브로드캐스트하는 백엔드 프로젝트입니다.

최근 이벤트는 **Redis List 캐시**를 활용해 조회 성능을 개선했고,  
**Docker Compose 한 방 실행**으로 로컬/면접 환경에서 즉시 재현 가능하도록 구성했습니다.

---

## Tech Stack

- **Language**: Node.js, TypeScript
- **Framework**: Express
- **Database**: MySQL 8 (Docker)
- **Cache / Message Broker**: Redis 7 (Docker)
  - List Cache: `events:recent`
  - Pub/Sub Channel: `events:new`
- **Realtime**: WebSocket (`/ws`)
- **Infra / Ops**: Docker Compose

---

## Features

### 1) 이벤트 수집
- `POST /api/events`
- Zod 기반 요청 데이터 검증
- MySQL에 이벤트 영속 저장

### 2) 이벤트 조회
- `GET /api/events?page=&size=&type=&level=`
- 페이지네이션 및 필터(type, level) 지원
- 최신 이벤트 기준 정렬

### 3) 최근 이벤트 캐시
- 조건: `page=1`, `size<=50`, 필터 없음
- Redis List(`events:recent`)에서 우선 조회
- DB 부하 감소 및 응답 속도 개선

### 4) 실시간 이벤트 브로드캐스트
- 이벤트 생성 시 Redis Pub/Sub(`events:new`)으로 publish
- WebSocket(`/ws`)으로 연결된 클라이언트에 실시간 전달

---

## API Usage

### Health Check
```bash
curl http://localhost:3000/api/health
```
## Response
```bash
{ "ok": true }
```

---

## Create Event
```bash
curl -X POST "http://localhost:3000/api/events" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "sensor-1",
    "type": "GAS",
    "level": "WARN",
    "payload": { "ppm": 120 }
  }'
```

```bash
{
  "id": 1,
  "requestId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

## List Events
```bash
curl "http://localhost:3000/api/events?page=1&size=5"
curl "http://localhost:3000/api/events?page=1&size=10&type=GAS&level=WARN"
```

---

## WebSocket Realtime
- Endpoint: `ws://localhost:3000/ws`
### Chrome DevTools Console:
```bash
const ws = new WebSocket("ws://localhost:3000/ws");
ws.onmessage = (e) => console.log("WS:", e.data);
```
`post/api/events` 호출 시 실시간 이벤트 메시지를 수신합니다.

---

## Run with Docker Compose (One Command)

### Prerequisites
- Docker Desktop installed

### Setup & Run
프로젝트 루트에서 실행
```bash
docker compose up -d --build
docker compose ps
```

### Service Ports
- API / WebSocket: `http://localhost:3000`
- MySQL: `localhost:3307`
- Redis: `localhost:6379`

## Verify
```bash
curl http://localhost:3000/api/health
```

---

## Stop & Clean
```bash
docker compose down
```

### DB 볼륨까지 완전 삭제
```bash
docker compose down -v
```

---

## Project Structure

```bash
server/
 └─ src/
    ├─ app.ts
    ├─ index.ts
    ├─ config/
    │  ├─ env.ts
    │  ├─ mysql.ts
    │  └─ redis.ts
    ├─ middlewares/
    │  ├─ requestId.ts
    │  ├─ errorHandler.ts
    │  └─ notFound.ts
    ├─ modules/
    │  ├─ health/
    │  └─ events/
    │     ├─ events.controller.ts
    │     ├─ events.service.ts
    │     ├─ events.routes.ts
    │     ├─ events.repo.ts
    │     └─ events.schema.ts
    └─ realtime/
       ├─ wsServer.ts
       └─ realtimeBridge.ts
```

---

## Architecture Flow

- Client → `POST /api/events`
- API 서버가 요청 검증 후 MySQL에 이벤트 저장
- Redis에
  - `LPUSH events:recent` (최근 이벤트 캐시)
  - `PUBLISH events:new` (실시간 채널)
- Realtime Bridge가 Redis Pub/Sub 구독
- WebSocket 서버를 통해 연결된 클라이언트에 실시간 전송

---

## Portfolio Highlights

- Express 기반 Controller / Service / Repository 구조 설계
- Zod를 활용한 요청 데이터 검증
- MySQL Pagination & Filter Query 구현
- Redis Cache + Pub/Sub을 활용한 성능 최적화 및 실시간 처리
- Docker Compose 기반 재현 가능한 실행 환경 구성

---

## Troubleshooting Notes

- Windows 환경에서는 `cp` 대신 `copy` 명령어 사용
- Docker 컨테이너 간 통신 시 `localhost`가 아니라 서비스명(`mysql`, `redis`) 사용
- 포트 충돌(3000, 3307) 발생 시 기존 로컬 서버/컨테이너 종료 필요
