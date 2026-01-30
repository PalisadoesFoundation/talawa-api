import { Type } from "typebox";

export const socialConfigSchema = Type.Object({
	/**
	 * URL to the facebook account of the community.
	 */
	API_COMMUNITY_FACEBOOK_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the github account of the community.
	 */
	API_COMMUNITY_GITHUB_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the instagram account of the community.
	 */
	API_COMMUNITY_INSTAGRAM_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the linkedin account of the community.
	 */
	API_COMMUNITY_LINKEDIN_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the reddit account of the community.
	 */
	API_COMMUNITY_REDDIT_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the slack account of the community.
	 */
	API_COMMUNITY_SLACK_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the website of the community.
	 */
	API_COMMUNITY_WEBSITE_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the x account of the community.
	 */
	API_COMMUNITY_X_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the youtube account of the community.
	 */
	API_COMMUNITY_YOUTUBE_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
});
