import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const sortOrderEnum = z.enum(["ASC", "DESC"]);

export const SortOrder = builder.enumType("SortOrder", {
  description: "Sort direction: ASC or DESC",
  values: {
    ASC: { description: "Ascending", value: "ASC" },
    DESC: { description: "Descending", value: "DESC" },
  },
});

export default SortOrder;
