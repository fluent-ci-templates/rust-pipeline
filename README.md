# Rust Pipeline

[![deno module](https://shield.deno.dev/x/rust_pipeline)](https://deno.land/x/rust_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.34)
[![](https://img.shields.io/codecov/c/gh/fluent-ci-templates/rust-pipeline)](https://codecov.io/gh/fluent-ci-templates/rust-pipeline)

A ready-to-use CI/CD Pipeline for your Rust projects.
## 🚀 Usage

Run the following command:

```bash
dagger run fluentci rust_pipeline
```

Or, if you want to use it as a template:

```bash
fluentci init -t rust
```

This will create a `.fluentci` folder in your project.

Now you can run the pipeline with:

```bash
dagger run fluentci .
```

## Jobs

| Job   | Description        |
| ----- | ------------------ |
| build | build your project |
| test  | Run your tests     |

## Programmatic usage

You can also use this pipeline programmatically:

```ts
import Client, { connect } from "@dagger.io/dagger";
import { Dagger } from "https://deno.land/x/rust_pipeline/mod.ts";

const { build, test } = Dagger;

function pipeline(src = ".") {
  connect(async (client: Client) => {
    await test(client, src);
    await build(client, src);
  });
}

pipeline();
```
