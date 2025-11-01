import { builder } from "~/src/graphql/builder";

export const OrganizationOrderByInput = builder.enumType('OrganizationOrderByInput', {
  values: {
    createdAt_ASC: { value: 'createdAt_ASC' },
    createdAt_DESC: { value: 'createdAt_DESC' },
    name_ASC: { value: 'name_ASC' },
    name_DESC: { value: 'name_DESC' },
    updatedAt_ASC: { value: 'updatedAt_ASC' },
    updatedAt_DESC: { value: 'updatedAt_DESC' },
  } as const,
});
// bishal kumar adhikari