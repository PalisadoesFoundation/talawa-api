# About this directory

Talawa-api uses schema-first approach for its graphQL implementation and this directory contains the schema definition for it. Most of the files in this directory represent a distinct type within the graphQL SDL(Schema Definition Language). All these types are then imported into the `index.ts` file, merged into a list and exported to be consumed by a graphQL server.

<br/>

# Structuring

Try to structure fields alphabetically whereever possible. This saves the mental overhead of navigating to different fields to a big extent.

<br/>

# Documentation

GraphQL allows developers to document their whole graphQL api within the schema. This is done through the use a pair of `"""` symbols. Any text enclosed within these symbols becomes a description for the field it precedes.

Here's a good example:-

        """
        This is the graphQL object type of a user.
        """
        type User {
            """
            This is the unique id of the user.
            """
            id

            """
            This is userName of the user.
            """
            userName
        }

        """
        This is the graphQL input type of the input required for creating a user.
        """
        input UpdateUserInput{
            """
            This is the new userName the user wants to update their previous userName with.
            Constraints:-
            1. Should be at least 1 character long.
            2. Should be at most 30 characters long.
            """
            userName: String
        }

        type Mutation{
            updateUser(
                """
                This is the unique id of the user to update.
                """
                id: String!

                """
                This is the input argument which contains data to update the user with.
                """
                input: UpdateUserInput!
            ): User!
        }

        """
        You can use # symbol to comment stuff in the graphQL schema as shown for the RandomType below.
        """
        # type RandomType{
        #     randomField: String!
        # }

There are other types in graphQL SDL but they will also follow the same syntax for documentation. Try to document every bit of schema that you can while writing the schema itself. This will save you time later on. Try to be as explicit as you can be and include everything the field expects the client to do so that the client consuming your graphQL api doesn't have to manually to check the fields for different edge cases.
