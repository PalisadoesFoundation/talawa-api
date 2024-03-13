import { loadDefaultOrganization } from "./loadDefaultOrganization";

loadDefaultOrganization(process.env.MONGO_DB_URL);
