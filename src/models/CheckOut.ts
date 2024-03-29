import {
  Schema,
  model,
  type PopulatedDoc,
  type Types,
  type Document,
  models,
  type Model,
} from "mongoose";
import { type InterfaceEventAttendee } from "./EventAttendee";
import { createLoggingMiddleware } from "../libraries/dbLogger";

export interface InterfaceCheckOut {
  _id: Types.ObjectId;
  eventAttendeeId: PopulatedDoc<InterfaceEventAttendee & Document>;
  time: Date;
  createdAt: Date;
  updatedAt: Date;
}

const checkOutSchema = new Schema(
  {
    eventAttendeeId: {
      type: Schema.Types.ObjectId,
      ref: "EventAttendee",
      required: true,
    },
    time: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// We will also create an index here for faster database querying
checkOutSchema.index({
  eventAttendeeId: 1,
});

createLoggingMiddleware(checkOutSchema, "CheckOut");

const checkOutModel = (): Model<InterfaceCheckOut> =>
  model<InterfaceCheckOut>("CheckOut", checkOutSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.

export const CheckOut = (models.CheckOut || checkOutModel()) as ReturnType<
  typeof checkOutModel
>;
