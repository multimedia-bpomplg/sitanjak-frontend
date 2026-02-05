import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api-harilibur.vercel.app/api", {
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal ambil data libur" },
      { status: 500 },
    );
  }
}
