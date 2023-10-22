import {
  build,
  test,
} from "https://pkg.fluentci.io/rust_pipeline@v0.6.0/mod.ts";

await test();
await build();
