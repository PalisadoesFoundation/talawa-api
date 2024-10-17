// THE ENUMS STORED HERE ARE ONLY ENFORCED AT THE API LEVEL. THESE ARE NOT DATABASE ENUMS.

import { z } from "zod";

/**
 * List of possible types for attachments of a talawa advertisement.
 */
export const advertisementAttachmentTypeEnum = z.enum(["image", "video"]);

/**
 * List of possible types for a talawa advertisement.
 */
export const advertisementTypeEnum = z.enum(["banner", "menu", "pop_up"]);

/**
 * List of possible types for a talawa agenda item.
 */
export const agendaItemTypeEnum = z.enum([
	"general",
	"note",
	"scripture",
	"song",
]);

/**
 * List of possible vote types on a talawa post comment.
 */
export const commmentVoteTypeEnum = z.enum(["down_vote", "up_vote"]);

/**
 * List of possible types for attachments of a talawa event.
 */
export const eventAttachmentTypeEnum = z.enum(["image", "video"]);

/**
 * List of possible grades for a talawa user's elementary education(if applicable).
 */
export const eventAttendeeRegistrationInviteStatusEnum = z.enum([
	"accepted",
	"declined",
	"no_response",
]);

/**
 * List of possible family roles for a talawa user(if applicable).
 */
export const familyMembershipRoleEnum = z.enum([
	"adult",
	"child",
	"head_of_household",
	"spouse",
]);

/**
 * List of possible types for attachments of a talawa post.
 */
export const postAttachmentTypeEnum = z.enum(["image", "video"]);

/**
 * List of possible vote types on a talawa post.
 */
export const postVoteTypeEnum = z.enum(["down_vote", "up_vote"]);

/**
 * List of possible recurrence types on a talawa post.
 */
export const recurrenceTypeEnum = z.enum([
	"daily",
	"monthly",
	"weekly",
	"yearly",
]);

/**
 * List of possible grades for a talawa user's education(if applicable).
 */
export const userEducationGradeEnum = z.enum([
	"grade_1",
	"grade_2",
	"grade_3",
	"grade_4",
	"grade_5",
	"grade_6",
	"grade_7",
	"grade_8",
	"grade_9",
	"grade_10",
	"grade_11",
	"grade_12",
	"graduate",
	"kg",
	"no_grade",
	"pre_kg",
]);

/**
 * List of possible statuses for a talawa user's employment status(if applicable).
 */
export const userEmploymentStatusEnum = z.enum([
	"full_time",
	"part_time",
	"unemployed",
]);

/**
 * List of possible statuses for a talawa user's marital status(if applicable).
 */
export const userMaritalStatusEnum = z.enum([
	"divorced",
	"engaged",
	"married",
	"seperated",
	"single",
	"widowed",
]);

/**
 * List of possible sexes assigned to a talawa user at birth.
 */
export const userNatalSexEnum = z.enum(["female", "intersex", "male"]);

/**
 * List of possible types for attachments of a talawa event venue.
 */
export const venueAttachmentTypeEnum = z.enum(["image", "video"]);

/**
 * List of possible statuses for a user's assignment to a talawa event's volunteer group.
 */
export const volunteerGroupAssignmentInviteStatusEnum = z.enum([
	"accepted",
	"declined",
	"no_response",
]);

/**
 * List of two-letter country codes defined in ISO 3166-1, part of the ISO 3166 standard published by the International Organization for Standardization (ISO), to represent countries, dependent territories, and special areas of geographical interest.
 *
 * More information at this link: {@link https://www.iso.org/obp/ui/#search}
 */
export const iso3166Alpha2CountryCodeEnum = z.enum([
	"ad",
	"ae",
	"af",
	"ag",
	"ai",
	"al",
	"am",
	"ao",
	"aq",
	"ar",
	"as",
	"at",
	"au",
	"aw",
	"ax",
	"az",
	"ba",
	"bb",
	"bd",
	"be",
	"bf",
	"bg",
	"bh",
	"bi",
	"bj",
	"bl",
	"bm",
	"bn",
	"bo",
	"bq",
	"br",
	"bs",
	"bt",
	"bv",
	"bw",
	"by",
	"bz",
	"ca",
	"cc",
	"cd",
	"cf",
	"cg",
	"ch",
	"ci",
	"ck",
	"cl",
	"cm",
	"cn",
	"co",
	"cr",
	"cu",
	"cv",
	"cw",
	"cx",
	"cy",
	"cz",
	"de",
	"dj",
	"dk",
	"dm",
	"do",
	"dz",
	"ec",
	"ee",
	"eg",
	"eh",
	"er",
	"es",
	"et",
	"fi",
	"fj",
	"fk",
	"fm",
	"fo",
	"fr",
	"ga",
	"gb",
	"gd",
	"ge",
	"gf",
	"gg",
	"gh",
	"gi",
	"gl",
	"gm",
	"gn",
	"gp",
	"gq",
	"gr",
	"gs",
	"gt",
	"gu",
	"gw",
	"gy",
	"hk",
	"hm",
	"hn",
	"hr",
	"ht",
	"hu",
	"id",
	"ie",
	"il",
	"im",
	"in",
	"io",
	"iq",
	"ir",
	"is",
	"it",
	"je",
	"jm",
	"jo",
	"jp",
	"ke",
	"kg",
	"kh",
	"ki",
	"km",
	"kn",
	"kp",
	"kr",
	"kw",
	"ky",
	"kz",
	"la",
	"lb",
	"lc",
	"li",
	"lk",
	"lr",
	"ls",
	"lt",
	"lu",
	"lv",
	"ly",
	"ma",
	"mc",
	"md",
	"me",
	"mf",
	"mg",
	"mh",
	"mk",
	"ml",
	"mm",
	"mn",
	"mo",
	"mp",
	"mq",
	"mr",
	"ms",
	"mt",
	"mu",
	"mv",
	"mw",
	"mx",
	"my",
	"mz",
	"na",
	"nc",
	"ne",
	"nf",
	"ng",
	"ni",
	"nl",
	"no",
	"np",
	"nr",
	"nu",
	"nz",
	"om",
	"pa",
	"pe",
	"pf",
	"pg",
	"ph",
	"pk",
	"pl",
	"pm",
	"pn",
	"pr",
	"ps",
	"pt",
	"pw",
	"py",
	"qa",
	"re",
	"ro",
	"rs",
	"ru",
	"rw",
	"sa",
	"sb",
	"sc",
	"sd",
	"se",
	"sg",
	"sh",
	"si",
	"sj",
	"sk",
	"sl",
	"sm",
	"sn",
	"so",
	"sr",
	"ss",
	"st",
	"sv",
	"sx",
	"sy",
	"sz",
	"tc",
	"td",
	"tf",
	"tg",
	"th",
	"tj",
	"tk",
	"tl",
	"tm",
	"tn",
	"to",
	"tr",
	"tt",
	"tv",
	"tw",
	"tz",
	"ua",
	"ug",
	"um",
	"us",
	"uy",
	"uz",
	"va",
	"vc",
	"ve",
	"vg",
	"vi",
	"vn",
	"vu",
	"wf",
	"ws",
	"ye",
	"yt",
	"za",
	"zm",
	"zw",
]);
