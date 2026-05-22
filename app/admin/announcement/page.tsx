import { requireAdmin } from "@/lib/admin";
import AnnouncementEditor from "@/components/admin/AnnouncementEditor";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "plaza_announcement")
    .maybeSingle();

  const value = (data?.value ?? { message: "", link: "", active: false }) as {
    message: string;
    link: string;
    active: boolean;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">공지 배너</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          광장 상단에 표시되는 운영 공지예요. 활성화 토글로 즉시 on/off 가능해요.
        </p>
      </div>
      <AnnouncementEditor
        message={value.message}
        link={value.link}
        active={value.active}
      />
    </div>
  );
}
