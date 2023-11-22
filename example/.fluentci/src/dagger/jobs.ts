import Client from "../../deps.ts";
import { Directory, DirectoryID } from "../../sdk/client.gen.ts";
import { connect } from "../../sdk/connect.ts";

export enum Job {
  clippy = "clippy",
  test = "test",
  build = "build",
  llvmCov = "llvm_cov",
}

export const exclude = ["target", ".git", ".devbox", ".fluentci"];

const getDirectory = (
  client: Client,
  src: string | Directory | undefined = "."
) => {
  if (typeof src === "string" && src.startsWith("core.Directory")) {
    return client.directory({
      id: src as DirectoryID,
    });
  }
  return src instanceof Directory ? src : client.host().directory(src);
};

export const clippy = async (src: string | Directory | undefined = ".") => {
  let id = "";
  await connect(async (client: Client) => {
    const context = getDirectory(client, src);
    const ctr = client
      .pipeline(Job.test)
      .container()
      .from("rust:1.73-bookworm")
      .withExec(["apt-get", "update"])
      .withExec(["apt-get", "install", "-y", "build-essential", "pkg-config"])
      .withExec(["rustup", "component", "add", "clippy"])
      .withExec(["cargo", "install", "clippy-sarif", "--version", "0.3.0"])
      .withExec(["cargo", "install", "sarif-fmt", "--version", "0.3.0"])
      .withDirectory("/app", context, { exclude })
      .withWorkdir("/app")
      .withMountedCache("/app/target", client.cacheVolume("target"))
      .withMountedCache("/root/cargo/registry", client.cacheVolume("registry"))
      .withExec([
        "sh",
        "-c",
        "cargo clippy \
        --all-features \
        --message-format=json | clippy-sarif | tee rust-clippy-results.sarif | sarif-fmt",
      ])
      .withExec(["ls", "-la", "/app"]);

    const results = await ctr.file("/app/rust-clippy-results.sarif");
    results.export("./rust-clippy-results.sarif");
    await ctr.stdout();
    id = await results.id();
  });
  return id;
};

export const llvmCov = async (src: string | Directory | undefined = ".") => {
  let id = "";
  await connect(async (client: Client) => {
    const context = getDirectory(client, src);
    const ctr = client
      .pipeline(Job.test)
      .container()
      .from("rust:1.73-bookworm")
      .withExec(["apt-get", "update"])
      .withExec([
        "apt-get",
        "install",
        "-y",
        "build-essential",
        "wget",
        "pkg-config",
      ])
      .withExec(["rustup", "component", "add", "llvm-tools"])
      .withExec([
        "wget",
        "https://github.com/taiki-e/cargo-llvm-cov/releases/download/v0.5.36/cargo-llvm-cov-x86_64-unknown-linux-gnu.tar.gz",
      ])
      .withExec([
        "tar",
        "xvf",
        "cargo-llvm-cov-x86_64-unknown-linux-gnu.tar.gz",
      ])
      .withExec(["mv", "cargo-llvm-cov", "/usr/local/bin"])
      .withDirectory("/app", context, { exclude })
      .withWorkdir("/app")
      .withMountedCache("/app/target", client.cacheVolume("target"))
      .withMountedCache("/root/cargo/registry", client.cacheVolume("registry"))
      .withExec([
        "sh",
        "-c",
        "cargo llvm-cov \
        --all-features \
        --lib \
        --workspace \
        --lcov \
        --output-path \
          lcov.info",
      ])
      .withExec(["ls", "-la", "/app"]);

    const lcov = ctr.file("/app/lcov.info");
    await lcov.export("./lcov.info");
    await ctr.stdout();
    id = await lcov.id();
  });
  return id;
};

export const test = async (
  src: string | Directory | undefined = ".",
  options: string[] = []
) => {
  await connect(async (client: Client) => {
    const context = getDirectory(client, src);
    const ctr = client
      .pipeline(Job.test)
      .container()
      .from("rust:latest")
      .withDirectory("/app", context, { exclude })
      .withWorkdir("/app")
      .withMountedCache("/app/target", client.cacheVolume("target"))
      .withMountedCache("/root/cargo/registry", client.cacheVolume("registry"))
      .withExec(["cargo", "test", ...options]);

    const result = await ctr.stdout();

    console.log(result);
  });
  return "Done";
};

export const build = async (
  src: string | Directory | undefined = ".",
  packageName?: string,
  target = "x86_64-unknown-linux-gnu",
  options: string[] = []
) => {
  let id = "";
  await connect(async (client: Client) => {
    const context = getDirectory(client, src);
    const ctr = client
      .pipeline(Job.build)
      .container()
      .from("rust:latest")
      .withDirectory("/app", context, { exclude })
      .withWorkdir("/app")
      .withMountedCache("/app/target", client.cacheVolume("target"))
      .withMountedCache("/root/cargo/registry", client.cacheVolume("registry"))
      .withExec(
        packageName
          ? [
              "cargo",
              "build",
              "--release",
              "-p",
              packageName,
              "--target",
              target,
              ...options,
            ]
          : ["cargo", "build", "--release", "--target", target, ...options]
      );

    const result = await ctr.stdout();

    console.log(result);
    id = await ctr.directory("/app/target").id();
  });
  return id;
};

export type JobExec = (src?: string) =>
  | Promise<string>
  | ((
      src?: string,
      packageName?: string,
      target?: string,
      options?: {
        ignore: string[];
      }
    ) => Promise<string>)
  | ((
      src?: string,
      options?: {
        ignore: string[];
      }
    ) => Promise<string>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.clippy]: clippy,
  [Job.test]: test,
  [Job.build]: build,
  [Job.llvmCov]: llvmCov,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.clippy]: "Run clippy",
  [Job.test]: "Run tests",
  [Job.build]: "Build the project",
  [Job.llvmCov]: "Generate llvm coverage report",
};
