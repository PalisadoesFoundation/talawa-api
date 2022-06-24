import { gql } from 'apollo-server-core';

export const language = gql`
  type Language {
    _id: ID!
    en: String!
    translation: [LanguageModel]
    createdAt: String!
  }

  type LanguageModel {
    _id: ID!
    lang_code: String!
    value: String!
    verified: Boolean!
    createdAt: String!
  }

  input LanguageInput {
    en_value: String!
    translation_lang_code: String!
    translation_value: String!
  }

  type Translation {
    lang_code: String
    en_value: String
    translation: String
    verified: Boolean
  }
`;
