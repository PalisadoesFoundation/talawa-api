import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Tag } from "./Tag";

export interface Interface_EventTag {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  tagId: PopulatedDoc<Interface_Tag & Document>;
}

const EventTagSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Event",
  },
  tagId: {
    type: Schema.Types.ObjectId,
    ref: "Tag",
    required: true,
  },
});

EventTagSchema.index({ eventId: 1, tagId: 1 }, { unique: true });

const EventTagModel = () =>
  model<Interface_EventTag>("EventTag", EventTagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventTag = (models.EventTag || EventTagModel()) as ReturnType<
  typeof EventTagModel
>;
