import Client from "@dagger.io/dagger";

export const test = async (
  client: Client,
  src = ".",
  options: string[] = [],
) => {
  const context = client.host().directory(src);
  const ctr = client
    .pipeline("test")
    .container()
    .from("rust:latest")
    .withDirectory("/app", context, { exclude: ["target", ".git"] })
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
  options: string[] = [],
) => {
  const context = client.host().directory(src);
  const ctr = client
    .pipeline("build")
    .container()
    .from("rust:latest")
    .withDirectory("/app", context, { exclude: ["target", ".git"] })
    .withWorkdir("/app")
    .withMountedCache("/app/target", client.cacheVolume("target"))
    .withMountedCache("/root/cargo/registry", client.cacheVolume("registry"))
    .withExec(["cargo", "build", "--release", ...options]);

  const result = await ctr.stdout();

  console.log(result);
};
