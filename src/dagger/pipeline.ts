import Client, { connect } from "@dagger.io/dagger";
import { build, test } from "./jobs.ts";

export default function pipeline(src = ".") {
  connect(async (client: Client) => {
    await test(client, src);
    await build(client, src);
  });
}
