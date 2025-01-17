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
