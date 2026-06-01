export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold mb-3">🐶 스마트싱스 펫케어 에이전트</h1>
      <p className="text-gray-400 max-w-xl">
        오른쪽 사이드바에서 <b>&quot;강아지 상태 점검해줘&quot;</b> 라고 입력해 보세요.
      </p>
      <p className="text-gray-500 mt-4 max-w-xl text-sm">
        에이전트가 재실 여부 확인 → 센서 읽기 → 불안도 예측을 수행하고,
        주인이 외출 중이고 불안도가 높으면 TV로 진정 음악을 재생합니다.
      </p>
    </main>
  );
}
