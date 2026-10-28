import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/guard";
import { signUpload } from "@/lib/cloudinary";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  return NextResponse.json(signUpload());
}
