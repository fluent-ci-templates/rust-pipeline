import Client from "@fluentci.io/dagger";

export enum Job {
  test = "test",
  build = "build",
}

export const test = async (
  client: Client,
  src = ".",
  options: string[] = []
) => {
  const context = client.host().directory(src);
  const ctr = client
    .pipeline(Job.test)
    .container()
    .from("rust:latest")
    .withDirectory("/app", context, {
      exclude: ["target", ".git", ".devbox", ".fluentci"],
    })
    .withWorkdir("/app")
    .withMountedCache("/app/target", client.cacheVolume("target"))
    .withMountedCache("/root/cargo/registry", client.cacheVolume("registry"))
    .withExec(["cargo", "test", ...options]);

  const result = await ctr.stdout();

  console.log(result);
};

export const build = async (
  client: Client,
  src = ".",
  options: string[] = []
) => {
  const context = client.host().directory(src);
  const ctr = client
    .pipeline(Job.build)
    .container()
    .from("rust:latest")
    .withDirectory("/app", context, {
      exclude: ["target", ".git", ".devbox", ".fluentci"],
    })
    .withWorkdir("/app")
    .withMountedCache("/app/target", client.cacheVolume("target"))
    .withMountedCache("/root/cargo/registry", client.cacheVolume("registry"))
    .withExec(["cargo", "build", "--release", ...options]);

  const result = await ctr.stdout();

  console.log(result);
};

export type JobExec = (
  client: Client,
  src?: string
) =>
  | Promise<void>
  | ((
      client: Client,
      src?: string,
      options?: {
        ignore: string[];
      }
    ) => Promise<void>);

export const runnableJobs: Record<Job, JobExec> = {
  [Job.test]: test,
  [Job.build]: build,
};

export const jobDescriptions: Record<Job, string> = {
  [Job.test]: "Run tests",
  [Job.build]: "Build the project",
};
