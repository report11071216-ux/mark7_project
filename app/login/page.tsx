import LoginButton from "@/components/LoginButton";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          🎮 길드 플랫폼
        </h1>
        <p className="mb-8 text-center text-gray-600">
          로그인하고 길드에 참여하세요
        </p>

        {searchParams.error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            로그인 중 오류가 발생했습니다. 다시 시도해주세요.
          </div>
        )}

        <div className="flex justify-center">
          <LoginButton />
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          로그인 시 디스코드 정보(닉네임, 프로필 사진)에 접근하는 것에
          동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}
