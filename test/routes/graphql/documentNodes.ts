// DO NOT USE HARDCODE VALUES FOR VARIABLES IN THE GRAPHQL DOCUMENT NODES, PROVIDE THEM EXPLICITLY IN THE TESTS WHERE THE DOCUMENT NODES ARE USED IN.
import { graphql } from "gql.tada";

export const helloQueryDoc = graphql(`query helloQuery($name: String!) {
    hello(name: $name)
}`);
