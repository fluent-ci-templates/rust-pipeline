import Client, { connect } from "@dagger.io/dagger";
import { fmt, lint, test } from "./jobs.ts";

export default function pipeline(src = ".") {
  connect(async (client: Client) => {
    await fmt(client, src);
    await lint(client, src);
    await test(client, src);
  });
}
