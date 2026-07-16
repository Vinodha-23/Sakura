import { config } from "dotenv";
config({ path: ".env.local" });

import { readFile } from "fs/promises";
import { importPatientsFromCsv } from "../src/lib/patients";

async function main() {
  const csv = await readFile("./public/samples/patients-sample.csv", "utf8");
  const result = await importPatientsFromCsv(csv, {
    doctorName: "Dr. Sarah Chen",
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
