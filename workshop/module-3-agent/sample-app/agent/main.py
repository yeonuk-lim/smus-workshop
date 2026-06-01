"""펫케어 불안 케어 에이전트 — Strands + AG-UI (AgentCore Runtime 호환)"""

import os

os.environ["BYPASS_TOOL_CONSENT"] = "true"

import random

from strands import Agent, tool
from strands.models import BedrockModel
from ag_ui_strands import StrandsAgent, StrandsAgentConfig, create_strands_app


# ---- 도구(Tool): 디바이스 연동/ML은 전부 Mock ----
@tool
def get_occupancy() -> str:
    """집에 주인이 있는지(재실 여부) 확인한다. 'home' 또는 'away'를 반환."""
    return random.choice(["home", "away"])


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
요청을 받으면 도구를 사용해 다음을 수행해라:
1. get_occupancy 로 주인의 재실 여부를 확인한다.
2. get_device_states 로 디바이스 센서 값을 읽는다.
3. predict_anxiety 로 강아지의 불안도를 예측한다.
4. 주인이 외출(away) 중이고 불안도가 'high'이면, play_music_on_tv 로 진정 음악을 재생한다.
   그 외에는 아무 행동도 하지 않는다.
마지막에 점검 결과와 무엇을 왜 했는지 한국어로 간단히 설명해라."""

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
