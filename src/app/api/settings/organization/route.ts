import { NextResponse } from "next/server";
import { getOrganization, updateOrganization } from "@/lib/settings";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await getOrganization();
  return NextResponse.json({ organization });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const organization = await updateOrganization(
    {
      hospitalName: body.hospitalName,
      department: body.department,
      address: body.address,
      phone: body.phone,
      npiNumber: body.npiNumber,
    },
    { id: session.user.id, name: session.user.name }
  );
  return NextResponse.json({ organization });
}
