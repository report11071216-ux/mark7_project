import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "회원가입 & 길드 생성",
    description:
      "디스코드 한 번이면 충분해요. 길드 이름과 짧은 소개만 입력하면 6자리 길드 코드가 생성됩니다.",
  },
  {
    number: "02",
    title: "멤버 초대 & 역할 설정",
    description:
      "생성된 길드 코드를 공유하세요. 멤버가 가입하면 마스터/부마스터/일반 멤버 권한을 부여할 수 있어요.",
  },
  {
    number: "03",
    title: "위젯으로 홈페이지 꾸미기",
    description:
      "원하는 위젯을 드래그앤드롭으로 배치하세요. 우리 길드만의 색깔, 우리 길드만의 레이아웃이 완성됩니다.",
  },
];

export function HowItWorks() {
  return (
    <section className="section-padding relative">
      <div className="container-padded">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="mono-label mb-3">HOW IT WORKS · 사용 흐름</p>
          <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            3단계로 시작
          </h2>
          <p className="text-lg text-muted-foreground">
            복잡한 설정 없이, 가입 후 5분이면 우리 길드 홈페이지 완성
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => (
            <Card key={step.number} variant="outlined" className="p-8 relative">
              <div className="absolute top-4 right-6 font-mono text-7xl font-black text-violet-500/10 pointer-events-none select-none">
                {step.number}
              </div>
              <div className="relative z-10">
                <div className="font-mono text-sm font-bold text-violet-400 mb-4">
                  STEP {step.number}
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 items-center justify-center backdrop-blur-sm">
                  <span className="text-violet-300 text-xs">→</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
