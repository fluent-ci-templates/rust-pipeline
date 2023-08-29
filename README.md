# Rust Pipeline

[![fluentci pipeline](https://img.shields.io/badge/dynamic/json?label=pkg.fluentci.io&labelColor=%23000&color=%23460cf1&url=https%3A%2F%2Fapi.fluentci.io%2Fv1%2Fpipeline%2Frust_pipeline&query=%24.version)](https://pkg.fluentci.io/rust_pipeline)
[![deno module](https://shield.deno.dev/x/rust_pipeline)](https://deno.land/x/rust_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.34)
[![](https://img.shields.io/codecov/c/gh/fluent-ci-templates/rust-pipeline)](https://codecov.io/gh/fluent-ci-templates/rust-pipeline)

A ready-to-use CI/CD Pipeline for your Rust projects.
## 🚀 Usage

Run the following command in your Rust Project:

```bash
dagger run fluentci rust_pipeline
```

Or if you want to run specific jobs:

```bash
dagger run fluentci rust_pipeline test build
```


if you want to use it as a template:

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
import { Client, connect } from "https://esm.sh/@dagger.io/dagger@0.8.1";
import { Dagger } from "https://pkg.fluentci.io/rust_pipeline/mod.ts";

const { build, test } = Dagger;

function pipeline(src = ".") {
  connect(async (client: Client) => {
    await test(client, src);
    await build(client, src);
  });
}

pipeline();
```
