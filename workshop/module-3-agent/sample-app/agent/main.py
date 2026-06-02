"""펫케어 불안 케어 에이전트 — Strands + AG-UI (AgentCore Runtime 호환)"""

import os

os.environ["BYPASS_TOOL_CONSENT"] = "true"

import json
import random

from strands import Agent, tool
from strands.models import BedrockModel
from ag_ui_strands import StrandsAgent, StrandsAgentConfig, create_strands_app


# ---- 도구(Tool): 디바이스 연동/ML은 전부 Mock ----

def _mock_power_features() -> dict:
    """Module 2(재실 감지 ML)의 입력 feature 14개를 Mock으로 생성한다.
    실제로는 SmartThings 가전 전력 미터에서 수집·계산된다."""
    high = random.random() > 0.5  # 전력 높음(활동) vs 낮음(빈집) 시나리오
    agg = round(random.uniform(500, 1600) if high else random.uniform(60, 200), 1)
    return {
        "aggregate_w": agg,
        "minute_of_day": random.randint(0, 1439),
        "dow": random.randint(0, 6),
        "is_daylight": random.choice([0, 1]),
        "month": random.choice([6, 7, 8, 9]),
        "outdoor_temp_c": round(random.uniform(20, 34), 1),
        "aggregate_missing": 0.0,
        "agg_roll_mean_30": round(agg * random.uniform(0.8, 1.1), 1),
        "agg_roll_std_30": round(random.uniform(100, 400) if high else random.uniform(0, 60), 1),
        "agg_delta_15": round(random.uniform(50, 500) if high else random.uniform(-80, 80), 1),
        "aircon_active_30": float(random.randint(0, 30)) if high else 0.0,
        "kettle_active_30": 0.0,
        "microwave_active_30": 0.0,
        "tv_active_30": float(random.randint(0, 30)) if high else 0.0,
    }


@tool
def get_occupancy() -> dict:
    """가전 전력 데이터로 주인의 재실 여부를 예측한다 (Module 2의 재실감지 ML 모델 호출).
    occupancy('home'/'away'), proba_occupied(0~1)를 반환한다.
    SM_ENDPOINT_NAME 환경변수가 있으면 SageMaker 엔드포인트를, 없으면 Mock 규칙을 사용한다."""
    features = _mock_power_features()  # 실제로는 미터에서 계산된 14 feature
    endpoint = os.getenv("SM_ENDPOINT_NAME")
    if endpoint:
        import boto3
        rt = boto3.client("sagemaker-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))
        resp = rt.invoke_endpoint(
            EndpointName=endpoint, ContentType="application/json",
            Accept="application/json", Body=json.dumps({"buffer": [features]}),
        )
        out = json.loads(resp["Body"].read())[0]
        proba = out["proba_occupied"]
    else:
        # Mock 폴백: 전력 수준 기반 간단 규칙
        proba = min(0.99, max(0.01, features["aggregate_w"] / 1500))
    return {"occupancy": "home" if proba > 0.5 else "away", "proba_occupied": round(proba, 3)}


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


SYSTEM_PROMPT = """너는 스마트싱스 반려견 펫케어 에이전트다.
주인의 재실 여부와 강아지 상태를 파악하고, 강아지가 불안하다고 판단되면 적절한 조치를 취해라.
사용 가능한 도구로 상황을 스스로 파악하고, 마지막에 점검 결과와 취한 행동의 이유를 한국어로 설명해라."""

model = BedrockModel(
    model_id=os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-5-20250929-v1:0"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)

agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[get_occupancy, get_device_states, predict_anxiety, play_music_on_tv],
)

agui_agent = StrandsAgent(
    agent=agent,
    name="petcare_agent",
    description="스마트싱스 펫케어 - 강아지 불안 케어 에이전트",
    config=StrandsAgentConfig(),
)

# 로컬 CopilotKit은 "/"로 접근, AgentCore Runtime은 "/invocations"로 접근
agent_path = os.getenv("AGENT_PATH", "/invocations")
app = create_strands_app(agui_agent, agent_path)


# AgentCore Runtime이 READY로 판단하려면 /ping 200이 필요하다 (AG-UI 프로토콜에서도 동일)
@app.get("/ping")
async def ping():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
