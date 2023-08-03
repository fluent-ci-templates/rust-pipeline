import Client from "@dagger.io/dagger";
import { existsSync } from "fs";

export const lint = async (client: Client, src = ".") => {
  const context = client.host().directory(src);
  let command = ["deno", "lint"];

  if (existsSync("devbox.json")) {
    command = ["sh", "-c", "devbox run -- deno lint"];
  }

  const ctr = client
    .pipeline("lint")
    .container()
    .from("denoland/deno:alpine")
    .withDirectory("/app", context, {
      exclude: [".git", ".devbox", ".fluentci"],
    })
    .withWorkdir("/app")
    .withExec(command);

  const result = await ctr.stdout();

  console.log(result);
};

export const fmt = async (client: Client, src = ".") => {
  const context = client.host().directory(src);
  let command = ["deno", "fmt"];

  if (existsSync("devbox.json")) {
    command = ["sh", "-c", "devbox run -- deno fmt"];
  }

  const ctr = client
    .pipeline("fmt")
    .container()
    .from("denoland/deno:alpine")
    .withDirectory("/app", context, {
      exclude: [".git", ".devbox", ".fluentci"],
    })
    .withWorkdir("/app")
    .withExec(command);

  const result = await ctr.stdout();

  console.log(result);
};

export const test = async (client: Client, src = ".") => {
  const context = client.host().directory(src);
  let command = ["deno", "test", "-A", "--lock-write"];

  if (existsSync("devbox.json")) {
    command = ["sh", "-c", "devbox run -- deno test -A --lock-write"];
  }

  const ctr = client
    .pipeline("test")
    .container()
    .from("denoland/deno:alpine")
    .withDirectory("/app", context, {
      exclude: [".git", ".devbox", ".fluentci"],
    })
    .withWorkdir("/app")
    .withMountedCache("/root/.cache/deno", client.cacheVolume("deno-cache"))
    .withExec(command);

  const result = await ctr.stdout();

  console.log(result);
};
