import {
  build,
  test,
} from "https://pkg.fluentci.io/rust_pipeline@v0.8.2/mod.ts";

await test();
await build();
