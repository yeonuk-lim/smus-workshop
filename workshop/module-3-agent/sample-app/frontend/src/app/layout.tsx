import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

export const metadata = {
  title: "스마트싱스 펫케어 에이전트",
  description: "강아지 불안 케어 에이전트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          const observer = new MutationObserver(() => {
            document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
              if (el.textContent && (el.textContent.includes('Big update') || el.textContent.includes('Series A') || el.textContent.includes('Inspector'))) {
                el.remove();
              }
            });
          });
          observer.observe(document.documentElement, { childList: true, subtree: true });
        `}} />
      </head>
      <body className="bg-gray-950 text-gray-100">
        <CopilotKit runtimeUrl="/api/copilotkit" agent="petcare_agent" useSingleEndpoint={true} showDevConsole={false}>
          {children}
          <CopilotSidebar
            labels={{ title: "펫케어 에이전트", initial: "강아지 상태를 점검해달라고 요청해 보세요." }}
            defaultOpen={true}
          />
        </CopilotKit>
      </body>
    </html>
  );
}
