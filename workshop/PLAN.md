# SMUS 워크샵 계획서 (삼성전자 고객 대상)

## 1. 개요
- **형식**: 하루 / 오프라인 / 핸즈온
- **대상**: 삼성전자 개발자 (SMUS·AWS 초심자 포함, 난이도 중)
- **목표**: 참석자가 SMUS(SageMaker Unified Studio)를 실제 업무에서 더 잘 활용하게 만든다
- **핵심 메시지**: "SMUS는 **데이터/환경(Space)** 을 제공하고, 실제 ML·Agent 개발은 **로컬 VSCode + AI 코딩 도구(Kiro CLI/Claude Code)** 로 코드를 직접 짠다"

> ⚠️ **중요 원칙**: ML 모델과 Agent는 SMUS의 빌트인 기능(SageMaker AutoML, Bedrock IDE 등)을 쓰지 **않는다**.
> SMUS에서는 **데이터만 가져오고**, 그 이후 모든 개발은 VSCode에서 AI 코딩 도구와 함께 **직접 코드로** 진행한다.
> SMUS Space는 데이터에 가까운 곳에 있는 **개발/실행 컴퓨트 환경** 역할만 한다.

> 🔗 **Module 연결**: Module 2(곤수님)는 **재실 감지(occupancy) ML 분류** 모델을 만든다.
> ([github.com/gonsoomoon-ml/ml-classification-with-agentic-coding](https://github.com/gonsoomoon-ml/ml-classification-with-agentic-coding))
> - **Module 1**: 데이터에 무관하게(data-agnostic) 절차/구조 완성.
> - **Module 3**: 이 occupancy 모델을 `get_occupancy` tool로 호출(SageMaker 엔드포인트). 엔드포인트가 없으면 Mock 폴백.

## 2. 전체 흐름 (End-to-End 스토리)
```
[Module 1] 데이터를 SMUS에 올린다 (간단)
      ↓
[Module 1] Space 생성 + 로컬 VSCode/Kiro 연동 (여기서부터 무대는 VSCode)
      ↓
[Module 2] VSCode에서 데이터를 읽어와 코드로 ML 모델을 만든다 (AI 코딩 도구와 함께)
      ↓
[Module 3] VSCode에서 코드로 Agentic AI Agent를 만든다 (AI 코딩 도구와 함께)
```
> Module 1 이후 작업 무대는 **VSCode**. SMUS UI로 돌아가는 건 데이터 접근 정도.

## 3. 담당 분배
| 모듈 | 담당 | 비고 |
|------|------|------|
| Module 1: 셋업 + 데이터 + Space + IDE 연동 | **나 (SA)** | 약 2h |
| Module 2: ML 모델 | **곤수님** | 약 2.5h |
| Module 3: Agentic AI Agent | **나 (SA)** | 약 3h |

> 내 분량 합계 ≈ **5시간** (Module 1 + Module 3)

## 4. 타임테이블 (예시)
| 시간 | 모듈 | 담당 |
|------|------|------|
| 09:00–09:30 | Welcome & SMUS 개요 | 공통 |
| 09:30–11:30 | **Module 1**: SMUS 셋업 → 데이터 업로드 → Space 생성 → 로컬 Kiro/VSCode 연동 | **나** |
| 11:30–12:30 | 점심 | - |
| 12:30–15:00 | **Module 2**: 데이터로 ML 모델 만들기 | 곤수님 |
| 15:00–15:15 | 휴식 | - |
| 15:15–18:00 | **Module 3**: Agentic AI Agent 만들기 | **나** |

## 5. 사전 준비 (참석자/운영)
- **운영 확인 필요**:
  - [ ] SMUS 도메인(IAM Identity Center 기반) 사전 생성 — 로컬 IDE 연동은 Identity Center 도메인에서만 지원
  - [ ] Project Profile에서 Remote Access 가능하도록 네트워크 구성 (PublicInternetOnly 또는 NAT)
  - [ ] 참석자별 계정/권한, Bedrock 모델 액세스 사전 활성화
  - [ ] 실습 데이터셋 확정 (ML + Agent 시나리오를 관통하는 단일 데이터)
- **참석자 로컬 사전 설치**:
  - [ ] VS Code + AWS Toolkit + Remote - SSH 확장
  - [ ] Kiro CLI (또는 Claude Code)
  - [ ] AWS CLI

## 6. 내 담당 상세 — Module 1 (셋업, ~2h)
> 목표: "SMUS는 처음이지만, 데이터 올리고 내 로컬 IDE까지 연결된다"를 모두가 성공
> 📌 **data-agnostic**: 데이터 종류와 무관하게 절차/구조를 완성. 실제 데이터셋은 나중에 **파일만 교체**하면 되도록 구성.
1. SMUS 빠른 둘러보기 (포털, Project 개념) — 최대한 간단히
2. 데이터 업로드 (S3/Lakehouse 카탈로그 등록) — 클릭 위주, 복잡한 설정 배제. **샘플 데이터(placeholder)로 절차 완성 → 추후 실제 데이터로 교체**
3. Space 생성 (Remote Access **Enabled**)
4. "Open in Kiro / VS Code" 로 로컬 IDE 연동 + 로그인(도메인 URL)
5. 연결 검증 (Space 안에서 데이터 읽기 확인) → Module 2로 핸드오프

## 7. 내 담당 상세 — Module 3 (Agentic AI Agent, ~3h)
> 목표: 데이터/ML 산출물을 활용하는 **펫케어 불안 케어 에이전트**를
> **VSCode에서 코드로** 제작 → **AgentCore Runtime**에 배포 → **WebUI**로 시연
>
> **스택**: Strands Agents(에이전트 코드) → Amazon Bedrock AgentCore Runtime(배포/실행) → 간단한 WebUI(시연)
> LLM은 Bedrock 모델(Converse) 호출.
> ⚠️ **Amazon Bedrock의 매니지드 "Agents" 기능을 쓰는 게 아님.** 에이전트 로직은 Strands 코드로 직접 작성.

### 시나리오: 스마트싱스 펫케어 — 강아지 불안 케어
```
[신호 수집] 재실 여부 + 디바이스 상태(짖음/움직임/소음 등)
      ↓
[판단] ML 모델(Mock)로 "강아지 불안도" 예측   ← 추후 실제 모델로 교체
      ↓
[추론] 주인 외출 中 AND 불안도 높음 → 무엇을 할까? (LLM이 결정)
      ↓
[행동] TV로 진정 음악 재생
```

### 에이전트 Tool
| Tool | 역할 | 비고 |
|------|------|------|
| `get_occupancy()` | 주인 재실 여부 | **Module 2 occupancy ML 엔드포인트 호출** (없으면 Mock 폴백) |
| `get_device_states()` | 짖음/움직임/소음 등 센서값 | mock |
| `predict_anxiety(features)` | 불안도 예측 | mock |
| `play_music_on_tv(playlist)` | 진정 음악 재생 | mock (행동) |

> ⚠️ 실제 SmartThings API(OAuth/디바이스 디스커버리)는 시간/핵심 모두 아니므로 **Mock 함수**로 처리.
> 🔗 `get_occupancy`는 Module 2의 재실감지 모델(가전 전력 → occupancy)과 연결. 14개 feature는 Mock으로 생성해 `{"buffer":[record]}`로 엔드포인트 호출, `SM_ENDPOINT_NAME` 없으면 전력 기반 Mock 규칙 폴백.

### 진행 단계
1. Agentic AI 개념 + 아키텍처 (LLM + tool use, Strands 구조) — 짧게
2. VSCode에서 Strands로 에이전트 + 4개 tool 코드 작성 (AI 코딩 도구와 함께, 핸즈온 핵심)
3. 로컬 실행/테스트 (시나리오: 외출+불안↑ → 음악 재생 / 재실 → 무동작)
4. AgentCore Runtime에 배포 (`agentcore` CLI / starter toolkit)
5. 간단한 WebUI 연결 (`InvokeAgentRuntime` 호출) + 시연
6. 마무리: 실제 업무 적용 아이디어, 리소스 정리(비용)

## 8. 결과물 디렉토리 구조 (제안)
```
workshop/
├── README.md              # 워크샵 개요/아젠다/사전준비
├── PLAN.md                # (본 문서)
├── module-1-setup/        # [나] SMUS 셋업 + 데이터 + Space + IDE
├── module-2-ml/           # [곤수님] ML 모델
├── module-3-agent/        # [나] Agentic AI Agent
└── 99-cleanup.md          # 리소스 정리
```

## 9. 확정 상태
**확정됨**
- ✅ Agent 시나리오: 스마트싱스 펫케어 — 강아지 불안 케어 (외출+불안↑ → TV 음악)
- ✅ Agent 스택: Strands Agents → AG-UI → CopilotKit → AgentCore Runtime (Cognito JWT 인증, 웹UI 클라우드 연결)
- ✅ AI 코딩 도구: Claude Code (Bedrock 연동) / IDE: VS Code
- ✅ 리전: us-east-1, 모델: claude-sonnet-4-5
- ✅ Module 2 = 재실감지 ML (곤수님 repo) → Module 3 `get_occupancy`가 SageMaker 엔드포인트로 호출, 없으면 Mock 폴백
- ✅ Module 1·2·3 + sample-app 모두 작성/검증 완료
