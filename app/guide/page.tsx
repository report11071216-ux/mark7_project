import Link from "next/link";
import {
  BookOpen, UserCog, Coins, Trophy, Sprout, Swords,
  ShoppingBag, Calendar, Megaphone, ArrowLeft, Sparkles, Box,
} from "lucide-react";

export const metadata = {
  title: "플랫폼 가이드 | 길드패스",
};

function Section({
  icon: Icon, color, bg, title, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; title: string; children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
        {num}
      </span>
      <p className="flex-1 pt-0.5">{children}</p>
    </div>
  );
}

function Highlight({ children, color = "violet" }: { children: React.ReactNode; color?: string }) {
  const map: { [k: string]: string } = {
    violet: "bg-violet-50 text-violet-700",
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[13px] font-bold ${map[color]}`}>{children}</span>;
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10 space-y-5">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">PLATFORM GUIDE</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">길드패스 가이드</h1>
          </div>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed">
          길드패스를 처음 시작하시나요? 아래 순서대로 따라오면 금방 익숙해져요.
          출석하고, 레이드 돌고, 포인트로 길드를 키우는 게 핵심이에요.
        </p>

        {/* 1. 시작하기 */}
        <Section icon={UserCog} color="#7c3aed" bg="#EEEDFE" title="1. 가장 먼저 — 캐릭터 연동">
          <p>
            무엇보다 먼저 <Highlight>마이페이지</Highlight>에서 로스트아크 캐릭터를 연동하세요.
            연동하면 아이템 레벨·전투력·직업이 자동으로 표시되고, 레이드 참여 시 어떤 캐릭터로 갈지 고를 수 있어요.
          </p>
          <Step num={1}>좌측 메뉴(또는 우상단)에서 <Highlight>마이페이지</Highlight>로 이동</Step>
          <Step num={2}>대표 캐릭터명을 입력하고 <Highlight color="cyan">연동</Highlight> 버튼 클릭</Step>
          <Step num={3}>아이템 레벨 1640 이상 캐릭터가 원정대로 함께 등록돼요 (레이드 신청 시 부캐 선택 가능)</Step>
          <p className="text-xs text-slate-400">
            ※ 연동을 안 하면 레이드 참여나 전투정보실 기능을 제대로 쓸 수 없어요.
          </p>
        </Section>

        {/* 2. 포인트 시스템 */}
        <Section icon={Coins} color="#185FA5" bg="#E6F1FB" title="2. 포인트 — 두 종류가 있어요">
          <p>길드패스의 포인트는 <b className="text-slate-900">두 가지로 나뉘어요.</b> 헷갈리지 않게 구분해서 알아두세요.</p>

          <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
            <p className="font-bold text-violet-800 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 개인 활동 포인트
            </p>
            <p className="text-[13px] text-violet-900/80 leading-relaxed">
              내가 출석하고 활동해서 모으는 <b>나만의 포인트</b>예요.
              상점에서 개인 프로필카드·마크·뽑기권 등을 사는 데 써요.
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
              <Sprout className="w-4 h-4" /> 길드 포인트
            </p>
            <p className="text-[13px] text-emerald-900/80 leading-relaxed">
              길드원 모두의 활동이 모이는 <b>길드 공용 포인트</b>예요.
              마스터·부마스터가 길드 인원 확장·보관함·경험치를 사는 데 써요.
            </p>
          </div>

          <p className="font-bold text-slate-900 mt-2">어떻게 모으나요?</p>
          <Step num={1}>매일 <Highlight color="amber">출석</Highlight>하면 개인·길드 포인트가 동시에 쌓여요 (출석 카드 보너스 포함)</Step>
          <Step num={2}>출석 시 <Highlight color="cyan">출석 카드</Highlight>도 한 장 뽑아요 (좋은 등급일수록 보너스 포인트 ↑)</Step>
          <Step num={3}>매주 수요일엔 길드 랭킹 보상으로 개인 포인트를 추가로 받아요 (아래 참고)</Step>
          <p className="text-xs text-slate-400">※ 출석 초기화는 매일 오전 6시예요. 새벽 0~6시는 전날로 쳐요.</p>
        </Section>

        {/* 3. 주간 랭킹 보상 */}
        <Section icon={Trophy} color="#0F6E56" bg="#E1F5EE" title="3. 매주 수요일 — 랭킹 보상">
          <p>
            매주 <Highlight color="emerald">수요일 오전 6시</Highlight>, 길드 순위에 따라
            <b className="text-slate-900"> 길드원 모두에게 개인 포인트</b>가 지급돼요.
            (길드 포인트가 아니라 각자의 개인 포인트로 들어와요.)
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">순위별 보상 (1인당)</p>
            {[
              { rank: "1위 ~ 10위", reward: "100P" },
              { rank: "11위 ~ 100위", reward: "70P" },
              { rank: "101위 ~ 1000위", reward: "50P" },
              { rank: "1001위 이하", reward: "30P" },
            ].map((r) => (
              <div key={r.rank} className="flex items-center justify-between text-[13px]">
                <span className="text-slate-600">{r.rank}</span>
                <span className="font-bold text-emerald-600 font-mono">{r.reward}</span>
              </div>
            ))}
          </div>
          <p>
            길드 순위는 <b className="text-slate-900">누적 경험치</b>로 정해져요.
            경험치는 포인트를 써도 줄어들지 않으니, 길드 포인트를 쓸수록 순위가 올라가요.
          </p>
        </Section>

        {/* 4. 길드 성장 */}
        <Section icon={Sprout} color="#534AB7" bg="#EEEDFE" title="4. 길드 성장 — 포인트로 키우기">
          <p>
            <Highlight>성장</Highlight> 페이지에서 마스터·부마스터가 길드 포인트로 길드를 강화할 수 있어요.
            성장 현황은 모든 길드원이 볼 수 있어요 (강화는 운영진만).
          </p>
          <div className="grid grid-cols-1 gap-2">
            <p>· <b className="text-slate-900">인원 확장</b> — 200P로 최대 인원 +1 (시작 20명)</p>
            <p>· <b className="text-slate-900">보관함 확장</b> — 200P로 코스메틱 보관 슬롯 +1</p>
            <p>· <b className="text-slate-900">경험치 구매</b> — 100P로 경험치 +10 (랭킹 상승)</p>
          </div>
          <p>
            경험치가 쌓이면 길드 등급이 올라가요:
            브론즈 → 실버 → 골드 → 플래티넘 → 에메랄드 → 다이아몬드 → 마스터 → 그랜드마스터.
            모든 포인트 사용·획득 내역은 성장 페이지에 <b className="text-slate-900">투명하게 공개</b>돼요.
          </p>
        </Section>

        {/* 5. 레이드 도감 */}
        <Section icon={Swords} color="#A32D2D" bg="#FCEBEB" title="5. 레이드 도감 & 일정">
          <p>
            길드 홈의 레이드 위젯에서 레이드를 <Highlight color="amber">클릭</Highlight>하면
            클리어 골드·적정 레벨·적정 전투력·획득 재화 정보와 공략을 볼 수 있어요.
          </p>
          <Step num={1}>레이드 도감에 레이드를 등록 (이미지·수치 입력)</Step>
          <Step num={2}>공략 탭에서 <Highlight>공대장용 / 공대원용</Highlight> 공략을 작성 (길드원 누구나 가능)</Step>
          <Step num={3}>레이드 캘린더에서 일정을 잡고, 참여할 캐릭터를 골라 신청</Step>
          <Step num={4}>레이드를 마치면 완료 처리 (운영진·주최자) → 길드 활동 통계에 반영</Step>
        </Section>

        {/* 6. 상점 & 보관함 */}
        <Section icon={ShoppingBag} color="#0E7490" bg="#CFFAFE" title="6. 상점 & 보관함">
          <p>모은 포인트로 꾸미기 아이템을 살 수 있어요.</p>
          <div className="grid grid-cols-1 gap-2">
            <p>· <b className="text-slate-900">길드 마크 / 프로필카드</b> — 길드와 내 프로필을 꾸며요</p>
            <p>· <b className="text-slate-900">이모티콘팩</b> — 길드 채팅에서 사용</p>
            <p className="flex items-start gap-1.5">
              <Megaphone className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <span><b className="text-slate-900">확성기</b> — 광장 상단에 길드 홍보 문구를 띄워요 (1·3·6·12시간)</span>
            </p>
          </div>
          <p className="flex items-start gap-1.5">
            <Box className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              구매한 길드 아이템은 <Highlight color="emerald">길드 보관함</Highlight>에 들어가요.
              보관함 칸이 꽉 차면 성장 페이지에서 슬롯을 늘려야 더 살 수 있어요. (확성기는 칸을 차지하지 않아요)
            </span>
          </p>
        </Section>

        {/* 마무리 */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 md:p-6 text-center">
          <p className="text-white font-bold text-base mb-1">이제 시작해볼까요?</p>
          <p className="text-white/75 text-[13px] mb-4">캐릭터 연동부터 하고, 매일 출석하는 것부터 시작해보세요.</p>
          <Link href="/mypage" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-violet-700 text-sm font-bold hover:bg-violet-50 transition">
            <UserCog className="w-4 h-4" /> 마이페이지에서 캐릭터 연동하기
          </Link>
        </div>

        <div className="text-center pt-2">
          <Link href="/plaza" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition">
            <ArrowLeft className="w-4 h-4" /> 광장으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
