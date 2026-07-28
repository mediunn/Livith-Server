# External API Monitoring

외부 API(LastFM / Spotify / YouTube / Kakao / Apple) 호출 모니터링의 대시보드 + 알림 설정.
P1(RED 메트릭)·P2(도메인 신호)에서 수집한 메트릭을 Grafana Cloud에서 시각화/알림한다.

## 파이프라인

```
[NestJS /metrics] ──scrape──> [Alloy (EC2)] ──remote_write──> [Grafana Cloud]
```

- `/metrics`는 Alloy가 이미 스크랩 중 → 배포만 하면 `external_api_*` / `recommendation_*` /
  `lastfm_*` / `youtube_*` / `spotify_*` 메트릭이 Grafana Cloud에 자동 유입된다(추가 배선 없음).
- 알림 엔진은 **Grafana Cloud Alerting(내장)** 을 사용한다. 별도 Alertmanager 불필요.

## 수집 메트릭

| 메트릭 | 타입 | 라벨 | 출처 |
|---|---|---|---|
| `external_api_request_total` | Counter | `api`, `method`, `status_class` | P1 axios 인터셉터 |
| `external_api_request_duration_seconds` | Histogram | `api`, `method` | P1 |
| `external_api_requests_in_flight` | Gauge | `api` | P1 |
| `recommendation_cache_total` | Counter | `cache`, `result` | P2 SWR 캐시 |
| `recommendation_coalesced_total` | Counter | `api` | P2 coalescing |
| `lastfm_rate_limit_total` | Counter | - | P2 error 29 |
| `lastfm_retry_total` | Counter | - | P2 Bottleneck retry |
| `youtube_quota_exceeded_total` | Counter | - | P2 |
| `spotify_error_total` | Counter | `kind` (token_failure/not_found) | P2 |

> 라벨 정책: `api`는 고정 enum(lastfm/spotify/youtube/kakao/apple), 라벨은 저카디널리티만.
> **URL·경로·ID 라벨 금지** (`http_request_*` 규칙 준수).

## 1. 대시보드 import

1. Grafana Cloud → **Dashboards → New → Import**
2. `grafana/external-api-dashboard.json` 업로드(또는 내용 붙여넣기)
3. `DS` 변수에서 **Prometheus 데이터소스 선택** → Import

패널 구성: ① 외부 API 개요(RPS·에러율·p95) ② LastFM 3-layer(캐시 hit ratio·결과분포·error29/retry·coalesce) ③ Quota/인증(YouTube quota·Spotify error).

## 2. 알림 룰 (Grafana-managed)

Grafana Cloud → **Alerting → Alert rules → New alert rule**.
각 룰은 `Reduce(Last) → Threshold(IS ABOVE 0)` 패턴(PromQL이 이미 임계 비교 포함).
**Labels** 에 `severity` 를 직접 추가한다(notification policy 라우팅용).

| 이름 | severity | PromQL | for |
|---|---|---|---|
| `login-api-error-rate` | **critical** | `sum(rate(external_api_request_total{api=~"kakao\|apple",status_class=~"5xx\|error"}[5m])) / clamp_min(sum(rate(external_api_request_total{api=~"kakao\|apple"}[5m])), 0.0001) > 0.1` | 5m |
| `lastfm-rate-limit` | warning | `sum(rate(lastfm_rate_limit_total[10m])) > 0` | 10m |
| `youtube-quota-exceeded` | warning | `increase(youtube_quota_exceeded_total[1h]) > 0` | 0m |
| `spotify-not-found` | warning | `increase(spotify_error_total{kind="not_found"}[1h]) > 0` | 0m |
| `spotify-token-failure` | warning | `increase(spotify_error_total{kind="token_failure"}[15m]) > 0` | 5m |

### 설계 노트
- **4xx 제외**: Kakao 401 / Apple 4xx는 유저 토큰 문제(정상 케이스)라 `status_class=~"5xx|error"`만 본다. 안 그러면 노이즈 폭발.
- **No data 동작 = `OK`(또는 Keep Last State)**: 로그인 트래픽이 없으면 분모가 0 → 오탐 방지. `clamp_min(..., 0.0001)`으로 NaN도 방지.
- `for`로 플래핑 방지. critical은 5분 지속돼야 발사.

## 3. Email 알림

### Contact point
Grafana Cloud → **Alerting → Contact points → Add contact point**
- Name: `email-livith`
- Integration: **Email** / Addresses: 받을 주소(쉼표로 여러 개)
- **Test** 버튼으로 수신 확인

> Grafana Cloud는 자체 SMTP를 제공하므로 별도 메일 서버 설정 불필요.

### Notification policy
Grafana Cloud → **Alerting → Notification policies**
- 가장 단순: Default policy의 contact point를 `email-livith`로 지정 → 모든 알림 이메일.
- (선택) severity 분리: nested policy 추가 → Matcher `severity = critical` → `email-livith`, group wait 짧게. warning은 default로.

## 향후 (선택)
- 알림 룰을 Grafana provisioning YAML로 export → 이 디렉토리에 커밋하면 알림까지 버전관리 가능.
- page(전화/즉시호출)가 필요해지면 PagerDuty/OpsGenie contact point 추가.