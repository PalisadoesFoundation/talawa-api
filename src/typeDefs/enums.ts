import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const enums = gql`
  enum ActionItemsOrderByInput {
    createdAt_ASC
    createdAt_DESC
    dueDate_ASC
    dueDate_DESC
  }

  enum EventOrderByInput {
    id_ASC
    id_DESC
    title_ASC
    title_DESC
    description_ASC
    description_DESC
    startDate_ASC
    startDate_DESC
    endDate_ASC
    endDate_DESC
    allDay_ASC
    allDay_DESC
    startTime_ASC
    startTime_DESC
    endTime_ASC
    endTime_DESC
    recurrance_ASC
    recurrance_DESC
    location_ASC
    location_DESC
  }

  enum RecurringEventMutationType {
    allInstances
    thisInstance
    thisAndFollowingInstances
  }

  enum Frequency {
    YEARLY
    MONTHLY
    WEEKLY
    DAILY
  }

  enum OrganizationOrderByInput {
    id_ASC
    id_DESC
    name_ASC
    name_DESC
    description_ASC
    description_DESC
    createdAt_ASC
    createdAt_DESC
    apiUrl_ASC
    apiUrl_DESC
  }

  enum PaginationDirection {
    BACKWARD
    FORWARD
  }

  enum PostOrderByInput {
    id_ASC
    id_DESC
    text_ASC
    text_DESC
    title_ASC
    title_DESC
    createdAt_ASC
    createdAt_DESC
    imageUrl_ASC
    imageUrl_DESC
    videoUrl_ASC
    videoUrl_DESC
    likeCount_ASC
    likeCount_DESC
    commentCount_ASC
    commentCount_DESC
  }

  enum Status {
    ACTIVE
    BLOCKED
    DELETED
  }

  enum Type {
    UNIVERSAL
    PRIVATE
  }

  enum UserOrderByInput {
    id_ASC
    id_DESC
    firstName_ASC
    firstName_DESC
    lastName_ASC
    lastName_DESC
    email_ASC
    email_DESC
    createdAt_ASC
    createdAt_DESC
  }

  enum UserType {
    USER
    ADMIN
    SUPERADMIN
    NON_USER
  }

  enum VenueOrderByInput {
    capacity_ASC
    capacity_DESC
  }

  enum FundOrderByInput {
    createdAt_ASC
    createdAt_DESC
  }

  enum CampaignOrderByInput {
    startDate_ASC
    startDate_DESC
    endDate_ASC
    endDate_DESC
    fundingGoal_ASC
    fundingGoal_DESC
  }

  enum PledgeOrderByInput {
    amount_ASC
    amount_DESC
    startDate_ASC
    startDate_DESC
    endDate_ASC
    endDate_DESC
  }

  enum WeekDays {
    MONDAY
    TUESDAY
    WEDNESDAY
    THURSDAY
    FRIDAY
    SATURDAY
    SUNDAY
  }

  enum EducationGrade {
    NO_GRADE
    PRE_KG
    KG
    GRADE_1
    GRADE_2
    GRADE_3
    GRADE_4
    GRADE_5
    GRADE_6
    GRADE_7
    GRADE_8
    GRADE_9
    GRADE_10
    GRADE_11
    GRADE_12
    GRADUATE
  }

  enum EmploymentStatus {
    FULL_TIME
    PART_TIME
    UNEMPLOYED
  }

  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  enum EventVolunteerResponse {
    YES
    NO
  }

  enum MaritalStatus {
    SINGLE
    ENGAGED
    MARRIED
    DIVORCED
    WIDOWED
    SEPERATED
  }

  enum AdvertisementType {
    BANNER
    POPUP
    MENU
  }

  enum ItemType {
    Regular
    Note
  }

  enum Currency {
    AED # United Arab Emirates Dirham
    AFN # Afghan Afghani
    ALL # Albanian Lek
    AMD # Armenian Dram
    ANG # Netherlands Antillean Guilder
    AOA # Angolan Kwanza
    ARS # Argentine Peso
    AUD # Australian Dollar
    AWG # Aruban Florin
    AZN # Azerbaijani Manat
    BAM # Bosnia-Herzegovina Convertible Mark
    BBD # Barbadian Dollar
    BDT # Bangladeshi Taka
    BGN # Bulgarian Lev
    BHD # Bahraini Dinar
    BIF # Burundian Franc
    BMD # Bermudian Dollar
    BND # Brunei Dollar
    BOB # Bolivian Boliviano
    BRL # Brazilian Real
    BSD # Bahamian Dollar
    BTN # Bhutanese Ngultrum
    BWP # Botswanan Pula
    BYN # Belarusian Ruble
    BZD # Belize Dollar
    CAD # Canadian Dollar
    CDF # Congolese Franc
    CHF # Swiss Franc
    CLP # Chilean Peso
    CNY # Chinese Yuan
    COP # Colombian Peso
    CRC # Costa Rican Colón
    CUP # Cuban Peso
    CVE # Cape Verdean Escudo
    CZK # Czech Koruna
    DJF # Djiboutian Franc
    DKK # Danish Krone
    DOP # Dominican Peso
    DZD # Algerian Dinar
    EGP # Egyptian Pound
    ERN # Eritrean Nakfa
    ETB # Ethiopian Birr
    EUR # Euro
    FJD # Fijian Dollar
    FKP # Falkland Islands Pound
    FOK # Faroese Krona
    FRO # Fijian Dollar
    GBP # British Pound Sterling
    GEL # Georgian Lari
    GGP # Guernsey Pound
    GHS # Ghanaian Cedi
    GIP # Gibraltar Pound
    GMD # Gambian Dalasi
    GNF # Guinean Franc
    GTQ # Guatemalan Quetzal
    GYD # Guyanaese Dollar
    HKD # Hong Kong Dollar
    HNL # Honduran Lempira
    HRK # Croatian Kuna
    HTG # Haitian Gourde
    HUF # Hungarian Forint
    IDR # Indonesian Rupiah
    ILS # Israeli New Shekel
    IMP # Manx pound
    INR # Indian Rupee
    IQD # Iraqi Dinar
    IRR # Iranian Rial
    ISK # Icelandic Króna
    JEP # Jersey Pound
    JMD # Jamaican Dollar
    JOD # Jordanian Dinar
    JPY # Japanese Yen
    KES # Kenyan Shilling
    KGS # Kyrgystani Som
    KHR # Cambodian Riel
    KID # Kiribati dollar
    KMF # Comorian Franc
    KRW # South Korean Won
    KWD # Kuwaiti Dinar
    KYD # Cayman Islands Dollar
    KZT # Kazakhstani Tenge
    LAK # Laotian Kip
    LBP # Lebanese Pound
    LKR # Sri Lankan Rupee
    LRD # Liberian Dollar
    LSL # Lesotho Loti
    LYD # Libyan Dinar
    MAD # Moroccan Dirham
    MDL # Moldovan Leu
    MGA # Malagasy Ariary
    MKD # Macedonian Denar
    MMK # Myanma Kyat
    MNT # Mongolian Tugrik
    MOP # Macanese Pataca
    MRU # Mauritanian Ouguiya
    MUR # Mauritian Rupee
    MVR # Maldivian Rufiyaa
    MWK # Malawian Kwacha
    MXN # Mexican Peso
    MYR # Malaysian Ringgit
    MZN # Mozambican Metical
    NAD # Namibian Dollar
    NGN # Nigerian Naira
    NIO # Nicaraguan Córdoba
    NOK # Norwegian Krone
    NPR # Nepalese Rupee
    NZD # New Zealand Dollar
    OMR # Omani Rial
    PAB # Panamanian Balboa
    PEN # Peruvian Nuevo Sol
    PGK # Papua New Guinean Kina
    PHP # Philippine Peso
    PKR # Pakistani Rupee
    PLN # Polish Zloty
    PYG # Paraguayan Guarani
    QAR # Qatari Rial
    RON # Romanian Leu
    RSD # Serbian Dinar
    RUB # Russian Ruble
    RWF # Rwandan Franc
    SAR # Saudi Riyal
    SBD # Solomon Islands Dollar
    SCR # Seychellois Rupee
    SDG # Sudanese Pound
    SEK # Swedish Krona
    SGD # Singapore Dollar
    SHP # Saint Helena Pound
    SLL # Sierra Leonean Leone
    SOS # Somali Shilling
    SPL # Seborgan Luigino
    SRD # Surinamese Dollar
    STN # São Tomé and Príncipe Dobra
    SVC # Salvadoran Colón
    SYP # Syrian Pound
    SZL # Swazi Lilangeni
    THB # Thai Baht
    TJS # Tajikistani Somoni
    TMT # Turkmenistani Manat
    TND # Tunisian Dinar
    TOP # Tongan Pa'anga
    TRY # Turkish Lira
    TTD # Trinidad and Tobago Dollar
    TVD # Tuvaluan Dollar
    TWD # New Taiwan Dollar
    TZS # Tanzanian Shilling
    UAH # Ukrainian Hryvnia
    UGX # Ugandan Shilling
    USD # United States Dollar
    UYU # Uruguayan Peso
    UZS # Uzbekistan Som
    VEF # Venezuelan Bolívar
    VND # Vietnamese Dong
    VUV # Vanuatu Vatu
    WST # Samoan Tala
    XAF # CFA Franc BEAC
    XCD # East Caribbean Dollar
    XDR # Special Drawing Rights
    XOF # CFA Franc BCEAO
    XPF # CFP Franc
    YER # Yemeni Rial
    ZAR # South African Rand
    ZMW # Zambian Kwacha
    ZWD # Zimbabwean Dollar
  }

  """
  Possible variants of ordering in which sorting on a field should be
  applied for a connection or other list type data structures.
  """
  enum SortedByOrder {
    """
    When the sorting order should be from the smallest value to largest
    value.
    """
    ASCENDING
    """
    When the sorting order should be from the largest value to the smallest
    value.
    """
    DESCENDING
  }
`;
