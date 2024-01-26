import type { InterfaceCampaignPledge } from "../../src/models";
import type { Document } from "mongoose";

export type TestCampaignPledgeType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (InterfaceCampaignPledge & Document<any, any, InterfaceCampaignPledge>)
  | null;
