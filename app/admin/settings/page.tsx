import { requireAdmin } from "@/lib/admin";
import SettingsEditor from "@/components/admin/SettingsEditor";

export const dynamic = "force-dynamic";

const EDITABLE_KEYS = [
  "attendance_points",
  "attendance_reset_hour",
  "max_guild_members",
];

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("platform_settings")
    .select("key, value, description")
    .in("key", EDITABLE_KEYS);

  const settings = (data ?? []).map((row) => ({
    key: row.key,
    value: Number(row.value),
    description: row.description ?? "",
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">플랫폼 설정</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          변경 즉시 반영돼요. 코드 수정 없이 운영 정책을 조정할 수 있어요.
        </p>
      </div>
      <SettingsEditor settings={settings} />
    </div>
  );
}
