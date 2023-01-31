import {
  apiKey,
  appId,
  iOSapiKey,
  iOSappId,
  iosBundleId,
  iosClientId,
  iOSmessagingSenderId,
  iOSprojectId,
  iOSstorageBucket,
  messagingSenderId,
  projectId,
  storageBucket,
} from "../constants";

export const androidFirebaseOptions = {
  apiKey: apiKey,
  appId: appId,
  messagingSenderId: messagingSenderId,
  projectId: projectId,
  storageBucket: storageBucket,
};

export const iosFirebaseOptions = {
  apiKey: iOSapiKey,
  appId: iOSappId,
  messagingSenderId: iOSmessagingSenderId,
  projectId: iOSprojectId,
  storageBucket: iOSstorageBucket,
  iosClientId: iosClientId,
  iosBundleId: iosBundleId,
};
