import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { deletePreviousVideo } from "../../../src/utilities/encodedVideoStorage/deletePreviousVideo";
import { EncodedVideo } from "../../../src/models/EncodedVideo";
import { uploadEncodedVideo } from "../../../src/utilities/encodedVideoStorage/uploadEncodedVideo";

let MONGOOSE_INSTANCE: typeof mongoose;
let testPreviousVideoPath: string;
const vid =
  "data:video/mp4;base64,AAAAGGZ0eXBtcDQyAAAAAG1wNzEAAAABBGFtYXB0aW9uICogAAAAHE1vYmlsZSBsaW5lIHZpYSBteXNxbCBkZyBtZWV0IHVwbG9hZGVkIGJ5IHNwZWNpZmllZC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byB0aGUgZGF0YS4gQnkgdGhvdWdodCB0aGVpciBlbmNvZGluZyBhcHBsaWNhdGlvbnMgaW5jbHVkaW5nIGVtYWlsIHZpYSBNSU1FLCBsaWtlIHZlcnkgY29tcGxleCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4gVGhpcyBlbmNvZGluZyBoZWxwcyB0byBlbnN1cmUgdGhhdCB0aGVyZSBpcyBhIG5lZWQgdG8gYmUgc3RvcnJlZCBkYXRhLCBlc3BlY2lhbGx5IHdoZW4gdGhhdCBldmVyeSBkYXRhIG5lZWRzIHRvIGJlIHN0b3JlZCBhbmQgdHJhbnNmZXJyZWQgb3ZlciBtZWRpYSB0aGF0IGFyZSBkZXNpZ25lZCB0byBkZWFsIHdpdGggdGV4dC4=";

// Replace with your actual base64-encoded video data

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await EncodedVideo.deleteMany({});
  testPreviousVideoPath = await uploadEncodedVideo(vid, null); // Upload video instead of image
  await uploadEncodedVideo(vid, null); // Upload another video
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("src -> utilities -> encodedVideoStorage -> deletePreviousVideo", () => {
  it("should not delete the video from the FileSystem but decrement the number of uses", async () => {
    const encodedVideoBefore = await EncodedVideo.findOne({
      fileName: testPreviousVideoPath,
    });

    expect(encodedVideoBefore?.numberOfUses).toBe(2);

    await deletePreviousVideo(testPreviousVideoPath);

    const encodedVideoAfter = await EncodedVideo.findOne({
      fileName: testPreviousVideoPath,
    });
    expect(encodedVideoAfter?.numberOfUses).toBe(1);
  });

  it("should delete the video from the filesystem if the number of uses is only one at that point", async () => {
    await deletePreviousVideo(testPreviousVideoPath);
  });
});
