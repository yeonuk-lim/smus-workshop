// 펫케어 대시보드 — SmartThings 스타일 Mock UI
type Status = "ok" | "warn" | "alert" | "off";

const statusColor: Record<Status, string> = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  alert: "text-rose-400",
  off: "text-gray-500",
};

const statusDot: Record<Status, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  alert: "bg-rose-400",
  off: "bg-gray-500",
};

function Card({
  icon, name, value, sub, status,
}: { icon: string; name: string; value: string; sub?: string; status: Status }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`flex items-center gap-1.5 text-[11px] ${statusColor[status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
          {status === "ok" ? "정상" : status === "warn" ? "주의" : status === "alert" ? "경보" : "꺼짐"}
        </span>
      </div>
      <div className="text-[11px] text-gray-500 mb-1">{name}</div>
      <div className="text-lg font-semibold text-gray-100">{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function Sensor({ label, value, max, unit, danger }: { label: string; value: number; max: number; unit: string; danger?: boolean }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
      <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
        <span>{label}</span>
        <span className="text-gray-200 font-medium">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${danger ? "bg-rose-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const events = [
    { t: "방금", icon: "🔊", text: "거실에서 짖음 감지 (레벨 8)", level: "warn" as Status },
    { t: "2분 전", icon: "🚪", text: "현관 - 주인 외출", level: "ok" as Status },
    { t: "8분 전", icon: "📺", text: "TV 자동 전원 OFF", level: "ok" as Status },
    { t: "12분 전", icon: "💡", text: "거실 조명 자동 디밍", level: "ok" as Status },
    { t: "1시간 전", icon: "🐕", text: "급식기 - 사료 자동 급여", level: "ok" as Status },
  ];

  return (
    <main className="min-h-screen p-6 lg:p-10 max-w-6xl">
      {/* 헤더 */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🐶</span>
          <h1 className="text-2xl font-bold">스마트싱스 펫케어</h1>
          <span className="ml-auto flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            에이전트 활성
          </span>
        </div>
        <p className="text-sm text-gray-400">
          오른쪽 사이드바에 <code className="text-amber-300 bg-gray-800 px-1.5 py-0.5 rounded">강아지 상태 점검해줘</code> 를 입력하면 에이전트가 디바이스를 점검합니다.
        </p>
      </header>

      {/* 상태 요약 카드 */}
      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">집 상태</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card icon="🚪" name="현관" value="외출 중" sub="2분 전 변경" status="warn" />
          <Card icon="🐕" name="강아지" value="거실" sub="활동 중" status="warn" />
          <Card icon="🌡️" name="실내" value="24.5°C" sub="습도 52%" status="ok" />
          <Card icon="🛡️" name="보안" value="홈모드" sub="외출 모드 대기" status="ok" />
        </div>
      </section>

      {/* 디바이스 그리드 */}
      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">디바이스</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Card icon="📺" name="거실 TV" value="대기" sub="삼성 OLED 65″" status="off" />
          <Card icon="❄️" name="에어컨" value="냉방 24°C" sub="자동 모드" status="ok" />
          <Card icon="💡" name="거실 조명" value="50%" sub="3개 연결" status="ok" />
          <Card icon="🎵" name="사운드바" value="대기" sub="HW-Q990" status="off" />
          <Card icon="📷" name="펫 카메라" value="녹화 중" sub="거실" status="ok" />
          <Card icon="🍖" name="자동 급식기" value="급여 완료" sub="1시간 전" status="ok" />
          <Card icon="🪟" name="블라인드" value="50% 열림" sub="동향" status="ok" />
          <Card icon="🔌" name="공기청정기" value="자동" sub="PM2.5 12㎍" status="ok" />
        </div>
      </section>

      {/* 강아지 센서 + 최근 이벤트 */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">🐕 강아지 센서</h2>
          <div className="space-y-2">
            <Sensor label="짖음 레벨" value={8} max={10} unit="/10" danger />
            <Sensor label="움직임" value={6} max={10} unit="/10" />
            <Sensor label="소음" value={72} max={100} unit="dB" danger />
            <Sensor label="심박수" value={108} max={140} unit="bpm" />
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">📋 최근 이벤트</h2>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <span className="text-lg">{e.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate">{e.text}</div>
                  <div className="text-[10px] text-gray-500">{e.t}</div>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot[e.level]}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="mt-8 text-[11px] text-gray-600 text-center">
        ⓘ 이 화면은 데모용 Mock 데이터입니다. 실제 디바이스 제어는 에이전트가 수행합니다.
      </p>
    </main>
  );
}
