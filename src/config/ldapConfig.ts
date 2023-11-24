import {
  ldapUrl,
  bindDN,
  bindCredentials,
  userBaseDN,
  domain_comp,
} from "../constants";

export const ldapConfig = {
  url: ldapUrl,
  bindDN: bindDN,
  bindCredentials: bindCredentials,
  userBaseDN: userBaseDN,
  domain_comp: domain_comp,
};
