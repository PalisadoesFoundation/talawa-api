[API Docs](/)

***

# Variable: signUpBody

> `const` **signUpBody**: `ZodObject`\<\{ `email`: `ZodString`; `firstName`: `ZodString`; `lastName`: `ZodString`; `password`: `ZodString`; \}, `$strip`\>

Defined in: src/routes/auth/validators.ts:8

Zod schema for REST sign-up request body. Aligns with MutationSignUpInput password length.
