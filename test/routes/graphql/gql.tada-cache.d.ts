/* eslint-disable */
/* prettier-ignore */
import type { TadaDocumentNode, $tada } from 'gql.tada';

declare module 'gql.tada' {
 interface setupCache {
    "query helloQuery($name: String!) {\n    hello(name: $name)\n}":
      TadaDocumentNode<{ hello: string | null; }, { name: string; }, void>;
  }
}
