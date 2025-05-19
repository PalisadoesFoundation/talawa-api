# About this directory

This directory contains the runtime typescript code for talawa api. Only code that is used by talawa api at runtime must be stored in this directory.

# Directory structure requirements

An `index.ts` file must be present in this directory containing logic for starting the talawa api server upon execution by a compatible typscript executor.

Other than that there aren't any strict directory structure requirements. Currently we are following a flat directory structure where inter-related code is colocated into directories or files as the need arises. For example, when a single file becomes unwieldily large(think thousands of lines of code) or when it semantically makes more sense for some code to be detached and stored seperately.

# Future considerations

In the future, if the talawa api codebase becomes exceedingly big with many active contributors working on it, the codebase would need to be segregated into modules that represent business domains and this segregation must happen all the way to the persistence layer.

Modular monolithic architecture is a relatively new term in system architecture design and it helps us achieve exactly that. It can be summarized as microservices but in a monolith. Just like microservices communicate over a network interface and abide by a contract for information exchange, similarly, the business domain modules in modular monoliths communicate over an interface that runs within a shared execution context between those modules and they too abide by a contract for information exchange.

Currently the talawa api business domain models share common persistence layers, so it makes no sense to architect the application into something that resembles a modular monolith but isn't actually one. This is because just structuring the project a certain way wouldn't get rid of the dependencies that business domains have on each other, it would just give a false sense of modularisation and more verbosity while the amount of inter-dependency and complexity of the codebase would remain the same.