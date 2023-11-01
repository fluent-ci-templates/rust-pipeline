import { gql } from "../../deps.ts";

export const clippy = gql`
  query clippy($src: String!) {
    clippy(src: $src)
  }
`;

export const test = gql`
  query test($src: String!) {
    test(src: $src)
  }
`;

export const build = gql`
  query build($src: String!) {
    build(src: $src)
  }
`;

export const llvmCov = gql`
  query llvmCov($src: String!) {
    llvmCov(src: $src)
  }
`;
