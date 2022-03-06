## Type Structures(Schemas)
These type structures and inputs have been used in the queries, mutations and subscriptions listed below. 

# Chats

    type DirectChat {
        _id: ID!
        users: [User!]!
        messages: [DirectChatMessage]
        creator: User!
        organization: Organization!
    }

    type GroupChat {
        _id: ID!
        users: [User!]!
        messages: [GroupChatMessage]
        creator: User!
        organization: Organization!
    }

    type GroupChatMessage {
        _id: ID!
        groupChatMessageBelongsTo: GroupChat!
        sender: User!
        createdAt: String!
        messageContent: String!
    }

    type DirectChatMessage {
        _id: ID!
        directChatMessageBelongsTo: DirectChat!
        sender: User!
        receiver: User!
        createdAt: String!
        messageContent: String!
    }

    input createChatInput {
        userIds: [ID!]!
        organizationId: ID!
    }

    input createGroupChatInput {
        userIds: [ID!]!
        organizationId: ID!
        title: String!
    }

# Events

    type Event {
        _id: ID!
        title:String!
        description: String!
        startDate: String!
        endDate: String!
        allDay: Boolean!
        startTime: String
        endTime: String
        recurring: Boolean!
        recurrance: String
        attendees: String!
        isPublic: Boolean! 
        isRegisterable: Boolean! 
        creator: User!
        # registrants: [User]
        admins(adminId: ID): [User]
        organization: Organization
        location: String
        tasks: [Task]
        isRegistered: Boolean
    }

    type Task {
        _id: ID!
        title: String!
        description: String
        event: Event!
        creator: User!
        createdAt: String!
        deadline: String
    }

    input EventInput {
        title:String!
        description: String!
        recurring: Boolean!
        recurrance: String
        attendees: String
        isPublic: Boolean! 
        isRegisterable: Boolean! 
        organizationId: ID!
        startDate: String!
        endDate: String
        allDay: Boolean!
        startTime: String
        endTime: String
        location: String
    }

    input UpdateEventInput {
        title:String
        description: String
        recurring: Boolean
        recurrance: String
        attendees: String
        isPublic: Boolean
        isRegisterable: Boolean
        startDate: String
        endDate: String
        location: String
        allDay: Boolean
        startTime: String
        endTime: String
    }

    input TaskInput {
        title: String!
        description: String
        deadline: String
    }


    input UpdateTaskInput {
        title: String
        description: String
        deadline: String
    }

    enum EventOrderByInput {
        id_ASC
        id_DESC
        title_ASC
        title_DESC
        description_ASC
        description_DESC
        startDate_ASC 
        startDate_DESC 
        endDate_ASC 
        endDate_DESC 
        allDay_ASC
        allDay_DESC
        startTime_ASC
        startTime_DESC
        endTime_ASC
        endTime_DESC
        recurrance_ASC
        recurrance_DESC
        location_ASC
        location_DESC
    }

    enum TaskOrderByInput {
        id_ASC
        id_DESC
        title_ASC
        title_DESC
        description_ASC
        description_DESC
        createdAt_ASC 
        createdAt_DESC
        deadline_ASC
        deadline_DESC
    }

# Newsfeed
    type Post {
        _id: ID
        text: String!
        title: String
        createdAt: String
        imageUrl: String
        videoUrl:String
        creator: User!
        organization: Organization!
        likedBy: [User]
        comments: [Comment]
        likeCount: Int
        commentCount: Int 
    }
      
    input PostInput {
        _id: ID
        text: String!
        title: String
        imageUrl: String
        videoUrl:String
        organizationId: ID!
    }

    type Comment {
        _id: ID
        text: String!
        createdAt: String
        creator: User!
        post: Post!
        likedBy: [User]
        likeCount: Int
    } 
  
    input CommentInput {
        text: String!
    }

    enum PostOrderByInput {
        id_ASC
        id_DESC
        text_ASC
        text_DESC
        title_ASC
        title_DESC
        createdAt_ASC
        createdAt_DESC
        imageUrl_ASC
        imageUrl_DESC
        videoUrl_ASC
        videoUrl_DESC
        likeCount_ASC
        likeCount_DESC
        commentCount_ASC
        commentCount_DESC
    }

# Organization

    type Organization {
        image:String
        _id: ID!
        name:String!
        description: String!
        isPublic: Boolean! 
        creator: User!
        members: [User]
        admins(adminId: ID): [User]
        membershipRequests: [MembershipRequest]
        blockedUsers: [User]
        visibleInSearch: Boolean!
        apiUrl:String!
    }

    input OrganizationInput {
        name:String!
        description: String!
        attendees: String
        isPublic: Boolean! 
        visibleInSearch: Boolean! 
        apiUrl:String
    }
 
    input UpdateOrganizationInput {
        name:String
        description: String
        isPublic: Boolean
        visibleInSearch: Boolean
    }

    input UserAndOrganizationInput{
        organizationId: ID!, userId: ID!
    }

    input MultipleUsersAndOrganizationInput {
        organizationId: ID!,
        userIds: [ID!]!
    }

    type MembershipRequest {
        _id: ID!
        user: User!
        organization: Organization!
    }

    input OrganizationWhereInput {
        id: ID
        id_not: ID
        id_in: [ID!]
        id_not_in: [ID!]
        id_contains: ID
        id_starts_with: ID

        name: String
        name_not: String
        name_in: [String!]
        name_not_in: [String!]
        name_contains: String
        name_starts_with: String

        description: String
        description_not: String
        description_in: [String!]
        description_not_in: [String!]
        description_contains: String
        description_starts_with: String

        apiUrl: String
        apiUrl_not: String
        apiUrl_in: [String!]
        apiUrl_not_in: [String!]
        apiUrl_contains: String
        apiUrl_starts_with: String

        visibleInSearch: Boolean

        isPublic: Boolean
    }

    enum OrganizationOrderByInput {
        id_ASC
        id_DESC
        name_ASC
        name_DESC
        description_ASC
        description_DESC
        apiUrl_ASC
        apiUrl_DESC
    }

# Users
    input LoginInput {
        email:String!, 
        password:String!
    }
  
    type AuthData {
        user: User!,
        accessToken: String!
        refreshToken: String!
    }

    type ExtendSession {
        accessToken: String!
        refreshToken: String!
    }

    type User {
        tokenVersion: Int!
        _id: ID!
        firstName: String!
        lastName: String!
        email: String!
        createdOrganizations: [Organization]
        joinedOrganizations: [Organization]
        createdEvents: [Event]
        registeredEvents: [Event]
        eventAdmin: [Event]
        adminFor: [Organization]
        membershipRequests: [MembershipRequest]
        organizationsBlockedBy: [Organization]
        image: String
        organizationUserBelongsTo: Organization
    }

    input UserInput {
        firstName: String!
        lastName: String!
        email: String!
        password: String!
        organizationUserBelongsToId: ID
    }

    input UserWhereInput {
        id: ID
        id_not: ID
        id_in: [ID!]
        id_not_in: [ID!]
        id_contains: ID
        id_starts_with: ID

        firstName: String
        firstName_not: String
        firstName_in: [String!]
        firstName_not_in: [String!]
        firstName_contains: String
        firstName_starts_with: String

        lastName: String
        lastName_not: String
        lastName_in: [String!]
        lastName_not_in: [String!]
        lastName_contains: String
        lastName_starts_with: String

        email: String
        email_not: String
        email_in: [String!]
        email_not_in: [String!]
        email_contains: String
        email_starts_with: String
    }

    enum UserOrderByInput {
        id_ASC
        id_DESC
        firstName_ASC
        firstName_DESC
        lastName_ASC
        lastName_DESC
        email_ASC
        email_DESC
    }

# Other schemas
    type Message {
        _id: ID!
        text: String
        createdAt: String
        imageUrl: String
        videoUrl:String
        creator: User
    }

    input GroupInput {
        title: String
        description:String
        organizationId: ID!
    }

    type Group {
        _id: ID
        title: String
        description:String
        createdAt:String
        organization: Organization!
        admins: [User]
    }

## Queries
GraphQL queries can traverse related objects and their fields, letting clients fetch lots of related data in one request, instead of making several roundtrips as one would need in a classic REST architecture.

  type Query {
    users(id: ID, orderBy: UserOrderByInput): [User]
    usersConnection(where: UserWhereInput, first: Int, skip: Int, orderBy: UserOrderByInput): [User]!
    organizations(id: ID, orderBy: OrganizationOrderByInput): [Organization]
    organizationsConnection(where: OrganizationWhereInput, first: Int, skip: Int, orderBy: OrganizationOrderByInput): [Organization]!
    events(id: ID, orderBy: EventOrderByInput): [Event]
    eventsByOrganization(id: ID, orderBy: EventOrderByInput): [Event]
    registeredEventsByUser(id: ID, orderBy: EventOrderByInput): [Event]
    event(id: ID): Event
    registrantsByEvent(id: ID): [User]
    me:User!
    posts(orderBy: PostOrderByInput): [Post]
    postsByOrganization(id: ID!, orderBy: PostOrderByInput): [Post]
    tasksByEvent(id: ID!, orderBy: TaskOrderByInput): [Task]
    tasksByUser(id: ID!, orderBy: TaskOrderByInput): [Task]
    comments: [Comment]
    commentsByPost(id: ID!): [Comment]
    post(id: ID): Post
    groups: [Group]
    directChats: [DirectChat]
    directChatMessages: [DirectChatMessage]
    directChatsByUserID(id:ID) :[DirectChat]
    groupChats: [GroupChat]
    groupChatMessages: [GroupChatMessage]
  }

# 1
users(
id: ID
orderBy: UserOrderByInput
): [User]

Description: It fetches the list of users.

Arguments:
1. id: ID - This lets you identify an object(user) uniquely.
2. orderBy: UserOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: User

Example-
query{
    users(
        id:<id>
        orderBy:id_ASC
    ){
        firstName
        lastName
    }
}

# 2
usersConnection(
where: UserWhereInput
first: Int
skip: Int
orderBy: UserOrderByInput
): [User]!

Description: It fetches the list of user connections.

Arguments:
1. where: UserWhereInput - It filters the data by checking for some specific attributes.  
2. first: 4 - It fetches the first 4 records.
3. skip: 2 - It skips the first 2 records.
4. orderBy: UserOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example- 
query{
    usersConnection(
        where:{firstName_contains:"a"}
        first: 2
        skip: 0
        orderBy: id_ASC
    ){
        firstName
        lastName
    }
}

# 3
organizations(
id: ID
orderBy: OrganizationOrderByInput
): [Organization]

Description: It fetches the list of organizations.

Arguments:

1. id: ID - This lets you identify an object(organization) uniquely.
2. orderBy: OrganizationOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Organization

Example-
query{
    organizations( 
      orderBy: id_ASC
    ){
    name
  }
}

# 4
organizationsConnection(
where: OrganizationWhereInput
first: Int
skip: Int
orderBy: OrganizationOrderByInput
): [Organization]!

Description: It fetches the list of the organization's connections.

Arguments:
1. where: OrganizationWhereInput - It filters the data by checking for some specific attributes.
2. first: 3 - It fetches the first 3 records.
3. skip: 0 -  It skips the first 0 records.
4. orderBy: OrganizationOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Organization

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
query{
    organizationsConnection(
      where: {description_not:"abc"}
      first: 1
      skip: 1
      orderBy: id_ASC
    ){
    name
  }
}

# 5
events(
id: ID
orderBy: EventOrderByInput
): [Event]

Description: It fetches the list of events.

Arguments:
1. id: ID - This lets you identify an object(event) uniquely.
2. orderBy: EventOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Event

Example-
query{
  events(
    orderBy: id_ASC
  ){
    title
  }
}

# 6
eventsByOrganization(
id: ID
orderBy: EventOrderByInput
): [Event]

Description: It fetches the list of events by organizations.

Arguments:
1. id: ID - This lets you identify an object(event) uniquely.
2. orderBy: EventOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Event

Example- 
query{
  eventsByOrganization(
    orderBy: id_ASC
  ){
    title
    description
  }
}

# 7
registeredEventsByUser(
id: ID
orderBy: EventOrderByInput
): [Event]

Description: It fetches the list of events registered by user.

Arguments:
1. id: ID - This lets you identify an object(event) uniquely.
2. orderBy: EventOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Event

Example-
query{
  registeredEventsByUser(
    orderBy: title_ASC
  )
  {
    title
    description
  }
}

# 8
event(
id: ID
): Event

Description: It fetches a single event.

Argumments:
1. id: ID - This lets you identify an object(event) uniquely.

Returns: Event

Example-
query{
  event(
      id:<id>
  ){
    title
  }
}

# 9
registrantsByEvent(
id: ID
): [User]

Description: It fetches the registrants by event.

Arguments:
1. id: ID - This lets you identify an object(event/registrant) uniquely.

Returns: Event

Example-
query{
  registrantsByEvent(
      id: <id>
  ){
    firstName
  }
}

# 10
me: User!

Description: It gives us the current user.

Arguments:
none

Returns: User

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
query{
  me{
    firstName
    lastName
  }
}

# 11
posts(
orderBy: PostOrderByInput
): [Post]

Description: It fetches the list of posts

Arguments:
1. orderBy: PostOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Post

Example-
query{
  posts(
    orderBy:id_ASC
  ){
    title
    imageUrl
  }
}

# 12
postsByOrganization(
id: ID!
orderBy: PostOrderByInput
): [Post]

Description: It fetches the list of posts by organizations.

Arguments:
1. id: ID! - This lets you identify an object(post) uniquely. The ! signifies that the object passed is non-nullable or NOT NULL.
2. orderBy: PostOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Post

Example-
query{
  postsByOrganization(
    id: <id>
    orderBy: id_ASC
  ){
    createdAt
  }
}

# 13
tasksByEvent(
id: ID!
orderBy: TaskOrderByInput
): [Task]

Description: It fetches the list of taks by events.

Arguments:
1. id: ID! - This lets you identify an object(task/event) uniquely. The ! signifies that the object passed is non-nullable or NOT NULL.
2. orderBy: PostOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Task

Example-
query{
  tasksByEvent(
    id: <id>
    orderBy: id_ASC
  ){
    title
  }
}

# 14
tasksByUser(
id: ID!
orderBy: TaskOrderByInput
): [Task]

Description: It fetches the list of taks by users.

Arguments:
1. id: ID! - This lets you identify an object(task/user) uniquely. The ! signifies that the object passed is non-nullable or NOT NULL.
2. orderBy: PostOrderByInput - Filters the data in an ordered manner according to the input provided.

Returns: Task

Example-
query{
  tasksByUser(
    id: <id>
    orderBy: id_ASC
  ){
    event
  }
}

# 15
comments: [Comment]

Description: It fetches the comments.

Arguments: 
none

Returns: Comment

Example-
query{
  comments{
    text
    creator{
      firstName
    }
  }
}

# 16
commentsByPost(
id: ID!
): [Comment]

Description: It fetches the comments by posts.

Arguments:
1. id: ID! - This lets you identify an object(comment/post) uniquely. The ! signifies that the object passed is non-nullable or NOT NULL.

Returns: Comment

Example-
query{
  commentsByPost(
      id: <id>
  ){
      text
      creator{
          firstName
      }
  }
}

# 17
post(
id: ID
): Post

Description: it fetches a single post.

Arguments:
1. id: ID - his lets you identify an object(post) uniquely.

Returns: Post

Example-
query{
    post(
        id: <id>
    ){
        text
        title
    }
}

# 18
groups: [Group]

Description: It fetches the list of groups.

Arguments:
none

Returns: Group

Example-
query{
  groups{
    title
    description
  }
}

# 19
directChats: [DirectChat]

Description: It fetches the list of direct chats.

Arguments:
none

Returns: DirectChat

Example-
query{
  directChats{
    users{
      firstName
    }
    messages{
      messageContent
    }
  }
}

# 20
directChatMessages: [DirectChatMessage]

Description: It fetches the list of direct chat messages.

Arguments:
none

Returns: DirectChatMessage

Example-
query{
  directChatMessages{
    sender{
      firstName
    }
    receiver{
      firstName
    }
    createdAt
  }
}

# 21
groupChats: [GroupChat]

Description: It fetches the list of group chats.

Arguments:
none

Returns: GroupChat

Example-
query{
  groupChats{
    users{
      firstName
    }
    messages{
      createdAt
    }
    creator{
      email
    }
  }
}

# 22
groupChatMessages: [GroupChatMessage]

Description: It fetches the list of group chat messages.

Arguments:
none

Returns: GroupChatMessages

Example-
query{
  groupChatMessages{
    sender{
      firstName
    }
    createdAt
    messageContent
  }
}

# 23
directChatsByUserID: [DirectChat]

Description: It fetches the list of direct chat by userID.

Arguments:
1. id: ID -lets you identify an object(user) uniquely.


Returns: DirectChat

Example-
query{
  directChats(
        id: <id>
    )
    {
    users{
      firstName
    }
    messages{
      messageContent
    }
  }
}

## Subscriptions
Like queries, subscriptions enable you to fetch data. Unlike queries, subscriptions are long-lasting operations that can change their result over time. They can maintain an active connection to your GraphQL server (most commonly via WebSocket), enabling the server to push updates to the subscription's result.

  type Subscription {
    messageSentToDirectChat: DirectChatMessage
    messageSentToGroupChat: GroupChatMessage
  }

# 1
messageSentToDirectChat: DirectChatMessage

Description: It fetches the list of messages sent to direct chat.

Arguments:
none

Returns: DirectChatMessage

Example-
subscription{
  messageSentToDirectChat{
    sender{
      firstName
    }
    receiver{
      firstName
    }
    createdAt
  }
}

# 2
messageSentToGroupChat: GroupChatMessage

Description: It fetches the list of messages sent to group chat.

Arguments:
none

Returns: GroupChatMessage

Example-
subscription{
  messageSentToGroupChat{
    groupChatMessageBelongsTo{
      creator{
        firstName
      }
    }
    sender{
      firstName
    }
    messageContent
  }
}

## Mutations
Mutation queries modify data in the data store and returns a value. It can be used to insert, update, or delete data. Mutations are defined as a part of the schema.

  type Mutation {
    signUp(data: UserInput!, file:Upload): AuthData!
    login(data: LoginInput!): AuthData!
    refreshToken(refreshToken: String!) : ExtendSession!
    revokeRefreshTokenForUser(userId: String!) : Boolean!

    createEvent(data: EventInput): Event!
    removeEvent(id: ID!): Event!
    registerForEvent(id: ID!): Event!
    updateEvent(id:ID!, data: UpdateEventInput) : Event!
    createOrganization(data: OrganizationInput, file:Upload): Organization!
    updateOrganization(id:ID!, data: UpdateOrganizationInput) : Organization!

    removeOrganization(id: ID!) : User!
    
    createAdmin (data: UserAndOrganizationInput!) : User!
    removeAdmin (data: UserAndOrganizationInput!) : User!
    joinPublicOrganization (organizationId: ID!) : User!
    leaveOrganization (organizationId: ID!) : User!

    removeMember (data: MultipleUsersAndOrganizationInput!) : Organization!

    adminRemovePost(organizationId: ID!, postId:ID!):Post!
    adminRemoveEvent(eventId: ID!): Event!
    adminRemoveGroup(groupId:ID!):Message!

    createPost(data: PostInput!, file: Upload): Post
    removePost(id:ID!): Post
    likePost(id:ID!): Post
    unlikePost(id:ID!): Post

    createComment(postId:ID!, data: CommentInput!): Comment
    removeComment(id:ID!): Comment
    likeComment(id:ID!): Comment
    unlikeComment(id:ID!): Comment

    createTask(data: TaskInput, eventId: ID!): Task!
    updateTask(id:ID!, data: UpdateTaskInput) : Task
    removeTask(id: ID!) : Task

    createGroup(data: GroupInput!): Group!

    sendMembershipRequest(organizationId: ID!) : MembershipRequest!
    acceptMembershipRequest(membershipRequestId: ID!): MembershipRequest!
    rejectMembershipRequest(membershipRequestId: ID!): MembershipRequest!
    cancelMembershipRequest(membershipRequestId: ID!) : MembershipRequest!

    blockUser(organizationId: ID!, userId: ID!) : User!
    unblockUser(organizationId: ID!, userId:ID!) : User!

    addUserImage(file: Upload!): User!
    removeUserImage: User!
    addOrganizationImage(file: Upload!, organizationId: String!): Organization!
    removeOrganizationImage(organizationId: String!): Organization!

    createDirectChat(data: createChatInput): DirectChat!
    removeDirectChat(chatId: ID!, organizationId: ID!) : DirectChat!
    sendMessageToDirectChat(chatId: ID!, messageContent: String!): DirectChatMessage!

    createGroupChat(data: createGroupChatInput): GroupChat!
    removeGroupChat(chatId: ID!): GroupChat!
    sendMessageToGroupChat(chatId: ID!, messageContent: String!): GroupChatMessage!
    addUserToGroupChat(userId: ID!, chatId: ID!): GroupChat!
    removeUserFromGroupChat(userId: ID!, chatId: ID!): GroupChat!
    
  }

# 1
signUp(
data: UserInput!
file: Upload
): AuthData!

Description: It creates a new user with authentication data and tokens.

Arguments:
1. data: UserInput! - It contains all the data that is needed to create the user object. The ! signifies that the object passed is non-nullable or NOT NULL.
2. file: Upload - It contains a file that is needed to create a user.

Returns: AuthData!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  signUp(data:{
    firstName:"abc"
    lastName: "def"
    email: "wef@xyz.com"
    password:"sdvsv"
  }){
    user{
      firstName
    }
  }
}

# 2
login(
data: LoginInput!
): AuthData!

Description: It updates the Auth Data whenever the user logs in.

Arguments:
1. data: LoginInput! -  It contains all the data that is needed to update the data. The ! signifies that the object passed is non-nullable or NOT NULL.

Returns: AuthData!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  login(data:{
    email: "wef@xyz.com"
    password:"sdvsv"
  }){
    user{
      firstName
    }
  }
}

# 3
refreshToken(
refreshToken: String!
): ExtendSession!

Description: It generates a new token for the user.

Arguments:
1. refreshToken: String! - It contains the Refresh Token. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: ExtendSession!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  refreshToken(refreshToken:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlblZlcnNpb24iOjAsInVzZXJJ9mD__c77yU"
  ){
    accessToken
    refreshToken
  }
}

# 4
revokeRefreshTokenForUser(
userId: String!
): Boolean!

Description: It revokes the refresh token for the user inputted.

Arguments:
1. userId: String! - It contains userId which identifies the user.

Returns: Boolean!

The returned value is true if the user is found else false.
The ! signifies that the value returned is non-nullable or NOT NULL.

Example-
mutation{
  revokeRefreshTokenForUser(userId:"6059ede189334c0242145e46")
}

# 5
createEvent(
data: EventInput
): Event!

Description: It creates an event based on the data inputted.

Arguments:
1. data: EventInput - It contains the data needed to create an event.

Returns: Event!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  createEvent(
    data:{
      title:"abc"
      description:"xyz"
      recurring: false
      isPublic: true
      isRegisterable: true
      organizationId:"dclkn123"
      startDate: "2021-03-29"
      allDay: true
    }
  ){
    title
    description
  }
}

# 6
removeEvent(
id: ID!
): Event!

Description: It removes the event based on the ID inputted.

Arguments:
1. id: ID! - It helps to identify a unique event which needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Event!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeEvent(id:<id>){
    title
    description
  }
}

# 7
registerForEvent(
id: ID!
): Event!

Description: It registers a user for an event.

Arguments:
1. id: ID! - It helps to identify a unique user which needs to be registered. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Event!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  registerForEvent(id:<id>){
    title
    description
  }
}

# 8
updateEvent(
id: ID!
data: UpdateEventInput
): Event!

Description: It updates the event information with the data inputted.

Arguments:
1. id: ID! - It helps to identify a unique event which needs to be updated. The ! signifies that the value passed is non-nullable or NOT NULL.
2. data: UpdateEventInput - It contains the data that needs to be updated.

Returns: Event!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  updateEvent(
    id:<id>
    data: {
      title:"Xyz"
    }
  ){
    title
  }
}

# 9
createOrganization(
data: OrganizationInput
file: Upload
): Organization!

Description: It creates a new organization based on the input provided.

Arguments:
1. data: OrganizationInput - It contains the data that need to be inputted.
2. file: Upload - It is the file that need to be uploaded.

Returns: Organization!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  createOrganization(
    data:{
      name:"pj1"
      description: "abcd"
      isPublic: true
      visibleInSearch:true
    }
  ){
    _id
    name
    description
  }
}

# 10
updateOrganization(
id: ID!
data: UpdateOrganizationInput
): Organization!

Description: It updates the organization information.

Arguments:
1. id: ID! - It helps to identify a unique organization which needs to be updated. The ! signifies that the value passed is non-nullable or NOT NULL.
2. data: pdateOrganizationInput - It contains the data that need to be updated.

Returns: Organization!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  updateOrganization(
    id: <id>
    data:{
      name: "xyz"
      description: "abc"
    }
  ){
    _id
    name
    description
  }
}

# 11
removeOrganization(
id: ID!
): User!

Description: It removes an organization based on the id inputted.

Arguments:
1. id: ID! - It helps to identify a unique organization which needs to be deleted . The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeOrganization(id:<id>){
    organizationsBlockedBy{
      name
    }
  }
}

# 12
createAdmin(
data: UserAndOrganizationInput!
): User!

Description: It creates an admin for an organization based on the data provided.

Arguments:
1. data: UserAndOrganizationInput! - It contains the user data who needs to be made the admin and the org data. The ! signifies that the object passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  createAdmin(
    data:{
      organizationId: <o_id>
      userId: <u_id>
    }
  ){
    adminFor
  }
}

# 13
removeAdmin(
data: UserAndOrganizationInput!
): User!

Description: It removes the user from admin.

Arguments:
1. data: UserAndOrganizationInput! - It contains the user data who needs to be removed as the admin and the org data. The ! signifies that the object passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeAdmin(
    data:{
      organizationId: <o_id>
      userId: <u_id>
    }){
      firstName
    }
}

# 14
joinPublicOrganization(
organizationId: ID!
): User!

Description: It adds organization to user.

Arguments:
1. organizationId: ID! - It helps to identify a unique organization which needs to be joined. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  joinPublicOrganization(organizationId:<o_id>){
    _id
  }
}

# 15
leaveOrganization(
organizationId: ID!
): User!

Description: It removes an organization inputted from a user.

Arguments:
1. organizationId: ID! - It helps to identify a unique organization which needs to be removed from a user. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  leaveOrganization(organizationId:<o_id>){
    joinedOrganizations
  }
}

# 16
removeMember(
data: MultipleUsersAndOrganizationInput!
): Organization!

Description: It removes multiple users from an organization.

Arguments:
1. data: MultipleUsersAndOrganizationInput! - It contains data for multiple users that need to be removed and the org data from which they are removed. The ! signifies that the data passed is non-nullable or NOT NULL.

Returns: Organization!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeMember(
    data:{
     organizationId:"<o_id>"
      userIds: [<id_1>,<id_2>]
    }
  ){
    name
  }
}

# 17
adminRemovePost(
organizationId: ID!
postId: ID!
): Post!

Description: It lets the admin delete the post.

Arguments:
1. organizationId: ID! - It helps to identify a unique organization in which post needs to be removed by the admin. The ! signifies that the value passed is non-nullable or NOT NULL.
2. postId: ID! - It helps to identify a unique  post which needs to be removed by the admin. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Post!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  adminRemovePost(
    organizationId: <o_id>
    postId: <p_id>
  ){
    text
  }
}

# 18
adminRemoveEvent(
eventId: ID!
): Event!

Description: It lets the admin remove an event.

Arguments:
1. eventId: ID! - It helps to identify a unique event which needs to be removed by the admin. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Event!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  adminRemoveEvent(
    eventId: <e_id>
  ){
    title
  }
}

# 19
adminRemoveGroup(
groupId: ID!
): Message!

Description: It lets the admin remove a group.

Arguments:
1. groupId: ID! - It helps to identify a unique group which needs to be removed by the admin. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Message!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  adminRemoveGroup(
    groupId: <g_id>
  ){
    text
  }
}

# 20
createPost(
data: PostInput!
file: Upload
): Post

Description: It creates a new post.

Arguments: 
1. data: PostInput! - It contains data for the post that needs to be created. The ! signifies that the data passed is non-nullable or NOT NULL.
2. file: Upload - It is the file that need to be uploaded.

Returns: Post

Example-
mutation{
  createPost(
    data:{
      text:"adas"
      organizationId: <o_id>
    }
  ){
    text
  }
}

# 21
removePost(
id: ID!
): Post

Description: It removes the post based on the ID provided.

Arguments:
1. id: ID! - It helps to identify a unique post which needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Post

Example-
mutation{
  removePost(
    id: <p_id>
  ){
    _id
    text
  }
}

# 22
likePost(
id: ID!
): Post

Description: It sets the post liked by the user.

Arguments: 
1. id: ID! - It helps to identify a unique post which needs to be liked. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Post

Example-
mutation{
  removePost(
    id: <p_id>
  ){
    _id
    likeCount
  }
}

# 23
unlikePost(
id: ID!
): Post

Description: It unlikes the post.

Arguments: 
1. id: ID! - It helps to identify a unique post which needs to be unliked. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Post

Example-
mutation{
  removePost(
    id: <p_id>
  ){
    _id
    likeCount
  }
}

# 24
createComment(
postId: ID!
data: CommentInput!
): Comment

Description: It creates a comment in a post.

Arguments:
1. postId: ID! - It helps to identify a unique post in which a comment needs to be created. The ! signifies that the value passed is non-nullable or NOT NULL.
2. data: CommentInput! - It contains data for the comment that needs to be created. The ! signifies that the data passed is non-nullable or NOT NULL.

Returns: Comment

Example-
mutation{
  createComment(
    postId: <p_id>
    data: {
      text:"sdg"
    }
  ){
    _id
    text
  }
}

# 25
removeComment(
id: ID!
): Comment

Description: It removes the comment based on the ID provided.

Arguments:
1. id: ID! - It helps to identify a unique comment which needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Comment

Example-
mutation{
  removeComment(
    id: <c_id>
  ){
    _id
    text
    post{
      _id
    }
  }
}

# 26
likeComment(
id: ID!
): Comment

Description: It sets the comment liked by the user.

Arguments: 
1. id: ID! - It helps to identify a unique comment which needs to be liked. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Comment

Example-
mutation{
  likeComment(
    id: <c_id>
  ){
    _id
    text
  }
}

# 27
unlikeComment(
id: ID!
): Comment

Description: It unlikes the Comment.

Arguments: 
1. id: ID! - It helps to identify a unique comment which needs to be unliked. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Comment

Example-
mutation{
  unlikeComment(
    id: <c_id>
  ){
    _id
    text
  }
}

# 28
createTask(
data: TaskInput
eventId: ID!
): Task!

Description: It creates a new task.

Arguments: 
1. data: taskInput - It contains data for task that needs to be created.
2. eventId: ID! - It helps to identify a unique event where task needs to be added. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Task!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  createTask(
    data:{
      title:"afsdg"
    }
    eventId: <e_id>
  ){
    _id
    title
  }
}

# 29
updateTask(
id: ID!
data: UpdateTaskInput
): Task

Description: It updates tasks.

Arguments:
1. id: ID! - It helps to identify a unique task which needs to be updated. The ! signifies that the value passed is non-nullable or NOT NULL.
2. data: UpdateTaskInput - It contains the data that needs to be updated.

Returns: Task 

Example-
mutation{
  updateTask(
    id: <t_id>
    data:{
      title:"Sdsdf"
    }
  ){
    _id
    title
    description
  }
}

# 30
removeTask(
id: ID!
): Task

Description: It removes the task.

Arguments:
1. id: ID! - It helps to identify a unique task which needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Task

Example-
mutation{
  removeTask(
    id: <t_id>
  ){
    _id
    title
  }
}

# 31
createGroup(
data: GroupInput!
): Group!

Description: It creates a new group.

Arguments:
1. data: GroupInput! - It contains data for the group that needs to be created. The ! signifies that the data passed is non-nullable or NOT NULL.

Returns: Group!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  createGroup(
    data: {
      organizationId: <o_id>
    }
  ){
    _id
    organization{
      members{
        firstName
      }
    }
  }
}

# 32
sendMembershipRequest(
organizationId: ID!
): MembershipRequest!

Description: It sends a membership request to the current user.

Arguments:
1. organizationId: ID! - It helps to identify a unique organization whose membership request needs to be sent. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: MembershipRequest!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  sendMembershipRequest(
    organizationId: <o_id>
  ){
    _id
    user{
      firstName
    }
  }
}

# 33
acceptMembershipRequest(
membershipRequestId: ID!
): MembershipRequest!

Description: It accepts the membership request and add the user as a member to the organization.

Arguments:
1. membershipRequestId: ID! - It helps to identify a unique membership request that needs to be accepted. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: MembershipRequest!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  acceptMembershipRequest(
    membershipRequestId:  <m_id>
  ){
    _id
    user{
      firstName
    }
    organization{
      name
    }
  }
}

# 34
rejectMembershipRequest(
membershipRequestId: ID!
): MembershipRequest!

Description: It rejects the membership request for the user.

Argument:
1. membershipRequestId: ID! - It helps to identify a unique membership request that needs to be rejected. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: MembershipRequest!

Eample-
mutation{
  rejectMembershipRequest(
    membershipRequestId: <m_id>
  ){
    _id
    user{
      firstName
    }
    organization{
      name
    }
  }
}

# 35
cancelMembershipRequest(
membershipRequestId: ID!
): MembershipRequest!

Description: It cancels the membership of the user.

Arguments:
1. membershipRequestId: ID! - It helps to identify a unique membership request that needs to be cancelled. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: MembershipRequest!

Example-
mutation{
  cancelMembershipRequest(
    membershipRequestId: <m_id>
  ){
    _id
    user{
      firstName
    }
    organization{
      name
    }
  }
}

# 36
blockUser(
organizationId: ID!
userId: ID!
): User!

Description: It blocks the user.

Arguments:
1. organizationId: ID! - It helps to identify a unique organization that needs to block user. The ! signifies that the value passed is non-nullable or NOT NULL.
2. userId: ID! - It helps to identify a unique user that needs to blocked. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  blockUser(
    organizationId: <o_id>
    userId: <u_id>
  ){
    organizationsBlockedBy{
      name
    }
  }
}

# 37
unblockUser(
organizationId: ID!
userId: ID!
): User!

Description: It unblocks the user.

Arguments:
1. organizationId: ID! - It helps to identify a unique organization that needs to unblock user. The ! signifies that the value passed is non-nullable or NOT NULL.
2. userId: ID! - It helps to identify a unique user that needs to unblocked. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  unblockUser(
    organizationId: <o_id>
    userId: <u_id>
  ){
    joinedOrganizations{
      name
    }
  }
}

# 38
addUserImage(
file: Upload!
): User!

Description: It adds an image to the user profile.

Arguments:
1. file: Upload! - It is the file that need to be uploaded. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  addUserImage(
    file: <file_Upload>
  ){
    firsrtName
  }
}

# 39
removeUserImage: User!

Description: It removes the profile image of the current user.

Arguments:
none

Returns: User!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeUserImage{
    _id
    firstName
  }
}

# 40
addOrganizationImage(
file: Upload!
organizationId: String!
): Organization!

Description: It adds image to the organization profile.

Arguments:
1. file: Upload! - It is the file that need to be uploaded. The ! signifies that the value passed is non-nullable or NOT NULL.
2. organizationId: String! - It helps to identify the organization where image needs to be added. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Organization!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  addOrganizationImage(
    file:<file_Upload>
    organizationId: "abc"
  ){
    image
  }
}

# 41
removeOrganizationImage(
organizationId: String!
): Organization!

Description: It removes the image from organization profile.

Arguments:
1. organizationId: String! - It helps to identify the organization from which image needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: Organization!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeOrganizationImage(
    organizationId: "abc"
  ){
    image
  }
}

# 42
createDirectChat(
data: createChatInput
): DirectChat!

Description: It creates a direct chat between users.

Arguments:
1. data: createChatInput - It contains the necessary data for creating a chat.

Returns: DirectChat!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  createDirectChat(
    data:{
      userIds: [<id_1>,<id_2>]
      organizationId: <o_id>
    }
  ){
    messages{
      messageContent
    }
  }
}

# 43
removeDirectChat(
chatId: ID!
organizationId: ID!
): DirectChat!

Description: It removes the direct chat between the users.

Arguments:
1. chatId: ID! - It helps to identify the chat which needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.
2. organizationId: ID! -  It helps to identify a unique organization from which direct chat needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: DirectChat!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeDirectChat(
    chatId: <c_id>
    organizationId: <o_id>
  ){
    _id
    messages{
      messageContent
    }
  }
}

# 44
sendMessageToDirectChat(
chatId: ID!
messageContent: String!
): DirectChatMessage!

Description: It lets the user send a message to direct chat.

Arguments:
1. chatId: ID! - It helps to identify the chat where message needs to be sent. The ! signifies that the value passed is non-nullable or NOT NULL.
2. messageContent: String! - It contains the data/body of the message.

Returns: DirectChatMessage!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  sendMessageToDirectChat(
    chatId: <c_id>
    messageContent: "Hello"
  ){
    _id
    sender{
      firstName
    }
    receiver{
      firstName
    }
    messageContent
  }
}

# 45
createGroupChat(
data: createGroupChatInput
): GroupChat!

Description: It creates a new group chat.

Arguments:
1. data: createGroupChatInput - It contains the necessary data to create a new group chat.

Returns: GroupChat!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  createGroupChat(
    data:{
      userIds:[<id_1>,<id_2>,<id_3>]
      organizationId: <o_id>>
      title: "New Chat"
    }
  ){
    _id
    messages{
      messageContent
    }
  }
}

# 46
removeGroupChat(
chatId: ID!
): GroupChat!

Description: It removes the group chat.

Arguments:
1. chatId: ID! - It helps to identify the group chat which needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: GroupChat!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeGroupChat(
    chatId: <c_id>
  ){
    _id
    creator{
      firstName
    }
  }
}

# 47
sendMessageToGroupChat(
chatId: ID!
messageContent: String!
): GroupChatMessage!

Description: It lets the user send a message to the group chat.

Arguments:
1. chatId: ID! - It helps to identify the group chat where the user needs to send the message. The ! signifies that the value passed is non-nullable or NOT NULL.
2. messageContent: String! - It contains the data/body of the message to be sent on the group chat. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: GroupChatMessage!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  sendMessageToGroupChat(
    chatId: <c_id>
    messageContent: "Hey guys!!"
  ){
    _id
    messageContent
  }
}

# 48
addUserToGroupChat(
userId: ID!
chatId: ID!
): GroupChat!

Description: It adds a user to a group chat.

Arguments:
1. userId: ID! - It helps to identify the user who needs to be added on the group chat. The ! signifies that the value passed is non-nullable or NOT NULL.
2. chatId: ID! - It helps to identify the group chat where the user needs to be added. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: GroupChat!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  addUserToGroupChat(
    userId: <u_id>
    chatId: <c_id>
  ){
    _id
    users{
      firstName
    }
  }
}

# 49
removeUserFromGroupChat(
userId: ID!
chatId: ID!
): GroupChat!

Description: It removes a user from the group chat.

Arguments:
1. userId: ID! - It helps to identify the user who needs to be removed from the group chat. The ! signifies that the value passed is non-nullable or NOT NULL.
2. chatId: ID! - It helps to identify the group chat from which the user needs to be removed. The ! signifies that the value passed is non-nullable or NOT NULL.

Returns: GroupChat!

The ! signifies that the object returned is non-nullable or NOT NULL.

Example-
mutation{
  removeUserFromGroupChat(
    userId: <u_id>
    chatId: <c_id>
  ){
    _id
    users{
      firstName
    }
  }
}