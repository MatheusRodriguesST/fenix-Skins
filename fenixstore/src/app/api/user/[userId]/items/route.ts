// src/app/api/user/[userId]/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY env variables");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  const userId = resolvedParams.userId;
  const user = await getUserFromRequest(req);

  if (!user || user.id !== userId) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("user_items")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false }); // Alterado para 'id' (ou outro campo existente); verifique o schema da tabela no Supabase e use uma coluna válida para ordenação, como 'updated_at' ou remova .order se não necessário

    if (error) throw error;
    return NextResponse.json({ ok: true, items: data || [] });
  } catch (err) {
    console.error("user items GET error", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}