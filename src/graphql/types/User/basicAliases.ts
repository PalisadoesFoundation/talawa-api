import { User } from "./User";

User.implement({
  fields: (t) => ({
    firstName: t.string({
      resolve: (u: User) => u.name?.split(" ")[0] ?? "",
    }),
    lastName: t.string({
      resolve: (u: User) => u.name?.split(" ").slice(1).join(" ") ?? "",
    }),

    image: t.string({
      nullable: true,
      resolve: (u: User) => u.avatarName ?? null,
    }),

    _id: t.exposeID("id"),
    email: t.exposeString("emailAddress"),
  }),
});
