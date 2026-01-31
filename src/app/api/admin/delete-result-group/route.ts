import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    let ids: number[] = [];
    // Inspect content-type first to decide how to parse body (avoid consuming body twice)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      ids = body?.ids || [];
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      const all = fd.getAll("ids");
      if (all && all.length > 0) {
        ids = all.map((v) => parseInt(String(v)));
      } else {
        const single = fd.get("ids")?.toString() || "";
        if (single.startsWith("[")) ids = JSON.parse(single);
        else if (single.includes(",")) ids = single.split(",").map((s) => parseInt(s));
        else if (single) ids = [parseInt(single)];
      }
    } else {
      // fallback: try json, then formData — but avoid double-reading by catching specific errors
      try {
        const body = await req.json();
        ids = body?.ids || [];
      } catch (e) {
        try {
          const fd = await req.formData();
          const all = fd.getAll("ids");
          if (all && all.length > 0) ids = all.map((v) => parseInt(String(v)));
        } catch (e2) {
          console.error("failed parse body", e2);
        }
      }
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'no ids' }, { status: 400 });
    }

    await prisma.result.deleteMany({ where: { id: { in: ids } } });
    try { /* revalidate if needed */ } catch(e) {}
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
