import {
  build,
  test,
} from "https://pkg.fluentci.io/rust_pipeline@v0.8.0/mod.ts";

await test();
await build();
