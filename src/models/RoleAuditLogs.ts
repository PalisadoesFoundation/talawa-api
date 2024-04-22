import type { PaginateModel, PopulatedDoc, Types } from "mongoose";
import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";

export interface InterfaceRoleAuditLog {
  _id: Types.ObjectId;
  roleEditorUserId: PopulatedDoc<InterfaceUser & Document>;
  affectedUserId: PopulatedDoc<InterfaceUser & Document>;
  organizationId: PopulatedDoc<InterfaceOrganization & Document>;
  description: string;
}

const roleAuditLogSchema = new Schema<InterfaceRoleAuditLog>(
  {
    roleEditorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    affectedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

roleAuditLogSchema.plugin(mongoosePaginate);

export const RoleAuditLogs = model<
  InterfaceRoleAuditLog,
  PaginateModel<InterfaceRoleAuditLog>
>("RoleAuditLogs", roleAuditLogSchema);
