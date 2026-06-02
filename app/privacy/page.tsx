import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "개인정보처리방침 | 길드패스",
};

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">PRIVACY POLICY</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">개인정보처리방침</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-7 space-y-6">
          <p className="text-xs text-slate-400">시행일: 2026년 6월 1일</p>

          <p className="text-sm text-slate-600 leading-relaxed">
            클레이패스(이하 "회사")는 길드패스(이하 "서비스") 이용자의 개인정보를 중요하게 생각하며,
            「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 본 방침은 회사가 어떤 개인정보를 어떻게
            수집·이용·보관하는지를 안내합니다.
          </p>

          <Article title="1. 수집하는 개인정보 항목">
            <p>회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
            <p className="font-bold text-slate-800 mt-2">가. 디스코드 계정 연동 시 (회원가입·로그인)</p>
            <p className="pl-3">· 디스코드 고유 ID, 사용자명(닉네임), 프로필 이미지, 이메일 주소</p>
            <p className="font-bold text-slate-800 mt-2">나. 로스트아크 캐릭터 연동 시 (선택)</p>
            <p className="pl-3">· 캐릭터명, 서버, 직업, 아이템 레벨, 전투력 등 로스트아크 공개 API를 통해 제공되는 게임 정보</p>
            <p className="font-bold text-slate-800 mt-2">다. 서비스 이용 과정에서 생성되는 정보</p>
            <p className="pl-3">· 출석 기록, 포인트 적립·사용 내역, 작성한 게시글·댓글, 길드 활동 기록, 레이드 참여 기록</p>
            <p className="font-bold text-slate-800 mt-2">라. 자동으로 생성·수집되는 정보</p>
            <p className="pl-3">· 접속 일시, 서비스 이용 기록 등</p>
          </Article>

          <Article title="2. 개인정보의 수집 및 이용 목적">
            <p>회사는 수집한 개인정보를 다음의 목적으로 이용합니다.</p>
            <p className="pl-3">· 회원 식별 및 로그인 등 서비스 제공</p>
            <p className="pl-3">· 길드 운영, 출석·포인트·랭킹·레이드 등 핵심 기능 제공</p>
            <p className="pl-3">· 디스코드 알림 등 연동 기능 제공</p>
            <p className="pl-3">· 부정 이용 방지 및 문의·민원 처리</p>
            <p className="pl-3">· 서비스 개선 및 통계 분석</p>
          </Article>

          <Article title="3. 개인정보의 보유 및 이용 기간">
            <p>① 회사는 원칙적으로 회원 탈퇴 시 수집된 개인정보를 지체 없이 파기합니다.</p>
            <p>② 다만 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>
            <p>③ 회원이 작성한 게시물 중 다른 회원의 정상적 이용에 필요한 경우(예: 길드 공용 게시물), 일부 정보는 익명 처리 후 보존될 수 있습니다.</p>
          </Article>

          <Article title="4. 개인정보의 제3자 제공">
            <p>회사는 이용자의 개인정보를 본 방침에 명시한 범위를 넘어 외부에 제공하지 않습니다. 다만 다음의 경우는 예외로 합니다.</p>
            <p className="pl-3">· 이용자가 사전에 동의한 경우</p>
            <p className="pl-3">· 법령의 규정에 의거하거나 수사기관의 적법한 요청이 있는 경우</p>
          </Article>

          <Article title="5. 개인정보 처리의 위탁 및 외부 서비스">
            <p>회사는 안정적인 서비스 제공을 위해 다음의 외부 서비스를 이용합니다.</p>
            <p className="pl-3">· 디스코드(Discord): 소셜 로그인 및 알림 연동</p>
            <p className="pl-3">· 스마일게이트 RPG / 로스트아크 오픈 API: 캐릭터 정보 조회</p>
            <p className="pl-3">· 클라우드 인프라 제공업체(Supabase, Vercel 등): 데이터 저장 및 서비스 호스팅</p>
            <p>위 외부 서비스의 개인정보 처리는 각 서비스의 정책을 따르며, 회사는 서비스 제공에 필요한 최소한의 범위에서만 이를 이용합니다.</p>
          </Article>

          <Article title="6. 이용자의 권리와 행사 방법">
            <p>① 이용자는 언제든지 자신의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴를 통해 개인정보의 삭제를 요청할 수 있습니다.</p>
            <p>② 개인정보 열람·정정·삭제·처리정지 요청은 아래 문의처를 통해 할 수 있으며, 회사는 관련 법령에 따라 지체 없이 조치합니다.</p>
          </Article>

          <Article title="7. 개인정보의 파기">
            <p>① 회사는 개인정보의 보유 기간이 경과하거나 처리 목적이 달성된 경우 해당 정보를 지체 없이 파기합니다.</p>
            <p>② 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제합니다.</p>
          </Article>

          <Article title="8. 개인정보의 안전성 확보 조치">
            <p>회사는 개인정보의 안전한 처리를 위해 접근 권한 관리, 접속 기록 보관, 보안 통신(HTTPS) 적용 등 합리적인 보호 조치를 취하고 있습니다.</p>
          </Article>

          <Article title="9. 개인정보 보호책임자">
            <p>서비스 이용 중 발생하는 개인정보 관련 문의, 불만 처리, 피해 구제 등은 아래 책임자에게 문의하실 수 있습니다.</p>
            <p className="pl-3">· 운영자: 클레이패스 (대표 이우혁)</p>
            <p className="pl-3">· 이메일: dldngur7542@naver.com</p>
          </Article>

          <Article title="10. 방침의 변경">
            <p>본 개인정보처리방침은 법령 또는 서비스 정책 변경에 따라 개정될 수 있으며, 개정 시 시행일 및 변경 내용을 서비스 화면에 공지합니다.</p>
          </Article>

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            본 방침은 2026년 6월 1일부터 시행됩니다.
          </p>
        </div>

        <div className="text-center pt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition">
            <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
