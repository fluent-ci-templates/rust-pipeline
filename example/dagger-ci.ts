import Client, { connect } from "@dagger.io/dagger";
import { Dagger } from "https://deno.land/x/rust_pipeline@v0.1.1/mod.ts";

const { build, test } = Dagger;

function pipeline(src = ".") {
  connect(async (client: Client) => {
    await test(client, src);
    await build(client, src);
  });
}

pipeline();
