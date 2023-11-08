import {
  build,
  test,
} from "https://pkg.fluentci.io/rust_pipeline@v0.7.0/mod.ts";

await test();
await build();
