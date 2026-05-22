import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error: fetchError } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "current_guardian_index")
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const current = Number(data?.value ?? 0);
  const next = (current + 1) % 8;

  const { error: updateError } = await supabase
    .from("platform_settings")
    .update({ value: next })
    .eq("key", "current_guardian_index");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, from: current, to: next });
}
