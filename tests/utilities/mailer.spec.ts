import nodemailer from "nodemailer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ERROR_IN_SENDING_MAIL, MAIL_PASSWORD, MAIL_USERNAME } from "../../src/constants";
import { mailer } from "../../src/utilities/mailer";
import { nanoid } from "nanoid";
import Mail from "nodemailer/lib/mailer";

interface Test_Interface_MailFields {
  emailTo: string;
  subject: string;
  body: string;
}

const testMailFields: Test_Interface_MailFields = {
  emailTo: `${nanoid().toLowerCase()}@gmail.com`,
  subject: `${nanoid()}`,
  body: `${nanoid()}`,
};

const testTransport: object = {
  service: "gmail",
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
};

describe("utilities -> mailer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns resolved Promise", () => {
    const mockInfo: object = {
      message: "info created",
    };

    const mockCreateTransport = vi
      .spyOn(nodemailer, "createTransport")
      .mockImplementationOnce((_transport: object) => {
        const mockSendMail = (
          _mailOptions: Mail.Options,
          callBackFn: (_err: Error | null, _info: object) => void
        ) => {
          return callBackFn(null, mockInfo);
        };

        return {
          sendMail: mockSendMail,
        } as Mail;
      });

    expect(mailer(testMailFields)).resolves.toEqual(mockInfo);
    expect(mockCreateTransport).toHaveBeenCalledWith(testTransport);
  });

  it("returns rejected Promise with ERROR_IN_SENDING_MAIL", () => {
    const mockCreateTransport = vi
      .spyOn(nodemailer, "createTransport")
      .mockImplementationOnce((_transport: object) => {
        const mockSendMail = (
          _mailOptions: Mail.Options,
          callBackFn: (_err: Error | null, _info: object | null) => void
        ) => {
          return callBackFn(new Error("rejects Promise"), null);
        };

        return {
          sendMail: mockSendMail,
        } as Mail;
      });

    expect(mailer(testMailFields)).rejects.toEqual(ERROR_IN_SENDING_MAIL);
    expect(mockCreateTransport).toHaveBeenCalledWith(testTransport);
  });
});
