import { notFound } from "next/navigation";
import { getClaimFromDb } from "@/lib/insurance";
import { ClaimDetailClient } from "./claim-detail-client";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaimFromDb(id);
  if (!claim) notFound();
  return <ClaimDetailClient claim={claim} />;
}
