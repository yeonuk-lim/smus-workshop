import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { NextRequest, NextResponse } from "next/server";

// 로컬 에이전트 주소 (인증 없음)
const AGENT_URL = process.env.AGENT_URL || "http://localhost:8080";

const runtime = new CopilotRuntime({
  agents: {
    petcare_agent: new HttpAgent({ url: AGENT_URL }),
  },
});

const serviceAdapter = new ExperimentalEmptyAdapter();

export const GET = async () =>
  NextResponse.json({
    agents: {
      petcare_agent: {
        name: "petcare_agent",
        description: "스마트싱스 펫케어 에이전트",
      },
    },
  });

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
