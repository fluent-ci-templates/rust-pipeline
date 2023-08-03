import Client, { connect } from "@dagger.io/dagger";
import * as jobs from "./jobs.ts";

const { build, test } = jobs;

export default function pipeline(src = ".", args: string[] = []) {
  connect(async (client: Client) => {
    if (args.length > 0) {
      await runSpecificJobs(client, args);
      return;
    }

    await test(client, src);
    await build(client, src);
  });
}

async function runSpecificJobs(client: Client, args: string[]) {
  for (const name of args) {
    // deno-lint-ignore no-explicit-any
    const job = (jobs as any)[name];
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    await job(client);
  }
}
