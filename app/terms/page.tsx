import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "이용약관 | 길드패스",
};

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">TERMS OF SERVICE</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">이용약관</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-7 space-y-6">
          <p className="text-xs text-slate-400">시행일: 2026년 6월 1일</p>

          <Article title="제1조 (목적)">
            <p>
              본 약관은 클레이패스(이하 "회사")가 제공하는 길드패스(이하 "서비스")의 이용과 관련하여
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </Article>

          <Article title="제2조 (정의)">
            <p>① "서비스"란 회사가 제공하는 로스트아크 길드 운영 지원 플랫폼 및 관련 제반 서비스를 의미합니다.</p>
            <p>② "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원을 말합니다.</p>
            <p>③ "회원"이란 디스코드 계정을 통해 서비스에 로그인하여 서비스를 이용하는 자를 말합니다.</p>
            <p>④ "길드"란 회원이 서비스 내에서 생성하거나 가입하는 모임 단위를 말하며, "길드 마스터"는 해당 길드를 운영·관리하는 권한을 가진 회원을 말합니다.</p>
            <p>⑤ "포인트"란 서비스 내 활동을 통해 적립되어 서비스 내에서만 사용되는 가상의 재화를 말합니다.</p>
          </Article>

          <Article title="제3조 (약관의 게시와 개정)">
            <p>① 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 화면에 게시합니다.</p>
            <p>② 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
            <p>③ 회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 적용일자 7일 전부터 공지합니다. 다만 회원에게 불리한 개정의 경우 30일 전부터 공지합니다.</p>
            <p>④ 회원이 개정 약관의 적용에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</p>
          </Article>

          <Article title="제4조 (회원가입 및 계정)">
            <p>① 서비스는 디스코드 계정을 통한 소셜 로그인 방식으로 가입 및 이용이 이루어집니다.</p>
            <p>② 회원은 본인의 계정을 직접 관리할 책임이 있으며, 계정을 타인에게 양도하거나 대여할 수 없습니다.</p>
            <p>③ 회사는 다음 각 호에 해당하는 경우 회원가입을 거부하거나 사후에 이용을 제한할 수 있습니다.</p>
            <p className="pl-3">1. 타인의 정보를 도용한 경우</p>
            <p className="pl-3">2. 서비스 운영을 고의로 방해한 경우</p>
            <p className="pl-3">3. 관련 법령 또는 본 약관을 위반한 경우</p>
          </Article>

          <Article title="제5조 (서비스의 제공)">
            <p>① 회사는 다음과 같은 서비스를 제공합니다.</p>
            <p className="pl-3">1. 길드 생성·가입 및 운영 관리 기능</p>
            <p className="pl-3">2. 출석 체크, 포인트 적립 및 랭킹 기능</p>
            <p className="pl-3">3. 레이드 일정·도감 관리 기능</p>
            <p className="pl-3">4. 로스트아크 캐릭터 정보 연동 기능</p>
            <p className="pl-3">5. 디스코드 알림 연동 기능</p>
            <p className="pl-3">6. 기타 회사가 정하는 서비스</p>
            <p>② 서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검·교체·고장, 통신 두절 등의 사유가 있는 경우 일시 중단될 수 있습니다.</p>
            <p>③ 회사는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.</p>
          </Article>

          <Article title="제6조 (포인트)">
            <p>① 포인트는 출석, 레이드 참여 등 서비스 내 활동을 통해 적립되는 가상의 재화로, 현금으로 환급되지 않습니다.</p>
            <p>② 포인트는 서비스 내에서만 사용 가능하며, 타인에게 양도할 수 없습니다.</p>
            <p>③ 회원 탈퇴 시 보유한 포인트는 소멸되며 복구되지 않습니다.</p>
            <p>④ 회사는 서비스 운영상 필요에 따라 포인트의 적립·사용 정책을 변경할 수 있으며, 변경 시 사전에 공지합니다.</p>
          </Article>

          <Article title="제7조 (이용자의 의무)">
            <p>① 회원은 다음 행위를 하여서는 안 됩니다.</p>
            <p className="pl-3">1. 타인의 정보 도용 또는 허위 정보 등록</p>
            <p className="pl-3">2. 서비스의 정상적인 운영을 방해하는 행위</p>
            <p className="pl-3">3. 다른 회원에 대한 욕설, 비방, 괴롭힘 등 부적절한 게시물 작성</p>
            <p className="pl-3">4. 회사 또는 제3자의 지식재산권을 침해하는 행위</p>
            <p className="pl-3">5. 관련 법령 및 공서양속에 위배되는 행위</p>
            <p>② 회원이 작성한 게시물(글, 댓글, 이미지 등)에 대한 책임은 작성한 회원 본인에게 있습니다.</p>
          </Article>

          <Article title="제8조 (게시물의 관리)">
            <p>① 회원이 작성한 게시물이 관련 법령 또는 본 약관에 위반되는 경우, 회사는 사전 통지 없이 해당 게시물을 삭제하거나 게시를 제한할 수 있습니다.</p>
            <p>② 길드 내 게시물 및 운영에 관한 1차적 관리 권한은 해당 길드의 길드 마스터 및 부마스터에게 있습니다.</p>
          </Article>

          <Article title="제9조 (서비스 이용 제한 및 회원 탈퇴)">
            <p>① 회원은 언제든지 서비스 내 기능 또는 문의를 통해 회원 탈퇴를 요청할 수 있으며, 회사는 관련 법령에 따라 이를 처리합니다.</p>
            <p>② 회사는 회원이 본 약관을 위반한 경우 서비스 이용을 일시적 또는 영구적으로 제한할 수 있습니다.</p>
          </Article>

          <Article title="제10조 (책임의 제한)">
            <p>① 회사는 천재지변, 디스코드·로스트아크 등 외부 서비스의 장애, 회원의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</p>
            <p>② 본 서비스는 로스트아크 및 디스코드와 제휴·후원 관계가 없는 독립적인 서비스이며, 해당 서비스들의 상표권은 각 권리자에게 있습니다.</p>
            <p>③ 회사는 회원 상호 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 대하여 개입할 의무가 없으며 이로 인한 손해를 배상할 책임이 없습니다.</p>
            <p>④ 회사는 무료로 제공되는 서비스의 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</p>
          </Article>

          <Article title="제11조 (준거법 및 관할)">
            <p>① 본 약관은 대한민국 법령에 따라 해석되고 적용됩니다.</p>
            <p>② 서비스 이용과 관련하여 회사와 회원 간 분쟁이 발생한 경우, 관련 법령에 정한 절차에 따른 법원을 관할 법원으로 합니다.</p>
          </Article>

          <Article title="문의처">
            <p>서비스명: 길드패스</p>
            <p>운영자: 클레이패스 (대표 이우혁)</p>
            <p>이메일: dldngur7542@naver.com</p>
          </Article>

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            본 약관은 2026년 6월 1일부터 시행됩니다.
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
