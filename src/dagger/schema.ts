import {
  queryType,
  makeSchema,
  dirname,
  join,
  resolve,
  stringArg,
} from "../../deps.ts";

import { clippy, test, build, llvmCov } from "./jobs.ts";

const Query = queryType({
  definition(t) {
    t.string("clippy", {
      args: {
        src: stringArg(),
      },
      resolve: async (_root, args, _ctx) => await clippy(args.src || undefined),
    });
    t.string("test", {
      args: {
        src: stringArg(),
      },
      resolve: async (_root, args, _ctx) => await test(args.src || undefined),
    });
    t.string("build", {
      args: {
        src: stringArg(),
        packageName: stringArg(),
        target: stringArg(),
      },
      resolve: async (_root, args, _ctx) =>
        await build(
          args.src || undefined,
          args.packageName || undefined,
          args.target || undefined
        ),
    });
    t.string("llvmCov", {
      args: {
        src: stringArg(),
      },
      resolve: async (_root, args, _ctx) =>
        await llvmCov(args.src || undefined),
    });
  },
});

const schema = makeSchema({
  types: [Query],
  outputs: {
    schema: resolve(join(dirname(".."), dirname(".."), "schema.graphql")),
    typegen: resolve(join(dirname(".."), dirname(".."), "gen", "nexus.ts")),
  },
});

schema.description = JSON.stringify({
  "clippy.src": "directory",
  "test.src": "directory",
  "build.src": "directory",
  "llvmCov.src": "directory",
  clippy: "file",
  llvmCov: "file",
  build: "directory",
});

export { schema };
