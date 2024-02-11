export const isReplicaSetConnection = (url: string): boolean => {
  const replicaSetParam = getQueryParam(url, "replicaSet");

  if (replicaSetParam !== null) {
    return true;
  } else {
    const hostnames = extractHostnames(url);
    return hostnames.length > 1;
  }
};

const getQueryParam = (url: string, param: string): string | null => {
  const match = url.match(new RegExp(`${param}=([^&]+)`));
  return match ? match[1] : null;
};

export const extractHostnames = (url: string): string[] => {
  const matches = url.match(/\/\/([^/]+)/);
  if (matches) {
    return matches[1].split(",");
  }
  return [];
};

export const isAtlasUrl = (url: string): boolean => {
  const urlWithoutProtocol = url.slice(url.indexOf("://") + 3);
  const rest = urlWithoutProtocol.split("@")[1];
  const [hostname] = rest.split("/");

  return hostname.endsWith(".mongodb.net");
};
