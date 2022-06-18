import { gql } from 'apollo-server-core';

export const utils = gql`
  """
  Information about pagination in a connection.
  """
  type PageInfo {
    """
    When paginating forwards, are there more items?
    """
    hasNextPage: Boolean!

    """
    When paginating backwards, are there more items?
    """
    hasPreviousPage: Boolean!
    totalPages: Int
    nextPageNo: Int
    prevPageNo: Int
    currPageNo: Int
  }

  enum Status {
    ACTIVE
    BLOCKED
    DELETED
  }

  enum UserType {
    USER
    ADMIN
    SUPERADMIN
  }

  enum Recurrance {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
    ONCE
  }
  enum Type {
    UNIVERSAL
    PRIVATE
  }
`;

export default utils;
