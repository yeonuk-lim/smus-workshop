# SMUS 워크샵 — SageMaker Unified Studio + ML + Agentic AI

스마트싱스 펫케어를 주제로, **데이터(SMUS) → ML 모델 → AI Agent**를 하루 만에 end-to-end로 만들어보는 핸즈온 워크샵입니다.

## 한 줄 스토리
> SMUS에 데이터를 올리고 → 로컬 VS Code로 연결해 → **재실감지 ML 모델**을 만들고 →
> 그 모델을 도구로 쓰는 **펫케어 AI 에이전트**를 만들어 채팅 UI로 시연한다.

## 모듈 구성

| 모듈 | 내용 | 담당 | 시간 |
|------|------|------|------|
| **[Module 1](module-1-setup/README.md)** | SMUS 셋업 + 데이터 업로드 + Space + VS Code 연결 + Claude Code(Bedrock) | SA | ~2h |
| **[Module 2](https://github.com/gonsoomoon-ml/ml-classification-with-agentic-coding)** | 재실감지(occupancy) ML 분류 — XGBoost + SageMaker (agentic coding) | 곤수님 | ~2.5h |
| **[Module 3](module-3-agent/README.md)** | 펫케어 AI Agent — Strands + AG-UI + CopilotKit + AgentCore Runtime | SA | ~3h |

> 📍 Module 2는 곤수님 저장소로 진행합니다: https://github.com/gonsoomoon-ml/ml-classification-with-agentic-coding

## 모듈 간 연결
```
Module 1 ── 데이터/환경 ──► Module 2 ── occupancy ML 엔드포인트 ──► Module 3 (get_occupancy tool)
   (SMUS)                     (재실 예측)                            (펫케어 에이전트)
```
- Module 2의 **재실감지 모델**이 Module 3 에이전트의 `get_occupancy` 도구가 됩니다 (SageMaker 엔드포인트 호출, 없으면 Mock 폴백).

## 공통 전제
- **리전**: `us-east-1`
- **LLM**: Amazon Bedrock — `us.anthropic.claude-sonnet-4-5-20250929-v1:0`
- **IDE**: VS Code + Claude Code(Bedrock 연동)
- **인증**: AgentCore Runtime은 **Cognito(JWT)** 인증 — 웹UI(AG-UI)를 그대로 클라우드에 연결

## 타임테이블 (예시)
| 시간 | 모듈 |
|------|------|
| 09:00–09:30 | Welcome & SMUS 개요 |
| 09:30–11:30 | Module 1 (SA) |
| 11:30–12:30 | 점심 |
| 12:30–15:00 | Module 2 (곤수님) |
| 15:00–18:00 | Module 3 (SA) |

자세한 계획은 [PLAN.md](PLAN.md) 참고.
