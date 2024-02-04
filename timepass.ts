import { createTestUserFunc } from "./tests/helpers/user";

async function crtusr() :any {
 const user1:any = await createTestUserFunc()
 await user1.save()
console.log(user1.identifier)
}

crtusr()