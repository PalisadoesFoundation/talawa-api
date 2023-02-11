# About this directory

Talawa-api uses schema-first approach for its graphQL implementation and this directory contains the schema definition for it. The main schema is exported through the file `index.ts` to be consumed by a graphQL server.

<br/>

# Structuring

Most of the files in this directory represent a collection of some distinct type within the graphQL [SDL(Schema Definition Language)](https://graphql.org/learn/). All these collections are then imported into the `index.ts` file, merged into a list and exported under a variable named `typeDefs`.

Try to use alphabetical structuring whereever possible. This saves the mental overhead of navigating to different files, fields to a big extent. When things get too cluttered try adding newlines and spaces between items.

<br/>

# Documentation

GraphQL allows developers to document their whole graphQL api within the schema. This is done using of a pair of `"""` symbols. Any text enclosed within these symbols becomes a description for the field it precedes.

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
        This is the graphQL input type of the input required for updating a user.
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

There are other types in graphQL SDL but they will also follow the same syntax for documentation. Try to document every bit of schema that you can while writing the schema itself. This will save you time later on.

Try to be as explicit as you can be and include everything the fields expect the client to do so that the client consuming your graphQL api doesn't have to manually to check the fields for different edge cases.

<br/>

# Commented out schema

You can use `#` symbol to comment out stuff in the graphQL schema as shown for the `RandomType` below:-

        # type RandomType{
        #     randomField: String!
        # }

<br/>

# Schema represents a contract

A graphQL schema represents a contract between the server and the clients. Be very careful when editing the schema as you can unknowingly edit stuff which breaks functionality for all clients relying on the schema. Read the [graphQL spec](https://spec.graphql.org/October2021/) for more information.
