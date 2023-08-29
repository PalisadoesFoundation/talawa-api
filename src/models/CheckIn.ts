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

export interface InterfaceCheckIn {
  _id: Types.ObjectId;
  eventAttendeeId: PopulatedDoc<InterfaceEventAttendee & Document>;
  time: Date;
  allotedRoom: string;
  allotedSeat: string;
  feedbackSubmitted: boolean;
}

const checkInSchema = new Schema({
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
  allotedRoom: {
    type: String,
    required: false,
  },
  allotedSeat: {
    type: String,
    required: false,
  },
  feedbackSubmitted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// We will also create an index here for faster database querying
checkInSchema.index({
  eventAttendeeId: 1,
});

const checkInModel = (): Model<InterfaceCheckIn> =>
  model<InterfaceCheckIn>("CheckIn", checkInSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.

export const CheckIn = (models.CheckIn || checkInModel()) as ReturnType<
  typeof checkInModel
>;
