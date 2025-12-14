// DO NOT USE HARDCODE VALUES FOR VARIABLES IN THE GRAPHQL DOCUMENT NODES, PROVIDE THEM EXPLICITLY IN THE TESTS WHERE THE DOCUMENT NODES ARE USED IN.

import { initGraphQLTada } from "gql.tada";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { introspection } from "./../../../test/graphql/types/gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

export const Query_signIn = gql(`query Query_signIn($input: QuerySignInInput!) {
    signIn(input: $input) {
        authenticationToken
        user {
            addressLine1
            addressLine2
            birthDate
            city
            countryCode
            createdAt
            description
            educationGrade
            emailAddress
            employmentStatus
            homePhoneNumber
            id
            isEmailAddressVerified
            maritalStatus
            mobilePhoneNumber
            name
            natalSex
            postalCode
            role
            state
            workPhoneNumber
        }
    }
}`);

export const Mutation_createOrganization =
	gql(`mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      countryCode
    }
  }`);

export const Mutation_createOrganizationMembership =
	gql(`mutation Mutation_createOrganizationMembership($input: MutationCreateOrganizationMembershipInput!) {
    createOrganizationMembership(input: $input) {
      id
    }
  }`);

export const Query_advertisement = gql(`
  query Advertisement($input: QueryAdvertisementInput!) {
    advertisement(input: $input) {
      id
      name
      description
      type
      startAt
      endAt
      createdAt
      organization {
        id
      }
      attachments {
        mimeType
        url
      }
    }
  }
}`);

export const Query_organization = gql(`
    query Query_organization($input: QueryOrganizationInput!, $first: Int, $after: String, $last: Int, $before: String) {
      organization(input: $input) {
        id
        name
        members(first: $first, after: $after, last: $last, before: $before) {
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
          edges {
            cursor
            node {
              id
              name
              emailAddress
              role
            }
          }
        }
        blockedUsers(first: $first, after: $after, last: $last, before: $before) {
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
          edges {
            cursor
            node {
              id
            }
          }
        }
      }
    }
  `);

export const Mutation_blockUser =
	gql(`mutation Mutation_blockUser($organizationId: ID!, $userId: ID!) {
    blockUser(organizationId: $organizationId, userId: $userId)
}`);

export const Mutation_unblockUser =
	gql(`mutation Mutation_unblockUser($organizationId: ID!, $userId: ID!) {
    unblockUser(organizationId: $organizationId, userId: $userId)
}`);

export const Query_advertisements = gql(`
  query OrganizationAdvertisements(
    $id: String!
    $first: Int
    $last: Int
    $after: String
    $before: String
    $where: AdvertisementWhereInput
  ) {
    organization(input: { id: $id }) {
      advertisements(
        first: $first
        last: $last
        after: $after
        before: $before
        where: $where
      ) {
        edges {
          node {
            createdAt
            description
            organization {
              id
            }
            endAt
            id
            name
            startAt
            type
            attachments {
              mimeType
              url
            }
          }
        }
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
        }
      }
    }
  }
`);

export const Mutation_createAdvertisement = gql(`
  mutation Mutation_createAd($input: MutationCreateAdvertisementInput!) {
    createAdvertisement(input: $input) {
      id
      }
  }
`);
