import { Directory, DirectoryID, File, Client } from "../../sdk/client.gen.ts";
import { connect } from "../../sdk/connect.ts";

export enum Job {
  clippy = "clippy",
  test = "test",
  build = "build",
  llvmCov = "llvm_cov",
}

export const exclude = ["target", ".git", ".devbox", ".fluentci"];

export const getDirectory = async (
  client: Client,
  src: string | Directory | undefined = "."
) => {
  if (src instanceof Directory) {
    return src;
  }
  if (typeof src === "string") {
    try {
      const directory = client.loadDirectoryFromID(src as DirectoryID);
      await directory.id();
      return directory;
    } catch (_) {
      return client.host
        ? client.host().directory(src)
        : client.currentModule().source().directory(src);
    }
  }
  return client.host
    ? client.host().directory(src)
    : client.currentModule().source().directory(src);
};

/**
 * @function
 * @description Run clippy
 * @param {string | Directory | undefined} src
 * @returns {string}
 */
export async function clippy(
  src: string | Directory | undefined = "."
): Promise<File | string> {
  let id = "";
  await connect(async (client: Client) => {
    const context = await getDirectory(client, src);
    const ctr = client
      .pipeline(Job.clippy)
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
}

/**
 * @function
 * @description Generate llvm coverage report
 * @param {string | Directory | undefined} src
 * @returns {string}
 */
export async function llvmCov(
  src: string | Directory | undefined = "."
): Promise<File | string> {
  let id = "";
  await connect(async (client: Client) => {
    const context = await getDirectory(client, src);
    const ctr = client
      .pipeline(Job.llvmCov)
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
}

/**
 * @function
 * @description Run tests
 * @param {string | Directory | undefined} src
 * @param {string[]} options
 * @returns {string}
 */
export async function test(
  src: string | Directory | undefined = ".",
  options: string[] = []
): Promise<string> {
  await connect(async (client: Client) => {
    const context = await getDirectory(client, src);
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
}

/**
 * @function
 * @description Build the project
 * @param {string | Directory | undefined} src
 * @param {string} packageName
 * @param {string} target
 * @param {string[]} options
 * @returns {string}
 */
export async function build(
  src: string | Directory | undefined = ".",
  packageName?: string,
  target = "x86_64-unknown-linux-gnu",
  options: string[] = []
): Promise<Directory | string> {
  let id = "";
  await connect(async (client: Client) => {
    const context = await getDirectory(client, src);
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
      )
      .withExec(["cp", "-r", `/app/target/${target}`, "/"]);

    const result = await ctr.stdout();

    console.log(result);
    id = await ctr.directory(`/${target}`).id();
  });
  return id;
}

export type JobExec =
  | ((src?: string | Directory | undefined) => Promise<Directory | string>)
  | ((src?: string | Directory | undefined) => Promise<File | string>)
  | ((src?: string | Directory | undefined) => Promise<string>);

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
