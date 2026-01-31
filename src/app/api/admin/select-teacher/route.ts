import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("admin select teacher called:", body);
    // NOTE: this currently only logs the requested assignment.
    // To persist this you should implement server logic to update the related lesson/exam/assignment.
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
