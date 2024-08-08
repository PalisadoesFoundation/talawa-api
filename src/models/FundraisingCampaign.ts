import type { Model, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceFund } from "./Fund";
import type { InterfaceFundraisingCampaignPledges } from "./FundraisingCampaignPledge";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Enum for currency types with their respective codes.
 * This enum lists all the possible currency codes that can be used in the system.
 */
export enum CurrencyType {
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
  MNT = "MNT", // Mongolian Tugrik
  MOP = "MOP", // Macanese Pataca
  MRU = "MRU", // Mauritanian Ouguiya
  MUR = "MUR", // Mauritian Rupee
  MVR = "MVR", // Maldivian Rufiyaa
  MWK = "MWK", // Malawian Kwacha
  MXN = "MXN", // Mexican Peso
  MYR = "MYR", // Malaysian Ringgit
  MZN = "MZN", // Mozambican Metical
  NAD = "NAD", // Namibian Dollar
  NGN = "NGN", // Nigerian Naira
  NIO = "NIO", // Nicaraguan Córdoba
  NOK = "NOK", // Norwegian Krone
  NPR = "NPR", // Nepalese Rupee
  NZD = "NZD", // New Zealand Dollar
  OMR = "OMR", // Omani Rial
  PAB = "PAB", // Panamanian Balboa
  PEN = "PEN", // Peruvian Nuevo Sol
  PGK = "PGK", // Papua New Guinean Kina
  PHP = "PHP", // Philippine Peso
  PKR = "PKR", // Pakistani Rupee
  PLN = "PLN", // Polish Zloty
  PYG = "PYG", // Paraguayan Guarani
  QAR = "QAR", // Qatari Rial
  RON = "RON", // Romanian Leu
  RSD = "RSD", // Serbian Dinar
  RUB = "RUB", // Russian Ruble
  RWF = "RWF", // Rwandan Franc
  SAR = "SAR", // Saudi Riyal
  SBD = "SBD", // Solomon Islands Dollar
  SCR = "SCR", // Seychellois Rupee
  SDG = "SDG", // Sudanese Pound
  SEK = "SEK", // Swedish Krona
  SGD = "SGD", // Singapore Dollar
  SHP = "SHP", // Saint Helena Pound
  SLL = "SLL", // Sierra Leonean Leone
  SOS = "SOS", // Somali Shilling
  SPL = "SPL", // Seborgan Luigino
  SRD = "SRD", // Surinamese Dollar
  STN = "STN", // São Tomé and Príncipe Dobra
  SVC = "SVC", // Salvadoran Colón
  SYP = "SYP", // Syrian Pound
  SZL = "SZL", // Swazi Lilangeni
  THB = "THB", // Thai Baht
  TJS = "TJS", // Tajikistani Somoni
  TMT = "TMT", // Turkmenistani Manat
  TND = "TND", // Tunisian Dinar
  TOP = "TOP", // Tongan Pa'anga
  TRY = "TRY", // Turkish Lira
  TTD = "TTD", // Trinidad and Tobago Dollar
  TVD = "TVD", // Tuvaluan Dollar
  TWD = "TWD", // New Taiwan Dollar
  TZS = "TZS", // Tanzanian Shilling
  UAH = "UAH", // Ukrainian Hryvnia
  UGX = "UGX", // Ugandan Shilling
  USD = "USD", // United States Dollar
  UYU = "UYU", // Uruguayan Peso
  UZS = "UZS", // Uzbekistan Som
  VEF = "VEF", // Venezuelan Bolívar
  VND = "VND", // Vietnamese Dong
  VUV = "VUV", // Vanuatu Vatu
  WST = "WST", // Samoan Tala
  XAF = "XAF", // CFA Franc BEAC
  XCD = "XCD", // East Caribbean Dollar
  XDR = "XDR", // Special Drawing Rights
  XOF = "XOF", // CFA Franc BCEAO
  XPF = "XPF", // CFP Franc
  YER = "YER", // Yemeni Rial
  ZAR = "ZAR", // South African Rand
  ZMW = "ZMW", // Zambian Kwacha
  ZWD = "ZWD", // Zimbabwean Dollar
}

export interface InterfaceFundraisingCampaign {
  _id: Types.ObjectId;
  fundId: PopulatedDoc<InterfaceFund & Document>;
  organizationId: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  fundingGoal: number;
  currency: CurrencyType;
  pledges: PopulatedDoc<InterfaceFundraisingCampaignPledges & Document>[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for a fundraising campaign document.
 * This schema defines how the data will be stored in the MongoDB database.
 *
 * @param fundId - Reference to the parent fund.
 * @param organizationId - Organization ID to which the fundraising campaign belongs.
 * @param name - Name of the fundraising campaign.
 * @param startDate - Start date of the fundraising campaign.
 * @param endDate - End date of the fundraising campaign.
 * @param fundingGoal - Financial goal of the fundraising campaign.
 * @param currency - Currency in which the funding goal is specified.
 * @param pledges - List of pledges associated with the fundraising campaign.
 */
const fundraisingCampaignSchema = new Schema(
  {
    fundId: {
      type: Schema.Types.ObjectId,
      ref: "Fund",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
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
      required: true,
    },
    fundingGoal: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: Object.values(CurrencyType), // Must be one of the defined currency types
    },
    pledges: [
      {
        type: Schema.Types.ObjectId,
        ref: "FundraisingCampaignPledge",
      },
    ],
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

/**
 * Adds logging middleware to the fundraising campaign schema.
 * This middleware logs changes to fundraising campaign documents.
 */
createLoggingMiddleware(fundraisingCampaignSchema, "FundRaisingCampaign");

/**
 * Creates a Mongoose model for the fundraising campaign schema.
 * This function ensures that we don't create multiple models during testing, which can cause errors.
 *
 * @returns The FundraisingCampaign model.
 */
const fundraisingCampaignModel = (): Model<InterfaceFundraisingCampaign> =>
  model<InterfaceFundraisingCampaign>(
    "FundraisingCampaign",
    fundraisingCampaignSchema,
  );

/**
 * Export the FundraisingCampaign model.
 * This syntax ensures we don't get an OverwriteModelError while running tests.
 */
export const FundraisingCampaign = (models.FundraisingCampaign ||
  fundraisingCampaignModel()) as ReturnType<typeof fundraisingCampaignModel>;
