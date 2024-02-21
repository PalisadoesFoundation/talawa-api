import type { Model, PopulatedDoc, Types } from "mongoose";

import { Schema, model, models } from "mongoose";
import type { InterfaceFund } from "./Fund";
enum CurrencyType {
  AED = "AED", // United Arab Emirates Dirham
  AFN = "AFN", // Afghan Afghani
  ALL = "ALL", // Albanian Lek
  AMD = "AMD", // Armenian Dram
  ANG = "ANG", // Netherlands Antillean Guilder
  AOA = "AOA", // Angolan Kwanza
  ARS = "ARS", // Argentine Peso
  AUD = "AUD", // Australian Dollar
  AWG = "AWG", // Aruban Florin
  AZN = "AZN", // Azerbaijani Manat
  BAM = "BAM", // Bosnia-Herzegovina Convertible Mark
  BBD = "BBD", // Barbadian Dollar
  BDT = "BDT", // Bangladeshi Taka
  BGN = "BGN", // Bulgarian Lev
  BHD = "BHD", // Bahraini Dinar
  BIF = "BIF", // Burundian Franc
  BMD = "BMD", // Bermudian Dollar
  BND = "BND", // Brunei Dollar
  BOB = "BOB", // Bolivian Boliviano
  BRL = "BRL", // Brazilian Real
  BSD = "BSD", // Bahamian Dollar
  BTN = "BTN", // Bhutanese Ngultrum
  BWP = "BWP", // Botswanan Pula
  BYN = "BYN", // Belarusian Ruble
  BZD = "BZD", // Belize Dollar
  CAD = "CAD", // Canadian Dollar
  CDF = "CDF", // Congolese Franc
  CHF = "CHF", // Swiss Franc
  CLP = "CLP", // Chilean Peso
  CNY = "CNY", // Chinese Yuan
  COP = "COP", // Colombian Peso
  CRC = "CRC", // Costa Rican Colón
  CUP = "CUP", // Cuban Peso
  CVE = "CVE", // Cape Verdean Escudo
  CZK = "CZK", // Czech Koruna
  DJF = "DJF", // Djiboutian Franc
  DKK = "DKK", // Danish Krone
  DOP = "DOP", // Dominican Peso
  DZD = "DZD", // Algerian Dinar
  EGP = "EGP", // Egyptian Pound
  ERN = "ERN", // Eritrean Nakfa
  ETB = "ETB", // Ethiopian Birr
  EUR = "EUR", // Euro
  FJD = "FJD", // Fijian Dollar
  FKP = "FKP", // Falkland Islands Pound
  FOK = "FOK", // Faroese Krona
  FRO = "FRO", // Fijian Dollar
  GBP = "GBP", // British Pound Sterling
  GEL = "GEL", // Georgian Lari
  GGP = "GGP", // Guernsey Pound
  GHS = "GHS", // Ghanaian Cedi
  GIP = "GIP", // Gibraltar Pound
  GMD = "GMD", // Gambian Dalasi
  GNF = "GNF", // Guinean Franc
  GTQ = "GTQ", // Guatemalan Quetzal
  GYD = "GYD", // Guyanaese Dollar
  HKD = "HKD", // Hong Kong Dollar
  HNL = "HNL", // Honduran Lempira
  HRK = "HRK", // Croatian Kuna
  HTG = "HTG", // Haitian Gourde
  HUF = "HUF", // Hungarian Forint
  IDR = "IDR", // Indonesian Rupiah
  ILS = "ILS", // Israeli New Shekel
  IMP = "IMP", // Manx pound
  INR = "INR", // Indian Rupee
  IQD = "IQD", // Iraqi Dinar
  IRR = "IRR", // Iranian Rial
  ISK = "ISK", // Icelandic Króna
  JEP = "JEP", // Jersey Pound
  JMD = "JMD", // Jamaican Dollar
  JOD = "JOD", // Jordanian Dinar
  JPY = "JPY", // Japanese Yen
  KES = "KES", // Kenyan Shilling
  KGS = "KGS", // Kyrgystani Som
  KHR = "KHR", // Cambodian Riel
  KID = "KID", // Kiribati dollar
  KMF = "KMF", // Comorian Franc
  KRW = "KRW", // South Korean Won
  KWD = "KWD", // Kuwaiti Dinar
  KYD = "KYD", // Cayman Islands Dollar
  KZT = "KZT", // Kazakhstani Tenge
  LAK = "LAK", // Laotian Kip
  LBP = "LBP", // Lebanese Pound
  LKR = "LKR", // Sri Lankan Rupee
  LRD = "LRD", // Liberian Dollar
  LSL = "LSL", // Lesotho Loti
  LYD = "LYD", // Libyan Dinar
  MAD = "MAD", // Moroccan Dirham
  MDL = "MDL", // Moldovan Leu
  MGA = "MGA", // Malagasy Ariary
  MKD = "MKD", // Macedonian Denar
  MMK = "MMK", // Myanma Kyat
  MNT = "MNT", // Mongolian
}

/**
 * This is the structure of a file
 * @param fund - parent fund to which campaign belongs
 * @param name - Name of the campaign
 * @param startDate - Start date of the campaign
 * @param endDate - End date of the campaign
 * @param fundingGoal - Goal of the campaign
 * @param currency - Currency of the campaign
 * @param createdAt - Timestamp of creation
 * @param updatedAt - Timestamp of updation
 *
 */
export interface InterfaceFundraisingCampaign {
  _id: Types.ObjectId;
  fundId: PopulatedDoc<InterfaceFund & Document>;
  name: string;
  startDate: Date;
  endDate: Date;
  fundingGoal: number;
  currency: CurrencyType;
  createdAt: Date;
  updatedAt: Date;
}
const fundraisingCampaignSchema = new Schema(
  {
    fundId: {
      type: Schema.Types.ObjectId,
      ref: "Fund",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    fundingGoal: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: Object.values(CurrencyType),
    },
  },
  {
    timestamps: true,
  },
);
const fundraisingCampaignModel = (): Model<InterfaceFundraisingCampaign> =>
  model<InterfaceFundraisingCampaign>(
    "FundraisingCampaign",
    fundraisingCampaignSchema,
  );
// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const FundraisingCampaign = (models.fundraisingCampaignModel ||
  fundraisingCampaignModel()) as ReturnType<typeof fundraisingCampaignModel>;
