import { loadDefaultOrganization } from "./loadDefaultOrganization";
import dotenv from "dotenv";

dotenv.config();

loadDefaultOrganization(process.env.MONGO_DB_URL);
