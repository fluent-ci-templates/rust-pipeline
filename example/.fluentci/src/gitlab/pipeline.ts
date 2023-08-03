import { GitlabCI } from "https://deno.land/x/fluent_gitlab_ci@v0.3.2/mod.ts";
import { build, test } from "./jobs.ts";

const gitlabci = new GitlabCI()
  .image("rust:latest")
  .addJob("test", test)
  .addJob("build", build);

export default gitlabci;
