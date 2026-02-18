// DO NOT USE HARDCODE VALUES FOR VARIABLES IN THE GRAPHQL DOCUMENT NODES, PROVIDE THEM EXPLICITLY IN THE TESTS WHERE THE DOCUMENT NODES ARE USED IN.

import { initGraphQLTada } from "gql.tada";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { introspection } from "./gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

export const Mutation_createUser =
	gql(`mutation Mutation_createUser($input: MutationCreateUserInput!) {
    createUser(input: $input){
        authenticationToken
        refreshToken
        user {
            addressLine1
            addressLine2
            birthDate
            city
            id
            countryCode
            createdAt
            description
            educationGrade
            emailAddress
            employmentStatus
            homePhoneNumber
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

export const Mutation_deleteCurrentUser =
	gql(`mutation Mutation_deleteCurrentUser {
    deleteCurrentUser {
        id
    }
}`);

export const Mutation_deleteUser =
	gql(`mutation Mutation_deleteUser($input: MutationDeleteUserInput!) {
    deleteUser(input: $input) {
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
}`);

export const Mutation_signUp =
	gql(`mutation Mutation_signUp($input: MutationSignUpInput!) {
    signUp(input: $input) {
        authenticationToken
        refreshToken
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

export const Mutation_updateCurrentUser =
	gql(`mutation Mutation_updateCurrentUser($input: MutationUpdateCurrentUserInput!) {
    updateCurrentUser(input: $input) {
        addressLine1
        addressLine2
        avatarMimeType
        avatarURL
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
        naturalLanguageCode
        postalCode
        role
        state
        workPhoneNumber
    }
}`);

export const Mutation_updateUser =
	gql(`mutation Mutation_updateUser($input: MutationUpdateUserInput!) {
    updateUser(input: $input) {
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
}`);

export const Query_currentUser = gql(`query Query_currentUser {
    currentUser {
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
}`);

export const Query_renewAuthenticationToken =
	gql(`query Query_renewAuthenticationToken {
    renewAuthenticationToken
}`);

export const Query_signIn = gql(`query Query_signIn($input: QuerySignInInput!) {
    signIn(input: $input) {
        authenticationToken
        refreshToken
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

export const Mutation_revokeRefreshToken =
	gql(`mutation Mutation_revokeRefreshToken($refreshToken: String!) {
    revokeRefreshToken(refreshToken: $refreshToken)
}`);

export const Mutation_requestPasswordReset =
	gql(`mutation Mutation_requestPasswordReset($input: MutationRequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
        success
        message
    }
}`);

export const Mutation_resetPassword =
	gql(`mutation Mutation_resetPassword($input: MutationResetPasswordInput!) {
    resetPassword(input: $input) {
        success
        authenticationToken
        refreshToken
    }
}`);

export const Query_verifyPasswordResetToken =
	gql(`query Query_verifyPasswordResetToken($input: QueryVerifyPasswordResetTokenInput!) {
    verifyPasswordResetToken(input: $input) {
        valid
        expiresAt
    }
}`);

export const Query_user = gql(`query Query_user($input: QueryUserInput!) {
    user(input: $input) {
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
}`);

export const Query_user_workPhoneNumber =
	gql(`query Query_user_workPhoneNumber($input: QueryUserInput!) {
    user(input: $input) {
        workPhoneNumber
    }
}`);

export const Query_user_mobilePhoneNumber =
	gql(`query Query_user_mobilePhoneNumber($input: QueryUserInput!) {
    user(input: $input) {
        mobilePhoneNumber
    }
}`);

export const Query_allUsers = gql(`
  query Query_allUsers(
    $first: Int,
    $after: String,
    $last: Int,
    $before: String,
    $where: QueryAllUsersWhereInput
  ) {
    allUsers(
      first: $first,
      after: $after,
      last: $last,
      before: $before,
      where: $where
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          emailAddress
          role
          createdAt
          isEmailAddressVerified
          addressLine1
          addressLine2
          birthDate
          city
          countryCode
          description
          educationGrade
          employmentStatus
          homePhoneNumber
          maritalStatus
          mobilePhoneNumber
          natalSex
          postalCode
          state
          workPhoneNumber
        }
      }
    }
  }
`);

export const Query_user_creator =
	gql(`query Query_user_creator($input: QueryUserInput!) {
    user(input: $input) {
        creator {
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

export const Query_user_updatedAt =
	gql(`query Query_user_updatedAt($input: QueryUserInput!) {
    user(input: $input) {
        updatedAt
    }
}`);

export const Query_user_city =
	gql(`query Query_user_city($input: QueryUserInput!) {
    user(input: $input) {
        city
    }
}`);

export const Query_user_natalSex =
	gql(`query Query_user_natalSex($input: QueryUserInput!) {
    user(input: $input) {
        natalSex
    }
  }`);

export const Query_user_emailAddress =
	gql(`query Query_user_emailAddress($input: QueryUserInput!) {
    user(input: $input) {
        emailAddress
    }
}`);

export const Query_user_maritalStatus =
	gql(`query Query_user_maritalStatus($input: QueryUserInput!) {
    user(input: $input) {
        maritalStatus
    }
}`);

export const Query_user_updater =
	gql(`query Query_user_updater($input: QueryUserInput!) {
    user(input: $input) {
        updater {
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

export const Query_user_updater_simple =
	gql(`query Query_user_updater_simple($input: QueryUserInput!) {
    user(input: $input) {
        updater {
            id
        }
    }
}`);

export const Query_fund = gql(`query Query_fund($input: QueryFundInput!) {
    fund(input: $input) {
      id
      isTaxDeductible
      name
      isDefault
      isArchived
      referenceNumber
    }
  }`);

export const Query_fundCampaign =
	gql(`query Query_fundCampaign($input: QueryFundCampaignInput!) {
    fundCampaign(input: $input) {
      id
      name
      goalAmount
      amountRaised
    }
  }`);

export const Query_fundCampaignPledge =
	gql(`query Query_fundCampaignPledge($input: QueryFundCampaignPledgeInput!) {
  fundCampaignPledge(input: $input) {
    id
    note
    amount
  }
}`);

export const Query_getPledgesByUserId =
	gql(`query Query_getPledgesByUserId($input: QueryFundCampaignPledgesByUserInput! , $where: QueryPledgeWhereInput, $orderBy: QueryPledgeOrderByInput) {
  getPledgesByUserId(input: $input , where: $where , orderBy: $orderBy) {
    id
    note
    amount
    campaign {
    endAt
    }
    pledger {
    id
    }
  }
}`);

export const Query_chatMessage = gql(`
  query Query_chatMessage($input: QueryChatMessageInput!) {
    chatMessage(input: $input) {
      id
    }
  }
`);

export const Query_chat_members = gql(`
query ChatMembers($input: QueryChatInput!, $first: Int, $last: Int, $after: String, $before: String) {
  chat(input: $input) {
    id
    members(first: $first, last: $last, after: $after, before: $before) {
      edges { cursor node { user { id } role } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
`);

export const Mutation_createOrganization =
	gql(`mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      countryCode
      isUserRegistrationRequired
    }
  }`);

export const Mutation_updateOrganization =
	gql(`mutation Mutation_updateOrganization($input: MutationUpdateOrganizationInput!) {
		updateOrganization(input: $input) {
			id
			name
			description
			addressLine1
			addressLine2
			city
			state
			postalCode
			countryCode
			isUserRegistrationRequired
			avatarMimeType
		}
  }`);

export const Mutation_createFund =
	gql(`mutation Mutation_createFund($input: MutationCreateFundInput!) {
    createFund(input: $input) {
      id
      name
      isTaxDeductible
      isDefault
      isArchived
      referenceNumber
    }
  }`);

export const Mutation_updateFund =
	gql(`mutation Mutation_updateFund($input: MutationUpdateFundInput!) {
    updateFund(input: $input) {
      id
      name
      isTaxDeductible
      isDefault
      isArchived
      referenceNumber
    }
  }`);

export const Mutation_createFundCampaign =
	gql(`mutation Mutation_createFundCampaign($input: MutationCreateFundCampaignInput!) {
    createFundCampaign(input: $input) {
      id
      name
      goalAmount
    }
  }`);

export const Mutation_createFundCampaignPledge =
	gql(`mutation Mutation_createFundCampaignPledge($input: MutationCreateFundCampaignPledgeInput!) {
    createFundCampaignPledge(input: $input) {
      id
      note
      amount
    }
  }`);

export const Mutation_updateFundCampaignPledge =
	gql(`mutation Mutation_updateFundCampaignPledge($input: MutationUpdateFundCampaignPledgeInput!) {
    updateFundCampaignPledge(input: $input) {
      id
      note
      amount
    }
  }`);

export const Mutation_createOrganizationMembership =
	gql(`mutation Mutation_createOrganizationMembership($input: MutationCreateOrganizationMembershipInput!) {
    createOrganizationMembership(input: $input) {
      id
    }
  }`);

export const Mutation_deleteFund =
	gql(`mutation Mutation_deleteFund($input: MutationDeleteFundInput!) {
    deleteFund(input: $input) {
      id
      name
      isTaxDeductible
    }
}`);

export const Mutation_deleteFundCampaign =
	gql(`mutation Mutation_deleteFundCampaign($input: MutationDeleteFundCampaignInput!) {
  deleteFundCampaign(input: $input) {
    id
    name
    goalAmount
    }
  }`);

export const Mutation_deleteFundCampaignPledge =
	gql(`mutation Mutation_deleteFundCampaignPledge($input: MutationDeleteFundCampaignPledgeInput!) {
  deleteFundCampaignPledge(input: $input) {
    id
    note
    amount
  }
  }`);

export const Mutation_deleteOrganization =
	gql(`mutation Mutation_deleteOrganization($input: MutationDeleteOrganizationInput!) {
    deleteOrganization(input: $input) {
      id
      name
      countryCode
    }
}`);

export const Mutation_deleteOrganizationMembership =
	gql(`mutation Mutation_deleteOrganizationMembership($input: MutationDeleteOrganizationMembershipInput!) {
    deleteOrganizationMembership(input: $input) {
      id
      name
      countryCode
    }
}`);

export const Query_post = gql(`query Query_post($input: QueryPostInput!) {
    post(input: $input) {
        id
        organization {
            countryCode
        }
    }
}`);

export const Query_event = gql(`query Query_event($input: QueryEventInput!) {
    event(input: $input) {
        id
        name
        description
        startAt
        endAt
        isInviteOnly
        creator {
            id
            name
        }
        organization {
            id
            countryCode
        }
    }
}`);

export const Mutation_createEvent =
	gql(`mutation Mutation_createEvent($input: MutationCreateEventInput!) {
    createEvent(input: $input) {
        id
        name
        description
        startAt
        endAt
        createdAt
        creator{
            id
            name
        }
        organization {
            id
            countryCode
        }
    }
}`);

export const Mutation_sendEventInvitations =
	gql(`mutation Mutation_sendEventInvitations($input: SendEventInvitationsInput!) {
    sendEventInvitations(input: $input) {
        id
        inviteeEmail
        inviteeName
        invitationToken
        status
        expiresAt
        createdAt
    }
}`);

export const Query_tag = gql(`
    query tag($input:QueryTagInput!) {
  tag(input: $input) {
    id
    name
    organization {
      id
    }
    createdAt
  }
}`);

export const Query_userTags = gql(`
  query userTags($userId: ID!) {
    userTags(userId: $userId) {
      id
      name
      creator {
        id
      }
      assignees(first: 10){
        edges {
          node {
            id
          }
        }
      }
    }
  }
`);

export const Mutation_createTag = gql(`
  mutation createTag($input: MutationCreateTagInput!) {
    createTag(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_createTagFolder = gql(`
  mutation createTagFolder($input: MutationCreateTagFolderInput!) {
    createTagFolder(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_assignUserTag = gql(`
  mutation assignUserTag($assigneeId: ID!, $tagId: ID!) {
    assignUserTag(
      assigneeId: $assigneeId
      tagId: $tagId
    )
  }
`);

export const Mutation_deleteTag = gql(`
  mutation Mutation_deleteTag($input: MutationDeleteTagInput!) {
    deleteTag(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_updateTagFolder = gql(`
  mutation Mutation_updateTagFolder($input: MutationUpdateTagFolderInput!) {
    updateTagFolder(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_deleteTagFolder = gql(`
  mutation Mutation_deleteTagFolder($input: MutationDeleteTagFolderInput!) {
    deleteTagFolder(input: $input) {
      id
      name
    }
  }
`);

export const Query_organizations = gql(`
	query Query_organizations {
		organizations {
			id
			name
			description
			addressLine1
			addressLine2
			city
			state
			postalCode
			countryCode
			creator {
				id
				name
				emailAddress
			}
			createdAt
			updatedAt
			members(first: 10) {
				edges {
					node {
						id
						name
						emailAddress
						role
					}
				}
			}
		}
	}
`);

export const Query_agendaFolder = gql(`
  query agendaFolder($input:QueryAgendaFolderInput!) {
    agendaFolder(input: $input) {
      id
      name
      sequence
      description
      createdAt
      updatedAt
      creator {
        id
      }
      event {
        id
      }
      organization {
        id
      }
    }
  }
`);

export const Query_agendaFolder_Restricted = gql(`
  query agendaFolder($input:QueryAgendaFolderInput!) {
    agendaFolder(input: $input) {
      id
      name
      sequence
      description
      event {
        id
      }
      organization {
        id
      }
    }
  }
`);

export const Query_blockedUsers = gql(`
	query BlockedUsers(
		$organizationId: String!
		$first: Int
		$after: String
		$last: Int
		$before: String
	) {
		organization(input:{id: $organizationId}) {
			id
			blockedUsers(
				first: $first
				after: $after
				last: $last
				before: $before
			) {
				edges {
					cursor
					node {
						id
						name
						role
					}
				}
				pageInfo {
					hasNextPage
					hasPreviousPage
					startCursor
					endCursor
				}
			}
		}
	}
`);

export const Query_organization = gql(`
    query Organization($input: QueryOrganizationInput!, $first: Int, $after: String,$last: Int, $before: String, $where: MembersWhereInput) {
      organization(input: $input) {
        id
        name
        members(first: $first, after: $after, last: $last, before: $before, where: $where) {
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
              role
            }
          }
        }
      }
    }
  `);

export const Query_agendaCategoriesByEventId =
	gql(`query Query_agendaCategoriesByEventId($eventId: ID!) {
  agendaCategoriesByEventId(eventId: $eventId) {
    id
    name
    description
    createdAt
    creator {
      id
      name
    }
  }
}`);

export const Query_agendaFoldersByEventId = gql(`
    query Query_agendaFoldersByEventId($eventId: ID!) {
      agendaFoldersByEventId(eventId: $eventId) {
        id
        name
        description
        createdAt
        sequence
        event {
          id
          name
        }
        creator {
          id
          name
        }
      }
    }
  `);

export const Mutation_createAgendaFolder = gql(`
  mutation Mutation_createAgendaFolder($input: MutationCreateAgendaFolderInput!) {
    createAgendaFolder(input: $input) {
      id
      createdAt
      description
      name
      sequence
      event {
        id
        name
      }
      creator {
        id
        name
      }
    }
  }
`);

export const Mutation_deleteAgendaFolder = gql(`
  mutation Mutation_deleteAgendaFolder($input: MutationDeleteAgendaFolderInput!) {
    deleteAgendaFolder(input: $input) {
      id
      name
      description
    }
  }
`);

export const Mutation_updateAgendaFolder = gql(`
  mutation Mutation_updateAgendaFolder($input: MutationUpdateAgendaFolderInput!) {
    updateAgendaFolder(input: $input) {
      id
      name
      description
      sequence
      event {
        id
      }
    }
  }
`);

export const MUTATION_updateAgendaItemSequence = gql(`
  mutation Mutation_updateAgendaItemSequence($input: MutationUpdateAgendaItemSequenceInput!) {
    updateAgendaItemSequence(input: $input) {
      id
      sequence
    }
  }
`);

export const Mutation_createAgendaCategory = gql(`
  mutation Mutation_createAgendaCategory($input: MutationCreateAgendaCategoryInput!) {
    createAgendaCategory(input: $input) {
      id
      name
      description
      event {
        id
        name
      }
      creator {
        id
        name
      }
    }
  }
`);

export const Mutation_createAgendaItem = gql(`
  mutation Mutation_createAgendaItem($input: MutationCreateAgendaItemInput!) {
    createAgendaItem(input: $input) {
      id
      name
      description
      duration
      notes
      attachments {
        name
        fileHash
        mimeType
        objectName
      }
      category {
        id
        name
      }
      event {
        id
        name
        startAt
      }
      url {
        id
        url
      }
      creator {
        id
        name
      }
      type
    }
  }
`);

export const Mutation_updateAgendaCategory = gql(`
  mutation Mutation_updateAgendaCategory($input: MutationUpdateAgendaCategoryInput!) {
    updateAgendaCategory(input: $input) {
      id
      name
      description
      updatedAt
      updater {
        id
        name
      }
    }
  }
`);

export const Mutation_updateAgendaItem = gql(`
  mutation Mutation_updateAgendaItem($input: MutationUpdateAgendaItemInput!) {
    updateAgendaItem(input: $input) {
      id
      name
      description
      duration
      notes
    	attachments {
        name
        fileHash
        objectName
        mimeType
      }
    	category {
        id
        name
      }
      url {
        id
        url
      }
      folder {
        id
        name
      }
      updater {
        id
        name
      }
      updatedAt
    }
  }
`);

export const Mutation_updateUserPassword = gql(`
    mutation Mutation_updateUserPassword($input: MutationUpdateUserPasswordInput!) {
      updateUserPassword(input: $input)
  }
`);

export const Mutation_adminUpdateUserPassword = gql(`
    mutation Mutation_adminUpdateUserPassword($input: MutationAdminUpdateUserPasswordInput!) {
      adminUpdateUserPassword(input: $input)
  }
`);

export const Mutation_deleteAgendaCategory = gql(`
  mutation Mutation_deleteAgendaCategory($input: MutationDeleteAgendaCategoryInput!) {
    deleteAgendaCategory(input: $input) {
      id
      name
      description
    }
  }
`);

export const Mutation_deleteAgendaItem = gql(`
  mutation Mutation_deleteAgendaItem($input: MutationDeleteAgendaItemInput!) {
    deleteAgendaItem(input: $input) {
      id
      name
      description
    }
  }
`);

export const Mutation_deletePost = gql(`
  mutation Mutation_deletePost($input: MutationDeletePostInput!) {
    deletePost(input: $input) {
      id
      attachments {
        mimeType
        fileHash
        name
        objectName
        id
      }
    }
  }
`);

export const Mutation_createPost = gql(`
  mutation Mutation_createPost($input: MutationCreatePostInput!) {
    createPost(input: $input) {
      id
      caption
      body
      pinnedAt
      organization {
        id
      }
      attachments {
        mimeType
        objectName
        fileHash
        name
      }
    }
  }
`);

export const Mutation_createPresignedUrl = gql(`
  mutation Mutation_createPresignedUrl($input: MutationCreatePresignedUrlInput!) {
    createPresignedUrl(input: $input) {
      presignedUrl
      objectName
      requiresUpload
       }
  }
`);

export const Mutation_createGetfileUrl = gql(`
  mutation Mutation_createGetfileUrl($input: MutationCreateGetfileUrlInput!) {
    createGetfileUrl(input: $input) {
      presignedUrl
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

export const Mutation_unassignUserTag = gql(`
      mutation UnassignUserTag($assigneeId: ID!, $tagId: ID!) {
        unassignUserTag(assigneeId: $assigneeId, tagId: $tagId)
      }
`);

export const Mutation_updatePost = gql(`
  mutation Mutation_updatePost($input: MutationUpdatePostInput!) {
    updatePost(input: $input) {
      id
      pinnedAt
      caption
      attachments {
        mimeType
        fileHash
        name
        objectName
        id
      }
    }
  }
`);

export const Mutation_updatePostVote = gql(`
mutation Mutation_updatePostVote($input:MutationUpdatePostVoteInput!){
    updatePostVote(input: $input) {
    id
    upVotesCount
    downVotesCount
    creator{
      id
    }
    upVoters(first: 10) {
      edges {
        node {
          id
        }
      }
    }
  }
}
  `);

export const Mutation_createChat = gql(`
  mutation Mutation_createChat($input: MutationCreateChatInput!) {
    createChat(input: $input) {
      id
      name
      avatarMimeType
    }
  }
`);

export const Mutation_createChatMessage = gql(`
 mutation Mutation_createChatMessage($input: MutationCreateChatMessageInput!) {
  createChatMessage(input: $input) {
    id
    body
    createdAt
    updatedAt
    parentMessage {
      id
    }
    chat {
      id
      name
      createdAt
      creator {
        id
        name
      }
    }
    creator {
      id
      name
    }
  }
}
`);

export const Mutation_updateChatMessage = gql(`
  mutation Mutation_updateChatMessage($input: MutationUpdateChatMessageInput!) {
  updateChatMessage(input: $input) {
    id
    body
    createdAt
    updatedAt
    parentMessage {
      id
    }
    chat {
      id
      name
      createdAt
      updatedAt
      creator {
        id
        name
      }
    }
    creator {
      id
      name
    }
  }
}
`);

export const Mutation_createChatMembership = gql(`
  mutation Mutation_createChatMembership($input: MutationCreateChatMembershipInput!) {
  createChatMembership(input: $input) {
    id
    createdAt
    updatedAt
    creator {
      id
      name
    }
  }
}
`);

export const Mutation_deleteChatMembership = gql(`
  mutation Mutation_deleteChatMembership($input: MutationDeleteChatMembershipInput!) {
    deleteChatMembership(input: $input) {
      id
    }
  }
`);

export const Mutation_joinPublicOrganization = gql(`
  mutation Mutation_joinPublicOrganization($input: MutationJoinPublicOrganizationInput!) {
    joinPublicOrganization(input: $input) {
      memberId
      organizationId
      role
      creatorId
    }
  }
`);

export const Mutation_createActionItem = gql(`
  mutation CreateActionItem($input: CreateActionItemInput!) {
    createActionItem(input: $input) {
      id
      assignedAt
      completionAt
      preCompletionNotes
      postCompletionNotes
      isCompleted
      category {
        id
        name
      }
      volunteer {
        id
        hasAccepted
        isPublic
        hoursVolunteered
      }
      volunteerGroup {
        id
        name
        description
        volunteersRequired
      }
      organization {
        id
        name
      }
      creator {
        id
        name
      }
      updater {
        id
        name
      }
      event {
        id
        name
      }
    }
  }
`);

export const Mutation_createActionItemCategory = gql(`
  mutation Mutation_createActionItemCategory($input: MutationCreateActionItemCategoryInput!) {
    createActionItemCategory(input: $input) {
      id
      name
      description
      isDisabled
      createdAt
      organization {
        id
        name
      }
      creator {
        id
        name
      }
    }
  }
`);

export const POSTGRES_EVENTS_BY_ORGANIZATION_ID = gql(`
  query EventsByOrganizationId($input: EventsByOrganizationIdInput!) {
    eventsByOrganizationId(input: $input) {
      id
      name
      description
    }
  }
`);

export const UPDATE_ACTION_ITEM_MUTATION = `#graphql
  mutation UpdateActionItem($input: MutationUpdateActionItemInput!) {
    updateActionItem(input: $input) {
      id
      isCompleted
      assignedAt
      completionAt
      preCompletionNotes
      postCompletionNotes
      createdAt
      category {
        id
        name
      }
      volunteer {
        id
        user {
          id
          name
        }
      }
      volunteerGroup {
        id
        name
      }
      creator {
        id
        name
      }
      organization {
        id
        name
      }
    }
  }
`;

export const Mutation_updateActionItemCategory = gql(`
  mutation UpdateActionItemCategory(
    $input: MutationUpdateActionItemCategoryInput!
  ) {
    updateActionItemCategory(input: $input) {
      id
      name
      description
      isDisabled
      createdAt
      updatedAt
      organization {
        id
        name
      }
      creator {
        id
        name
      }
    }
  }
`);

export const DELETE_ACTION_ITEM_MUTATION = gql(`
  mutation DeleteActionItem($input: MutationDeleteActionItemInput!) {
    deleteActionItem(input: $input) {
      id
      isCompleted
      assignedAt
      completionAt
      preCompletionNotes
      postCompletionNotes
      createdAt
      organization {
        id
      }
      category {
        id
      }
      volunteer {
        id
      }
      volunteerGroup {
        id
      }
      creator {
        id
      }
      event {
        id
      }
    }
  }
  `);

export const Mutation_deleteActionItemCategory = gql(`
  mutation DeleteActionItemCategory(
    $input: MutationDeleteActionItemCategoryInput!
  ) {
    deleteActionItemCategory(input: $input) {
      id
      name
      description
      isDisabled
      createdAt
      organization {
        id
        name
      }
      creator {
        id
        name
      }
    }
  }
`);

export const ACTION_ITEM_CATEGORY = gql(`
  query FetchActionCategoriesByOrganization($input: QueryActionCategoriesByOrganizationInput!) {
    actionCategoriesByOrganization(input: $input) {
      id
      name
      isDisabled
      createdAt
      updatedAt
      organization {
        id
        name
      }
      creator {
        id
        name
      }
    }
  }
`);

export const Query_eventsByIds = gql(`
  query eventsByIds($input: QueryEventsByIdsInput!) {
    eventsByIds(input: $input) {
      id
      name
      description
      startAt
      endAt
      isInviteOnly
    }
  }
`);

export const Query_usersByOrganizationId = gql(`
  query UsersByOrganizationId($organizationId: ID!) {
    usersByOrganizationId(organizationId: $organizationId) {
      id
      name
      emailAddress
    }
  }
`);

export const Query_usersByIds = gql(`
  query UsersByIds($input: UsersByIdsInput!) {
    usersByIds(input: $input) {
      id
      name
      emailAddress
    }
  }
`);

export const Query_eventsByOrganizationId = gql(`
 query EventsByOrganizationId($input: EventsByOrganizationIdInput!) {
    eventsByOrganizationId(input: $input) {
      id
      description
      startAt
      endAt
      organization {
        id
      }
      attachments {
        mimeType
      }
      isGenerated
      baseRecurringEventId
    }
  }
`);

export const Query_actionItemsByOrganization = gql(`
  query ActionItemsByOrganization($input: QueryActionItemsByOrganizationInput!) {
    actionItemsByOrganization(input: $input) {
      id
      preCompletionNotes
      isCompleted
      assignedAt
      completionAt
      postCompletionNotes
      category {
        id
        name
      }
      volunteer {
        id
        user {
          id
          name
        }
      }
      volunteerGroup {
        id
        name
      }
      creator {
        id
        name
      }
      organization {
        id
        name
      }
      event {
        id
        name
      }
      updater {
        id
        name
      }
      createdAt
    }
  }
`);

export const Query_actionItemCategory = gql(`
  query ActionItemCategory($input: QueryActionItemCategoryInput!) {
    actionItemCategory(input: $input) {
      id
      name
      description
      isDisabled
      createdAt
      organization {
        id
        name
      }
      creator {
        id
        name
      }
    }
  }
`);

export const Mutation_sendMembershipRequest = gql(`
  mutation Mutation_sendMembershipRequest($input: MutationSendMembershipRequestInput!) {
  sendMembershipRequest(input: $input) {
    organizationId
    userId
    status
    createdAt
    membershipRequestId
    }
  }
`);

export const Mutation_acceptMembershipRequest = gql(`
  mutation Mutation_acceptMembershipRequest($input: MutationAcceptMembershipRequestInput!) {
  acceptMembershipRequest(input: $input) {
    success
    message
    }
  }
`);

export const Mutation_rejectMembershipRequest = gql(`
  mutation Mutation_rejectMembershipRequest($input: MutationRejectMembershipRequestInput!) {
  rejectMembershipRequest(input: $input) {
    success
    message
    }
  }
`);

export const Query_hasUserVoted = gql(`
  query Query_hasUserVoted($input: QueryHasUserVotedInput!) {
    hasUserVoted(input: $input)
    {
      voteType
      hasVoted
    }
  }
`);

export const Query_hasSubmittedFeedback = gql(`
  query Query_hasSubmittedFeedback($userId: ID!, $eventId: ID, $recurringEventInstanceId: ID) {
    hasSubmittedFeedback(userId: $userId, eventId: $eventId, recurringEventInstanceId: $recurringEventInstanceId)
  }
`);

export const Query_postWithHasUserVoted = gql(`
  query Query_postWithHasUserVoted($input: QueryPostInput!, $userId: ID!) {
    post(input: $input) {
      id
      hasUserVoted(userId: $userId) {
        voteType
        hasVoted
      }
    }
  }
`);

export const Mutation_createPostVote = gql(`
  mutation Mutation_createPostVote($input:MutationCreatePostVoteInput!){
    createPostVote(input : $input){
      id
      caption
    }
  }`);

export const Mutation_deletePostVote = gql(`
  mutation Mutation_deletePostVote($input: MutationDeletePostVoteInput!){
    deletePostVote(input: $input){
      id
      caption
    }
  }`);

export const Query_chat = gql(`
  query Query_chat($input: QueryChatInput!) {
    chat(input: $input) {
      id
      name
      description
      avatarMimeType
      avatarURL
      organization {
        id
        countryCode
      }
    }
  }
`);

export const Query_chatsByUser = gql(`
  query Query_chatsByUser {
    chatsByUser {
      id
      name
      description
      avatarMimeType
      avatarURL
      organization {
        id
        countryCode
      }
    }
  }
`);

export const Mutation_deleteChat = gql(`
  mutation Mutation_deleteChat($input: MutationDeleteChatInput!) {
    deleteChat(input: $input) {
      id
      name
    }
  }
`);

export const Mutation_deleteStandaloneEvent = gql(`
  mutation Mutation_deleteStandaloneEvent($input: MutationDeleteStandaloneEventInput!) {
    deleteStandaloneEvent(input: $input) {
      id
      name
      description
      startAt
      endAt
      allDay
      location
      isPublic
      isRegisterable
      isRecurringEventTemplate
      organization {
        id
        name
      }
      creator {
        id
        name
      }
      attachments {
        mimeType
        url
      }
    }
  }
`);

export const Mutation_deleteSingleEventInstance = gql(`
  mutation Mutation_deleteSingleEventInstance($input: MutationDeleteSingleEventInstanceInput!) {
    deleteSingleEventInstance(input: $input) {
      id
      name
      description
      location
      allDay
      isPublic
      isRegisterable
      startAt
      endAt
      hasExceptions
      sequenceNumber
      totalCount
      organization {
        id
        name
      }
    }
  }
`);

export const Mutation_deleteThisAndFollowingEvents = gql(`
  mutation Mutation_deleteThisAndFollowingEvents($input: MutationDeleteThisAndFollowingEventsInput!) {
    deleteThisAndFollowingEvents(input: $input) {
      id
      name
      description
      startAt
      endAt
      hasExceptions
      sequenceNumber
      totalCount
      organization {
        id
        name
      }
    }
  }
`);

export const Mutation_deleteEntireRecurringEventSeries = gql(`
  mutation Mutation_deleteEntireRecurringEventSeries($input: MutationDeleteEntireRecurringEventSeriesInput!) {
    deleteEntireRecurringEventSeries(input: $input) {
      id
      name
      description
      startAt
      endAt
      allDay
      location
      isPublic
      isRegisterable
      isRecurringEventTemplate
      organization {
        id
        name
      }
      creator {
        id
        name
      }
      attachments {
        mimeType
        url
      }
    }
  }
`);

export const Mutation_verifyEventInvitation = gql(`
  mutation Mutation_verifyEventInvitation($input: VerifyEventInvitationInput!) {
    verifyEventInvitation(input: $input) {
      invitationToken
      inviteeEmailMasked
      inviteeName
      status
      expiresAt
      eventId
      recurringEventInstanceId
      organizationId
    }
  }
`);

export const Mutation_acceptEventInvitation = gql(`
  mutation Mutation_acceptEventInvitation($input: AcceptEventInvitationInput!) {
    acceptEventInvitation(input: $input) {
      id
      eventId
      recurringEventInstanceId
      invitedBy
      userId
      inviteeEmail
      inviteeName
      invitationToken
      status
      expiresAt
      respondedAt
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_readNotification = gql(`
  mutation Mutation_readNotification($input: MutationReadNotificationInput!) {
    readNotification(input: $input) {
      success
      message
    }
  }
`);

export const Query_user_notifications = gql(`
  query Query_user_notifications($input: QueryUserInput!, $notificationInput: QueryNotificationInput) {
    user(input: $input) {
      id
      notifications(input: $notificationInput) {
        id
        isRead
        readAt
        navigation
        title
        body
        createdAt
        eventType
      }
    }
  }
`);

export const Mutation_updateEntireRecurringEventSeries = gql(`
  mutation Mutation_updateEntireRecurringEventSeries($input: MutationUpdateEntireRecurringEventSeriesInput!) {
    updateEntireRecurringEventSeries(input: $input) {
      id
      name
      description
      startAt
      endAt
      allDay
      location
      isPublic
      isRegisterable
      creator {
        id
        name
      }
      updater {
        id
        name
      }
      organization {
        id
        name
      }
      attachments {
        mimeType
        url
      }
    }
  }
`);

export const Mutation_updateSingleRecurringEventInstance = gql(`
  mutation Mutation_updateSingleRecurringEventInstance($input: MutationUpdateSingleRecurringEventInstanceInput!) {
    updateSingleRecurringEventInstance(input: $input) {
      id
      name
      description
      location
      startAt
      endAt
      allDay
      isPublic
      isRegisterable
      isInviteOnly
      hasExceptions
      sequenceNumber
      totalCount
      organization {
        id
        name
      }
    }
  }
`);

export const Mutation_updateStandaloneEvent = gql(`
  mutation Mutation_updateStandaloneEvent($input: MutationUpdateEventInput!) {
    updateStandaloneEvent(input: $input) {
      id
      name
      description
      location
      startAt
      endAt
      allDay
      isPublic
      isRegisterable
      isInviteOnly
      organization {
        id
        name
      }
      attachments {
        mimeType
      }
    }
  }
`);

export const Mutation_updateThisAndFollowingEvents = gql(`
  mutation Mutation_updateThisAndFollowingEvents($input: MutationUpdateThisAndFollowingEventsInput!) {
    updateThisAndFollowingEvents(input: $input) {
      id
      name
      description
      location
      startAt
      endAt
      allDay
      isPublic
      isRegisterable
      isInviteOnly
      hasExceptions
      sequenceNumber
      totalCount
      organization {
        id
        name
      }
    }
  }
`);

export const Query_getMyPledgesForCampaign = gql(`
  query GetMyPledgesForCampaign($campaignId: ID!) {
    getMyPledgesForCampaign(campaignId: $campaignId) {
      id
      amount
      pledger {
        id
        name
      }
      campaign {
        id
        name
        startAt
        endAt
        currencyCode
      }
    }
  }
`);

export const Query_actionItems = gql(`
    query ActionItems($id: String!) {
        actionItemCategory(input: { id: $id }) {
            actionItems {
                id
                isCompleted
            }
        }
    }
`);

export const Query_eventActionItems = gql(`
    query EventActionItems($id: String!, $first: Int, $after: String, $last: Int, $before: String) {
        event(input: { id: $id }) {
            actionItems(first: $first, after: $after, last: $last, before: $before) {
                edges {
                    node {
                        id
                        isCompleted
                    }
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                }
            }
        }
    }
`);

export const Query_organizationActionItemCategories = gql(`
    query OrganizationActionItemCategories($id: String!, $first: Int, $after: String, $last: Int, $before: String) {
        organization(input: { id: $id }) {
            actionItemCategories(first: $first, after: $after, last: $last, before: $before) {
                edges {
                    node {
                        id
                        name
                        isDisabled
                    }
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                }
            }
        }
    }
`);

export const Query_actionItemsByVolunteer = gql(`
  query ActionItemsByVolunteer($input: QueryActionItemsByVolunteerInput!) {
    actionItemsByVolunteer(input: $input) {
      id
      preCompletionNotes
      isCompleted
      assignedAt
      completionAt
      postCompletionNotes
      category {
        id
        name
      }
      volunteer {
        id
        hasAccepted
        isPublic
        hoursVolunteered
      }
      creator {
        id
        name
      }
      organization {
        id
        name
      }
      event {
        id
        name
      }
      updater {
        id
        name
      }
      createdAt
    }
  }
`);

export const Query_actionItemsByVolunteerGroup = gql(`
  query ActionItemsByVolunteerGroup($input: QueryActionItemsByVolunteerGroupInput!) {
    actionItemsByVolunteerGroup(input: $input) {
      id
      preCompletionNotes
      isCompleted
      assignedAt
      completionAt
      postCompletionNotes
      category {
        id
        name
      }
      volunteerGroup {
        id
        name
        description
        volunteersRequired
      }
      creator {
        id
        name
      }
      organization {
        id
        name
      }
      event {
        id
        name
      }
      updater {
        id
        name
      }
      createdAt
    }
  }
`);

export const COMPLETE_ACTION_FOR_INSTANCE_MUTATION = gql(`
  mutation completeActionForInstance($input: MutationCompleteActionItemForInstanceInput!) {
    completeActionItemForInstance(input: $input) {
      id
    }
  }
`);

export const MARK_ACTION_ITEM_AS_PENDING_MUTATION = gql(`
  mutation markActionItemAsPending($input: MarkActionItemAsPendingInput!) {
    markActionItemAsPending(input: $input) {
      id
      isCompleted
    }
  }
`);

export const MARK_ACTION_AS_PENDING_FOR_INSTANCE_MUTATION = gql(`
  mutation markActionItemAsPendingForInstance($input: MutationMarkActionAsPendingForInstanceInput!) {
    markActionItemAsPendingForInstance(input: $input) {
      id
    }
  }
`);

export const DELETE_ACTION_FOR_INSTANCE_MUTATION = gql(`
  mutation deleteActionForInstance($input: MutationDeleteActionItemForInstanceInput!) {
    deleteActionItemForInstance(input: $input) {
      id
    }
  }
`);

export const UPDATE_ACTION_FOR_INSTANCE_MUTATION = gql(`
  mutation updateActionForInstance($input: MutationUpdateActionItemForInstanceInput!) {
    updateActionItemForInstance(input: $input) {
      id
    }
  }
`);

export const Mutation_createComment = gql(`
	mutation Mutation_createComment($input: MutationCreateCommentInput!) {
		createComment(input: $input) {
			id
			body
			post {
				id
			}
			creator {
				id
			}
		}
	}
`);

export const Mutation_deleteComment = gql(`
	mutation Mutation_deleteComment($input: MutationDeleteCommentInput!) {
		deleteComment(input: $input) {
			id
		}
	}
`);

export const Mutation_createCommentVote = gql(`
	mutation Mutation_createCommentVote($input: MutationCreateCommentVoteInput!) {
		createCommentVote(input: $input) {
			id
			body
			creator {
				id
			}
		}
	}
`);

export const Mutation_deleteCommentVote = gql(`
	mutation Mutation_deleteCommentVote($input: MutationDeleteCommentVoteInput!) {
		deleteCommentVote(input: $input) {
			id
			body
			creator {
				id
			}
		}
	}
`);

export const Mutation_updateCommentVote = gql(`
	mutation Mutation_updateCommentVote($input: MutationUpdateCommentVoteInput!) {
		updateCommentVote(input: $input) {
			id
			body
			creator {
				id
			}
		}
	}
`);

export const Query_comment = gql(`
	query Query_comment($input: QueryCommentInput!) {
		comment(input: $input) {
			id
			body
			createdAt
			post {
				id
			}
			creator {
				id
			}
		}
	}
`);

export const Query_commentWithHasUserVoted = gql(`
	query Query_commentWithHasUserVoted($input: QueryCommentInput!, $userId: ID!) {
		comment(input: $input) {
			id
			body
			hasUserVoted(userId: $userId) {
				hasVoted
				voteType
			}
		}
	}
`);

export const Mutation_createEventVolunteer = gql(`
  mutation Mutation_createEventVolunteer($input: EventVolunteerInput!) {
    createEventVolunteer(data: $input) {
      id
      hasAccepted
      isPublic
      hoursVolunteered
      user {
        id
      }
      event {
        id
      }
    }
  }
`);

export const Query_eventWithVolunteers =
	gql(`query Query_eventWithVolunteers($input: QueryEventInput!) {
    event(input: $input) {
        id
        name
        description
        startAt
        endAt
        creator {
            id
            name
        }
        organization {
            id
            countryCode
        }
        volunteers {
          id
          hasAccepted
          isPublic
          hoursVolunteered
          isInstanceException
        }
    }
}`);

export const Mutation_createEventVolunteerGroup = gql(`
  mutation CreateEventVolunteerGroup($data: EventVolunteerGroupInput!) {
    createEventVolunteerGroup(data: $data) {
      id
      name
      description
      volunteersRequired
      leader {
        id
        name
      }
      event {
        id
      }
    }
  }
`);

export const Mutation_createVolunteerMembership = gql(`
  mutation CreateVolunteerMembership($data: VolunteerMembershipInput!) {
    createVolunteerMembership(data: $data) {
      id
      status
      volunteer {
        id
        user {
          id
        }
      }
      event {
        id
      }
      group {
        id
      }
    }
  }
`);

export const Mutation_deleteEventVolunteer = gql(`
  mutation Mutation_deleteEventVolunteer($id: ID!) {
    deleteEventVolunteer(id: $id) {
      id
      hasAccepted
      isPublic
      hoursVolunteered
      user {
        id
        name
      }
      event {
        id
        name
      }
      createdAt
    }
  }
`);

export const Mutation_deleteEventVolunteerForInstance = gql(`
  mutation Mutation_deleteEventVolunteerForInstance($input: DeleteEventVolunteerForInstanceInput!) {
    deleteEventVolunteerForInstance(input: $input) {
      id
      hasAccepted
      isPublic
      hoursVolunteered
      user {
        id
        name
      }
      event {
        id
        name
      }
      createdAt
    }
  }
`);

export const Mutation_deleteEventVolunteerGroup = gql(`
  mutation Mutation_deleteEventVolunteerGroup($id: ID!) {
    deleteEventVolunteerGroup(id: $id) {
      id
      name
      description
      volunteersRequired
      leader {
        id
        name
      }
      event {
        id
        name
      }
      creator {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_deleteEventVolunteerGroupForInstance = gql(`
  mutation Mutation_deleteEventVolunteerGroupForInstance($input: DeleteEventVolunteerGroupForInstanceInput!) {
    deleteEventVolunteerGroupForInstance(input: $input) {
      id
      name
      description
      volunteersRequired
      leader {
        id
        name
      }
      event {
        id
        name
      }
      creator {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_updateEventVolunteer = gql(`
  mutation Mutation_updateEventVolunteer($id: ID!, $data: UpdateEventVolunteerInput) {
    updateEventVolunteer(id: $id, data: $data) {
      id
      hasAccepted
      isPublic
      hoursVolunteered
      user {
        id
        name
      }
      event {
        id
        name
      }
      creator {
        id
        name
      }
      updater {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_updateEventVolunteerGroup = gql(`
  mutation Mutation_updateEventVolunteerGroup($id: ID!, $data: UpdateEventVolunteerGroupInput!) {
    updateEventVolunteerGroup(id: $id, data: $data) {
      id
      name
      description
      volunteersRequired
      leader {
        id
        name
      }
      event {
        id
        name
      }
      creator {
        id
        name
      }
      updater {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_updateVolunteerMembership = gql(`
  mutation Mutation_updateVolunteerMembership($id: ID!, $status: String!) {
    updateVolunteerMembership(id: $id, status: $status) {
      id
      status
      volunteer {
        id
        hasAccepted
        user {
          id
          name
        }
      }
      event {
        id
        name
      }
      group {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

export const Query_getEventVolunteerGroups = gql(`
  query Query_getEventVolunteerGroups($where: EventVolunteerGroupWhereInput!, $orderBy: EventVolunteerGroupOrderByInput) {
    getEventVolunteerGroups(where: $where, orderBy: $orderBy) {
      id
      name
      description
      volunteersRequired
      leader {
        id
        name
      }
      event {
        id
        name
      }
      creator {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

export const Query_getVolunteerMembership = gql(`
  query Query_getVolunteerMembership($where: VolunteerMembershipWhereInput!, $orderBy: VolunteerMembershipOrderByInput) {
    getVolunteerMembership(where: $where, orderBy: $orderBy) {
      id
      status
      volunteer {
        id
        hasAccepted
        user {
          id
          name
        }
      }
      event {
        id
        name
      }
      group {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

export const Query_chat_with_unread = gql(`
  query Query_chat_with_unread($input: QueryChatInput!) {
    chat(input: $input) {
      id
      unreadMessagesCount
      hasUnread
      firstUnreadMessageId
      lastMessage { id }
    }
  }
`);

export const Query_chat_with_creator = gql(`
  query Query_chat_with_creator($input: QueryChatInput!) {
    chat(input: $input) {
      id
      creator { id name }
    }
  }
`);

export const Query_unreadChats = gql(`
  query Query_unreadChats {
    unreadChats {
      id
      name
    }
  }
`);

export const Mutation_markChatAsRead = gql(`
  mutation Mutation_markChatAsRead($input: MutationMarkChatAsReadInput!) {
    markChatAsRead(input: $input)
  }
`);

export const Mutation_updateChatMembership = gql(`
  mutation Mutation_updateChatMembership($input: MutationUpdateChatMembershipInput!) {
    updateChatMembership(input: $input) {
      id
    }
  }
`);

export const Mutation_updateOrganizationMembership = gql(`
  mutation Mutation_updateOrganizationMembership($input: MutationUpdateOrganizationMembershipInput!) {
    updateOrganizationMembership(input: $input) {
      id
    }
  }
`);

export const Mutation_registerEventAttendee = gql(`
  mutation Mutation_registerEventAttendee($data: EventAttendeeInput!) {
    registerEventAttendee(data: $data) {
      id
      isInvited
      isRegistered
      isCheckedIn
      isCheckedOut
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_inviteEventAttendee = gql(`
  mutation Mutation_inviteEventAttendee($data: EventAttendeeInput!) {
    inviteEventAttendee(data: $data) {
      id
      isInvited
      isRegistered
      isCheckedIn
      isCheckedOut
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_addEventAttendee = gql(`
  mutation Mutation_addEventAttendee($data: EventAttendeeInput!) {
    addEventAttendee(data: $data) {
      id
      name
      emailAddress
      isEmailAddressVerified
      role
      createdAt
    }
  }
`);

export const Mutation_registerForEvent = gql(`
  mutation Mutation_registerForEvent($id: ID!) {
    registerForEvent(id: $id) {
      id
      isInvited
      isRegistered
      isCheckedIn
      isCheckedOut
      createdAt
      updatedAt
    }
  }
`);

export const Mutation_removeEventAttendee = gql(`
  mutation Mutation_removeEventAttendee($data: EventAttendeeInput!) {
    removeEventAttendee(data: $data) {
      id
      name
      emailAddress
      isEmailAddressVerified
      role
      createdAt
    }
  }
`);

export const Mutation_unregisterForEventByUser = gql(`
  mutation Mutation_unregisterForEventByUser($id: ID!) {
    unregisterForEventByUser(id: $id)
  }
`);

export const Mutation_checkIn = gql(`
  mutation Mutation_checkIn($data: CheckInCheckOutInput!) {
    checkIn(data: $data) {
      id
      user {
        id
        name
      }
      checkinTime
      checkoutTime
      isCheckedIn
      isCheckedOut
      feedbackSubmitted
    }
  }
`);

export const Mutation_checkOut = gql(`
  mutation Mutation_checkOut($data: CheckInCheckOutInput!) {
    checkOut(data: $data) {
      id
      user {
        id
        name
      }
      checkinTime
      checkoutTime
      isCheckedIn
      isCheckedOut
      feedbackSubmitted
    }
  }
`);

export const Query_getEventAttendee = gql(`
  query Query_getEventAttendee($userId: ID!, $eventId: ID, $recurringEventInstanceId: ID) {
    getEventAttendee(userId: $userId, eventId: $eventId, recurringEventInstanceId: $recurringEventInstanceId) {
      id
      isInvited
      isRegistered
      isCheckedIn
      isCheckedOut
      createdAt
      updatedAt
      checkinTime
      checkoutTime
      feedbackSubmitted
      user {
        id
      }
      event {
        id
      }
    }
  }
`);

export const Query_getEventAttendeesByEventId = gql(`
  query Query_getEventAttendeesByEventId($eventId: ID, $recurringEventInstanceId: ID) {
    getEventAttendeesByEventId(eventId: $eventId, recurringEventInstanceId: $recurringEventInstanceId) {
      id
      isInvited
      isRegistered
      isCheckedIn
      isCheckedOut
      createdAt
      updatedAt
      checkinTime
      checkoutTime
      feedbackSubmitted
      user {
        id
        name
        emailAddress
      }
      event {
        id
        name
      }
    }
  }
`);

export const Query_getEventInvitesByUserId = gql(`
  query Query_getEventInvitesByUserId($userId: ID!) {
    getEventInvitesByUserId(userId: $userId) {
      id
      isInvited
      isRegistered
      isCheckedIn
      isCheckedOut
      createdAt
      updatedAt
      checkinTime
      checkoutTime
      feedbackSubmitted
      user {
        id
      }
      event {
        id
      }
    }
  }
`);

export const Query_getRecurringEvents = gql(`
  query Query_getRecurringEvents($baseRecurringEventId: ID!, $includeCancelled: Boolean, $limit: Int, $offset: Int) {
    getRecurringEvents(baseRecurringEventId: $baseRecurringEventId, includeCancelled: $includeCancelled, limit: $limit, offset: $offset) {
      id
      name
      description
      startAt
      endAt
      isPublic
      isRegisterable
      location
      isRecurringEventTemplate
      isCancelled
      recurrenceRule {
        id
      }
    }
  }
`);

export const Mutation_cancelMembershipRequest = gql(`
  mutation Mutation_cancelMembershipRequest(
    $input: MutationCancelMembershipRequestInput!
  ) {
    cancelMembershipRequest(input: $input) {
      success
      message
    }
  }
`);

export const Query_community = gql(`
	query Query_community {
		community {
			id
			name
		}
	}
`);

export const Mutation_updateCommunity = gql(`
	mutation Mutation_updateCommunity($input: MutationUpdateCommunityInput!) {
		updateCommunity(input: $input) {
			id
			name
			facebookURL
			githubURL
			instagramURL
			linkedinURL
			logoMimeType
			redditURL
			slackURL
			websiteURL
			xURL
			youtubeURL
			inactivityTimeoutDuration
		}
	}
`);

export const Mutation_updateChat = gql(`
  mutation Mutation_updateChat($input: MutationUpdateChatInput!) {
    updateChat(input: $input) {
      id
      name
      description
      avatarURL
    }
  }
`);

export const Mutation_sendVerificationEmail =
	gql(`mutation Mutation_sendVerificationEmail {
    sendVerificationEmail {
        success
        message
    }
}`);

export const Mutation_verifyEmail =
	gql(`mutation Mutation_verifyEmail($input: MutationVerifyEmailInput!) {
    verifyEmail(input: $input) {
        success
        message
    }
}`);

export const Mutation_signInWithOAuth =
	gql(`mutation Mutation_signInWithOAuth($input: OAuthLoginInput!) {
    signInWithOAuth(input: $input) {
        authenticationToken
        refreshToken
        user {
            id
            name
            emailAddress
        }
    }
}`);

export const Mutation_linkOAuthAccount =
	gql(`mutation Mutation_linkOAuthAccount($input: OAuthLoginInput!) {
    linkOAuthAccount(input: $input) {
        id
        name
        emailAddress
        oauthAccounts {
            provider
            email
            linkedAt
            lastUsedAt
        }
    }
}`);

export const Mutation_unlinkOAuthAccount =
	gql(`mutation Mutation_unlinkOAuthAccount($provider: OAuthProvider!) {
    unlinkOAuthAccount(provider: $provider) {
        id
        name
        emailAddress
        oauthAccounts {
            provider
            email
            linkedAt
            lastUsedAt
        }
    }
}`);

export const Query_eventVenues = gql(`
  query Query_eventVenues($input: QueryEventInput!, $first: Int, $after: String, $last: Int, $before: String) {
    event(input: $input) {
      id
      venues(first: $first, after: $after, last: $last, before: $before) {
        edges {
          node {
            id
            name
            description
            capacity
            organization {
              id
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`);

export const Mutation_createVenue = gql(`
  mutation Mutation_createVenue($input: MutationCreateVenueInput!) {
    createVenue(input: $input) {
      id
      name
      description
      capacity
      createdAt
      updatedAt
    }
  }
`);

export const Query_venue_createdAt = gql(`
  query Query_venue_createdAt($input: QueryVenueInput!) {
    venue(input: $input) {
      id
      createdAt
    }
  }
`);

export const Mutation_createVenueBooking = gql(`
  mutation Mutation_createVenueBooking($input: MutationCreateVenueBookingInput!) {
    createVenueBooking(input: $input) {
      id
    }
  }
`);

export const Query_eventVenuesWithAttachments = gql(`
  query Query_eventVenuesWithAttachments($input: QueryEventInput!, $first: Int, $after: String, $last: Int, $before: String) {
    event(input: $input) {
      id
      venues(first: $first, after: $after, last: $last, before: $before) {
        edges {
          node {
            id
            name
            description
            capacity
            attachments {
              mimeType
            }
            organization {
              id
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`);

export const Query_venue_updatedAt = gql(`
  query Query_venue_updatedAt($input: QueryVenueInput!) {
    venue(input: $input) {
      id
      updatedAt
    }
  }
`);
