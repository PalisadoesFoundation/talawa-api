[**talawa-api**](../../../README.md)

***

# Function: isNotNullish()

> **isNotNullish**\<`T0`\>(`value`): `value is T0`

This function is used to check nullish state of a value passed to it. Nullish means the
value being either `null` or `undefined`. If the value is found to be nullish, the function
returns the boolean `false`, else it returns the boolean `true`.

## Type Parameters

• **T0**

## Parameters

### value

`T0`

## Returns

`value is T0`

## Example

```ts
Here's an example:-
function print(str: string | null) {
  if(isNotNullish(str)) {
    console.log(`the string is ${str}`)
  } else {
    console.log(`the string is null`)
  }
}
```

## Defined in

[src/utilities/graphQLConnection/index.ts:15](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/utilities/graphQLConnection/index.ts#L15)
