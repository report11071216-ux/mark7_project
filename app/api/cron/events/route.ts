import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLostarkEvents } from "@/lib/lostark";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // CRON_SECRET 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // service_role 클라이언트 (RLS 우회 — 이벤트 쓰기 전용)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );

  // 1) 로아 공식 이벤트 가져오기
  const events = await getLostarkEvents();

  // API가 비어서 오면(일시 오류 등) 기존 데이터를 날리지 않고 그대로 둠
  if (events.length === 0) {
    return NextResponse.json({
      ok: true,
      replaced: false,
      count: 0,
      message: "이벤트 응답이 비어 있어 기존 데이터를 유지함",
    });
  }

  // 2) 기존 이벤트 전체 삭제 (끝난 이벤트가 안 남게)
  //    link가 항상 있으므로 'link is not null'로 전체 매칭
  const { error: delError } = await supabase
    .from("lostark_events")
    .delete()
    .not("link", "is", null);

  if (delError) {
    return NextResponse.json(
      { error: "삭제 실패: " + delError.message },
      { status: 500 }
    );
  }

  // 3) 새 이벤트 삽입 (API 순서를 sort_order로 보존)
  const rows = events.map((e, idx) => ({
    link: e.link,
    title: e.title,
    thumbnail: e.thumbnail || null,
    start_date: e.startDate,
    end_date: e.endDate,
    sort_order: idx,
    updated_at: new Date().toISOString(),
  }));

  const { error: insError } = await supabase
    .from("lostark_events")
    .insert(rows);

  if (insError) {
    return NextResponse.json(
      { error: "삽입 실패: " + insError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, replaced: true, count: rows.length });
}
