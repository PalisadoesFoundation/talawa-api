[API Docs](/)

***

# Function: getKeyPathsWithNonUndefinedValues()

> **getKeyPathsWithNonUndefinedValues**\<`T`\>(`__namedParameters`): `Paths`\<`T`\>[]

Defined in: [src/utilities/getKeyPathsWithNonUndefinedValues.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/getKeyPathsWithNonUndefinedValues.ts#L42)

This function takes in a javascript object and a list of key paths within that object as arguments and outputs all paths amongst those key paths that correspond to a non-undefined value.

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### \_\_namedParameters

#### keyPaths

`Paths`\<`T`\>[]

#### object

`T`

## Returns

`Paths`\<`T`\>[]

## Example

```typescript
const object = \\{
  field1: undefined,
  field2: "value2",
  field3: undefined,
  field4: null,
  field5: \\{
    field6: "value6",
  \\},
  field7: \\{
    field8: \\{
      field9: "value9",
      field10: undefined,
      field11: null
    \\}
  \\},
  field12: [
    "value12",
    undefined,
    null,
    \\{
      field13: "value13"
    \\}
  ]
\\}

const keyPaths = getKeyPathsWithNonUndefinedValues([
  ["field1"],
  ["field2"],
  ["field4"]
]);
```
