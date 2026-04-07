import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await query("DELETE FROM analyzed_videos WHERE id = $1", [numId]);
  return new NextResponse(null, { status: 204 });
}
