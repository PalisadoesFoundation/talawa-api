/**
 * This file is used by docker compose for performing healthchecks on talawa api at runtime. The current logic for the healthcheck to succeed is for talawa api to expose an endpoint at `/health` route that responds to `GET` requests and returns a 200 HTTP response status code if talawa api is healthy.
 */

import { request } from "node:http";

request(
	{
		host: process.env.API_HOST ?? "0.0.0.0",
		path: "/healthcheck",
		method: "GET",
		port: process.env.API_PORT ?? 4000,
	},
	(response) => {
		if (response.statusCode === 200) {
			console.log(
				"Healthcheck passed. The healthcheck endpoint returned the 200 HTTP response status code.",
			);
			process.exit(0);
		} else {
			console.log(
				"Healthcheck failed. The healthcheck endpoint returned a non 200 HTTP response status code.",
			);
			process.exit(1);
		}
	},
)
	.on("error", (error) => {
		console.log("Unexpected error encountered: ", error);
		process.exit(1);
	})
	.end();
