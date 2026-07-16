import { listClaimsFromDb } from "@/lib/insurance";
import { InsuranceClient } from "./insurance-client";

export default async function InsurancePage() {
  const claims = await listClaimsFromDb();
  return <InsuranceClient initialClaims={claims} />;
}
