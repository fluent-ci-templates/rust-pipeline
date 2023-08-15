import { GitlabCI, Job } from "fluent_gitlab_ci";

export function generateYaml(): GitlabCI {
  const setupDagger = `
deno install -A -r https://cli.fluentci.io -n fluentci
curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.8.1 sh
sudo mv bin/dagger /usr/local/bin
dagger version`;

  const test = new Job()
    .beforeScript(setupDagger, {
      multiline: true,
    })
    .script("dagger run fluentci rust_pipeline test build");

  return new GitlabCI().addJob("test", test);
}
