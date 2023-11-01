import Client, { connect } from "../../deps.ts";

export enum Job {
  clippy = "clippy",
  test = "test",
  build = "build",
}

export const exclude = ["target", ".git", ".devbox", ".fluentci"];

export const clippy = async (src = ".") => {
  await connect(async (client: Client) => {
    const context = client.host().directory(src);
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
      ]);

    await ctr
      .file("/app/rust-clippy-results.sarif")
      .export("./rust-clippy-results.sarif");
    await ctr.stdout();
  });
  return "Done";
};

export const test = async (src = ".", options: string[] = []) => {
  await connect(async (client: Client) => {
    const context = client.host().directory(src);
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
  return "done";
};

export const build = async (
  src = ".",
  packageName?: string,
  target = "x86_64-unknown-linux-gnu",
  options: string[] = []
) => {
  await connect(async (client: Client) => {
    const context = client.host().directory(src);
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
  });
  return "done";
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
};

export const jobDescriptions: Record<Job, string> = {
  [Job.clippy]: "Run clippy",
  [Job.test]: "Run tests",
  [Job.build]: "Build the project",
};
