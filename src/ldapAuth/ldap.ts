import { Client } from "ldapts";
import { ldapConfig } from "../config/ldapConfig";
const client = new Client({
  url: ldapConfig.url,
  timeout: 5000,
  connectTimeout: 10000,
  strictDN: true,
});
client.bind(ldapConfig.bindDN, ldapConfig.bindCredentials).then((err: any) => {
  if (err) console.log(err);
  else console.log("Connected to LDAP server successfully!");
});
export default client;
