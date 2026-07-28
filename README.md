## 🛠️ Tech Stack

### 🧩 Backend
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)

### 🗄️ Database
![AWS RDS](https://img.shields.io/badge/AWS%20RDS-527FFF?style=flat&logo=amazon-rds&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Meilisearch](https://img.shields.io/badge/Meilisearch-FF5CAA?style=flat&logo=meilisearch&logoColor=white)

### 🔔 Notification
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

### ☁️ Infrastructure / DevOps
![AWS EC2](https://img.shields.io/badge/AWS%20EC2-FF9900?style=flat&logo=amazon-ec2&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-FF9900?style=flat&logo=aws-lambda&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white)
![Amazon EventBridge](https://img.shields.io/badge/Amazon%20EventBridge-FF4F8B?style=flat&logo=amazon-eventbridge&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat&logo=github-actions&logoColor=white)

### 🧪 Testing
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)
![k6](https://img.shields.io/badge/k6-7D64FF?style=flat&logo=k6&logoColor=white)

### 📊 Monitoring
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-F5A623?style=flat&logo=grafana&logoColor=white)
![Tempo](https://img.shields.io/badge/Tempo-6C63FF?style=flat&logo=grafana&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=flat&logo=opentelemetry&logoColor=white)



## **⚙️ Initial settings**

1. 저장소 클론
   ```
   git clone
   ```
2. 패키지 설치
   ```
   npm install
   ```
3. `.env` 파일 생성 및 환경 변수 설정
4. 개발 서버 실행
   ```
   npm run start:dev
   ```

## **💻 Coding Convention**

### 🔀 Git Flow
1. Issue 생성
2. Issue 기준으로 Branch 생성
3. 개발 진행
   → add → commit → push
4. Pull Request 생성
5. 팀원 Code Review 진행
6. Review 완료 후 Merge

### 🏷 Type & Emoji Convention
```
✨ feat: 새로운 기능 추가 (API, 비즈니스 로직, UI 기능)
🐛 fix: 버그 수정
📝 docs: 문서 추가 / 수정 / 삭제
♻️ refactor: 코드 리팩토링 (기능 변화 없음)
🎨 style: 코드 스타일 수정 (포맷, 세미콜론 등 / 로직 변경 없음)
🔧 chore: 빌드 설정, 패키지 매니저 등 기타 작업
🔥 remove: 파일 또는 코드 삭제
🚀 deploy: 운영 서버 배포 설정 변경
```

### 🌿 Branch Naming Convention
> 형식  
  `{type}/#{이슈번호}-기능설명`

  ```
  feat/#123-user-login-api
  ```

### 💬 Commit Message Convention
> 형식 
  `{깃모지} {type}: 기능설명`

  ```
  ✨ feat: 로그인 api 구현
  🐛 fix: 토큰 만료 오류 수정
  ```

### 📝 Issue Title Convention
> 형식  
  `{깃모지} {Type}: 기능설명`

  ```
  🎉 Init: Prisma 모델 정의
  🐛 Fix: 로그인 시 토큰 오류
  ```

### 🔃 Pull Request Title Convention
> 형식  
  `{깃모지} {Type}: #{이슈번호} 기능 설명`

  ```
  🎉 Init: #1 Prisma 모델 정의
  ✨ Feat: #5 OpenAPI 통해 공연 데이터 수집
  ```

## **🚀 Deploy**

### 브랜치 전략

| 브랜치 | 설명 | 서버 | API 버전 | 포트 |
|--------|------|------|----------|------|
| `main` | 운영 서버 배포 | prod EC2 | v5 | 4000 |
| `develop` | 개발 서버 배포 | dev EC2 | v5 | 4000 |
| `legacy` | 구버전 운영 유지 | prod EC2 | v4 | 3000 |

### Nginx 라우팅

```
/api/v4/  →  port 3000 (legacy)
/api/v5/  →  port 4000 (main)
/auth/    →  port 4000 (main)
```

### 버전 전환 패턴

```
v6 완성 시: main → legacy 머지, develop → main 머지
```



