# Module 3: Agentic AI Agent 만들기 (Strands + AG-UI + CopilotKit + AgentCore)

> ⏱️ 약 3시간 | 👤 난이도: 중급 (Python 기본 가능하면 OK)
>
> **이 모듈에서 만드는 것**
> 1. **Strands Agents**로 펫케어 에이전트를 코드로 작성 (도구 4개)
> 2. **CopilotKit 채팅 UI**(웹)에 연결해서 로컬에서 대화
> 3. **Amazon Bedrock AgentCore Runtime**에 배포 (IAM 인증, Cognito 없음)
>
> 끝나면: "신호를 종합해 스스로 판단·행동하는 에이전트"를 직접 만들고, 웹 UI로 대화하고, 클라우드에 올려본 상태가 됩니다.

> 🧭 **진행 방식**
> - 에이전트(Strands) 코드는 **복사-붙여넣기로 직접** 작성합니다 (핵심 학습).
> - 프론트엔드(CopilotKit)는 **제공된 GitHub 저장소를 clone**해서 그대로 씁니다 (양이 많고 핵심이 아님).
> - 목표는 엔터프라이즈 코드가 아니라 **Strands·AG-UI·AgentCore의 동작 원리 이해**입니다.

---

## 0. 우리가 만들 것 (시나리오)

**스마트싱스 펫케어 — 강아지 불안 케어 에이전트**

```
[재실 예측]  가전 전력 → 재실감지 ML 모델로 주인 재실 여부 예측  ← Module 2 모델
      ↓
[신호 수집]  강아지 디바이스 상태(짖음/움직임/소음)
      ↓
[판단]      "강아지 불안도" 예측
      ↓
[추론]      주인이 외출했고 불안도가 높으면? → 무엇을 할지 LLM이 결정
      ↓
[행동]      TV로 진정 음악 재생
```

### 핵심 개념
- 우리는 LLM에게 **도구(tool)** 만 쥐여주고, "언제 무엇을 쓸지"는 **에이전트가 스스로** 정합니다.
- 여러 신호를 LLM이 **종합 판단**하고, 행동을 **선택**하고, 이유를 **설명**합니다.

> ⚠️ 우리가 쓰는 건 **Strands Agents(오픈소스 프레임워크)** 입니다. Amazon Bedrock의 매니지드 "Agents" 기능이 아닙니다. LLM 추론만 Bedrock 모델을 씁니다.
>
> 🔗 **Module 2 연결**: `get_occupancy`는 Module 2의 **재실감지 ML 모델**(가전 전력 → 재실 여부)을 SageMaker 엔드포인트로 호출합니다. 엔드포인트가 없으면 Mock 폴백으로 동작합니다. 강아지 디바이스 신호와 불안도 예측은 Mock입니다.

### 전체 구조
```
[브라우저] CopilotKit 채팅 UI
      │  (인증 없음)
      ▼
[Next.js route.ts]  ──AG-UI 프로토콜──►  [Strands 에이전트 (FastAPI)]
                                              │
                                              ▼
                                         Bedrock 모델(LLM) + 도구 4개
```

---

## 1. 환경 준비

> Module 1에서 연결한 **VS Code(= SMUS Space에 연결된 창)** 의 터미널에서 진행합니다.

### 1.1 제공된 프로젝트 clone

```bash
git clone https://github.com/yeonuk-lim/smus-petcare-agent.git
cd smus-petcare-agent
```

구조:
```
smus-petcare-agent/
├── agent/        # Strands 에이전트 백엔드 (← 이번 모듈에서 직접 작성해볼 부분)
│   ├── main.py
│   └── requirements.txt
└── frontend/     # CopilotKit 채팅 UI (그대로 사용)
```

### 1.2 Bedrock 모델 액세스 확인
- Module 1에서 도메인 생성 시 **Grant model access**로 Bedrock 모델 접근을 허용했어야 합니다.
- 안 했다면 AWS 콘솔 → Bedrock → **Model access**에서 사용할 모델(Claude)을 활성화하세요.

> ⚠️ **리전 주의**: 이 워크샵은 `us-east-1`에서 Claude Sonnet 모델을 사용합니다. 리전마다 모델 접근이 다릅니다.

---

## 2. 에이전트 코드 이해하기 (`agent/main.py`)

`agent/main.py`를 열어 한 부분씩 봅니다. (clone한 코드에 이미 들어 있습니다 — 직접 타이핑해보고 싶으면 빈 파일에 따라 쳐도 됩니다.)

### 2.1 도구(Tool) — `@tool` 데코레이터

Strands에서 도구는 그냥 **`@tool`을 붙인 파이썬 함수**입니다.
함수의 **docstring과 타입힌트**가 그대로 LLM에게 "이 도구가 뭔지" 설명으로 전달됩니다.

#### (A) `get_occupancy` — Module 2 재실감지 ML 모델 호출

가전 전력 feature 14개로 **주인 재실 여부**를 예측합니다. Module 2에서 만든 SageMaker 엔드포인트를 호출하고, 엔드포인트가 없으면 Mock으로 동작합니다.
feature 14개는 실제로는 전력 미터에서 계산되지만, 여기서는 **Mock으로 생성**합니다.

```python
import os, json, random
from strands import tool


def _mock_power_features() -> dict:
    """Module 2(재실 감지 ML)의 입력 feature 14개를 Mock으로 생성한다."""
    high = random.random() > 0.5  # 전력 높음(활동) vs 낮음(빈집)
    agg = round(random.uniform(500, 1600) if high else random.uniform(60, 200), 1)
    return {
        "aggregate_w": agg, "minute_of_day": random.randint(0, 1439),
        "dow": random.randint(0, 6), "is_daylight": random.choice([0, 1]),
        "month": random.choice([6, 7, 8, 9]), "outdoor_temp_c": round(random.uniform(20, 34), 1),
        "aggregate_missing": 0.0, "agg_roll_mean_30": round(agg * random.uniform(0.8, 1.1), 1),
        "agg_roll_std_30": round(random.uniform(100, 400) if high else random.uniform(0, 60), 1),
        "agg_delta_15": round(random.uniform(50, 500) if high else random.uniform(-80, 80), 1),
        "aircon_active_30": float(random.randint(0, 30)) if high else 0.0,
        "kettle_active_30": 0.0, "microwave_active_30": 0.0,
        "tv_active_30": float(random.randint(0, 30)) if high else 0.0,
    }


@tool
def get_occupancy() -> dict:
    """가전 전력 데이터로 주인의 재실 여부를 예측한다 (Module 2의 재실감지 ML 모델 호출).
    occupancy('home'/'away'), proba_occupied(0~1)를 반환한다."""
    features = _mock_power_features()
    endpoint = os.getenv("SM_ENDPOINT_NAME")
    if endpoint:  # Module 2 SageMaker 엔드포인트 호출
        import boto3
        rt = boto3.client("sagemaker-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))
        resp = rt.invoke_endpoint(EndpointName=endpoint, ContentType="application/json",
            Accept="application/json", Body=json.dumps({"buffer": [features]}))
        proba = json.loads(resp["Body"].read())[0]["proba_occupied"]
    else:  # Mock 폴백: 전력 수준 기반
        proba = min(0.99, max(0.01, features["aggregate_w"] / 1500))
    return {"occupancy": "home" if proba > 0.5 else "away", "proba_occupied": round(proba, 3)}
```

> 🔗 곤수님 Module 2의 `launch_invoke.py`와 동일한 호출 규약입니다: `{"buffer": [record]}` 전송 → `[{"proba_occupied":..., "pred_occupied":...}]` 응답.
> `SM_ENDPOINT_NAME` 환경변수만 설정하면 실제 모델로, 없으면 Mock으로 동작합니다.

#### (B) 나머지 도구 — 강아지 디바이스/행동 (Mock)

```python
@tool
def get_device_states() -> dict:
    """강아지 관련 디바이스 센서 값을 읽는다.
    barking_level(짖음 0~10), motion(움직임 0~10), noise_db(소음 데시벨)을 반환."""
    return {
        "barking_level": random.randint(0, 10),
        "motion": random.randint(0, 10),
        "noise_db": random.randint(30, 90),
    }


@tool
def predict_anxiety(barking_level: int, motion: int, noise_db: int) -> dict:
    """디바이스 센서 값으로 강아지의 불안도를 예측한다.
    score(0.0~1.0)와 level('low'/'medium'/'high')을 반환."""
    score = min(1.0, (barking_level + motion + (noise_db - 30) / 6) / 25)
    level = "high" if score > 0.6 else "medium" if score > 0.3 else "low"
    return {"score": round(score, 2), "level": level}


@tool
def play_music_on_tv(playlist: str = "Calm Dog Music") -> str:
    """TV에서 강아지 진정용 음악을 재생한다."""
    return f"TV에서 '{playlist}' 재생을 시작했습니다."
```

> 💡 `predict_anxiety`의 입력은 `get_device_states`의 출력과 맞춰져 있습니다. 그래서 에이전트가 "상태 읽기 → 불안도 예측" 순서로 도구를 엮어 씁니다.

### 2.2 에이전트 + AG-UI 래핑

```python
import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"   # 도구 실행 동의 프롬프트 생략(데모용)

from strands import Agent
from strands.models import BedrockModel
from ag_ui_strands import StrandsAgent, StrandsAgentConfig, create_strands_app

SYSTEM_PROMPT = """너는 스마트싱스 반려견 펫케어 에이전트다.
요청을 받으면 도구를 사용해 다음을 수행해라:
1. get_occupancy 로 주인의 재실 여부를 확인한다 (가전 전력 기반 ML 예측, occupancy='home'/'away').
2. get_device_states 로 디바이스 센서 값을 읽는다.
3. predict_anxiety 로 강아지의 불안도를 예측한다.
4. 주인이 외출(occupancy='away') 중이고 불안도가 'high'이면, play_music_on_tv 로 진정 음악을 재생한다.
   그 외에는 아무 행동도 하지 않는다.
마지막에 점검 결과와 무엇을 왜 했는지 한국어로 간단히 설명해라."""

model = BedrockModel(
    model_id="us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-east-1",
)

agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[get_occupancy, get_device_states, predict_anxiety, play_music_on_tv],
)

# AG-UI 프로토콜로 감싸기 (CopilotKit이 말을 거는 방식)
agui_agent = StrandsAgent(
    agent=agent,
    name="petcare_agent",
    description="스마트싱스 펫케어 - 강아지 불안 케어 에이전트",
    config=StrandsAgentConfig(),
)

# 로컬은 "/", AgentCore Runtime은 "/invocations" 로 접근
agent_path = os.getenv("AGENT_PATH", "/invocations")
app = create_strands_app(agui_agent, agent_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
```

**핵심 포인트**
- `create_strands_app(agui_agent, path)` 가 **AG-UI 프로토콜을 말하는 HTTP 서버**를 만들어 줍니다. (`/ping` 헬스체크 내장)
- `path`가 로컬에서는 `/`, AgentCore에서는 `/invocations` — 환경변수로 분기.
- `BYPASS_TOOL_CONSENT=true`가 없으면 도구 실행마다 동의 프롬프트가 떠서 자동 실행이 막힙니다.

---

## 3. 백엔드 실행 (로컬)

> ⚠️ **Python 3.12 필요**: `ag-ui-strands`는 Python 3.14를 아직 지원하지 않습니다. 반드시 3.12로 가상환경을 만드세요.

```bash
cd agent
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 로컬 모드: AGENT_PATH=/ 로 띄움
AGENT_PATH="/" AWS_REGION=us-east-1 python main.py
```

다른 터미널에서 헬스체크:
```bash
curl http://localhost:8080/ping
# {"status":"healthy"}
```

> ✅ `{"status":"healthy"}`가 나오면 에이전트 서버가 정상 기동된 것입니다.

---

## 4. 프론트엔드 실행 (CopilotKit 채팅 UI)

새 터미널에서:

```bash
cd frontend
cp .env.local.example .env.local   # AGENT_URL=http://localhost:8080
npm install
npm run dev                         # http://localhost:3300
```

브라우저에서 **http://localhost:3300** 접속 → 오른쪽 사이드바 채팅에 입력:

```
강아지 상태 점검해줘
```

> ✅ 에이전트가 도구를 차례로 호출(`get_occupancy → get_device_states → predict_anxiety`)하고,
> 상황에 따라 `play_music_on_tv`까지 실행한 뒤, 점검 결과와 이유를 사이드바에 보여주면 성공입니다.
> 🔁 `get_occupancy`가 랜덤이라 여러 번 보내면 다른 판단(음악 재생 / 무동작)을 볼 수 있습니다.

### 동작 원리 (한 장 요약)
```
브라우저 채팅 입력
   → /api/copilotkit (route.ts) → HttpAgent(AGENT_URL) 로 AG-UI 요청
   → localhost:8080 Strands 에이전트가 도구 호출하며 추론
   → 결과를 AG-UI 이벤트로 스트리밍 → 사이드바에 표시
```

> 💡 `frontend/.env.local`의 `AGENT_URL`만 바꾸면 어떤 에이전트로도 붙일 수 있습니다. **여기엔 인증이 전혀 없습니다.**

---

## 5. AgentCore Runtime에 배포 (IAM 인증 — Cognito 없음)

이제 로컬에서 잘 도는 에이전트를 클라우드(**AgentCore Runtime**)에 올립니다.
인증은 **IAM(SigV4)** 으로 갑니다 — Cognito·JWT 설정이 전혀 필요 없습니다.

### 5.1 starter toolkit 설치

```bash
cd ../agent          # 에이전트 폴더에서
source .venv/bin/activate
pip install bedrock-agentcore-starter-toolkit
```

### 5.2 배포

```bash
# 진입점 지정 (entrypoint = main.py, app 객체)
agentcore configure --entrypoint main.py

# AWS에 배포 (컨테이너 빌드 → ECR → Runtime 생성까지 자동)
agentcore launch
```

> ℹ️ `agentcore`가 **linux/arm64 컨테이너 빌드 → ECR 푸시 → Runtime 생성**을 자동으로 해줍니다.
> `authorizerConfiguration`을 지정하지 않으므로 **기본 IAM 인증**으로 배포됩니다. (= Cognito 불필요)
>
> ⚠️ 버전에 따라 배포 명령이 `agentcore launch` 또는 `agentcore deploy`일 수 있습니다. 막히면 `agentcore --help`로 확인하세요.
>
> 📋 배포가 끝나면 출력되는 **Agent Runtime ARN**을 복사해 두세요.

### 5.3 배포된 에이전트 호출 (IAM 서명)

배포된 Runtime은 **boto3**로 호출합니다. AWS SDK가 **SigV4 서명을 자동**으로 처리하므로, AWS 자격증명만 있으면 됩니다. (브라우저·Cognito 불필요)

`invoke_runtime.py`:
```python
import boto3, json, uuid

AGENT_ARN = "여기에_배포된_Agent_Runtime_ARN_붙여넣기"

client = boto3.client("bedrock-agentcore", region_name="us-east-1")  # SigV4 자동 서명
resp = client.invoke_agent_runtime(
    agentRuntimeArn=AGENT_ARN,
    runtimeSessionId=uuid.uuid4().hex + "-petcare-session-padding",  # 33자 이상
    payload=json.dumps({"prompt": "강아지 상태를 점검해줘"}).encode(),
)
print(resp["response"].read().decode())
```

```bash
python invoke_runtime.py
```

> ✅ 응답 JSON이 출력되면 클라우드에 배포된 에이전트가 IAM 인증만으로 동작한 것입니다.
> `agentcore invoke '{"prompt": "강아지 상태를 점검해줘"}'` 로도 빠르게 확인할 수 있습니다.

> 🔐 **왜 Cognito가 없어도 되나?** AgentCore Runtime 호출은 `bedrock-agentcore:InvokeAgentRuntime` IAM 권한으로 인증됩니다. `authorizerConfiguration`(JWT)을 안 붙이면 IAM 인증이 기본이고, boto3가 알아서 SigV4 서명을 합니다. 고객(브라우저)은 인증을 몰라도 됩니다.

---

## ✅ Module 3 완료 체크리스트
- [ ] 저장소 clone + 에이전트 코드(`main.py`) 이해
- [ ] 백엔드 로컬 실행 (`/ping` healthy)
- [ ] 프론트엔드(CopilotKit) 실행 + 채팅으로 에이전트 동작 확인
- [ ] AgentCore Runtime에 배포 (IAM 인증)
- [ ] boto3 / `agentcore invoke`로 배포된 에이전트 호출 성공

---

## 🛟 자주 막히는 곳 (Troubleshooting)

| 증상 | 원인 / 해결 |
|------|-------------|
| `ag-ui-strands` 설치/실행 오류 | Python 3.14는 미지원 → **3.12로 venv** 생성 |
| `AccessDenied` / 모델 호출 실패 | Bedrock **Model access** 미허용 → 콘솔에서 모델 활성화 (리전 `us-east-1`) |
| `/ping`은 되는데 채팅 무응답 | `frontend/.env.local`의 `AGENT_URL`이 `http://localhost:8080`인지 확인 |
| 에이전트가 도구를 안 부름 | docstring/타입힌트가 부실 → 설명을 더 명확히 |
| 도구 실행마다 멈춤 | `BYPASS_TOOL_CONSENT=true` 누락 |
| 채팅에 "Big update" 배너 | `npm install` 시 `scripts/patch-copilotkit.js`(postinstall)가 자동 제거. 안 되면 `npm run postinstall` |
| 포트 3300 이미 사용 중 | `frontend/package.json`의 dev 포트 변경 |
| `agentcore launch` 실패 | AWS 자격증명/리전 확인 (`aws sts get-caller-identity`) |
| 배포 명령을 못 찾음 | 버전 차이 → `agentcore --help`로 `launch`/`deploy` 확인 |
| `runtimeSessionId` 오류 | 33자 이상이어야 함 |

> 🧹 **워크샵 종료 후**: 배포한 AgentCore Runtime과 ECR 이미지를 삭제해 과금을 막으세요.

---

## 🎁 (선택) 더 해보기
- `SM_ENDPOINT_NAME` 환경변수를 설정해 `get_occupancy`가 **Module 2의 실제 SageMaker 엔드포인트**를 호출하도록 연결
- 진정 액션 추가(`dim_lights` 등) → 에이전트가 상황에 따라 선택하게
- 시스템 프롬프트를 바꿔 판단 기준 조정

---

⬅️ 이전: Module 2 (ML 모델) · 🏠 [워크샵 홈](../README.md)
