module.exports.androidFirebaseOptions = {
  apiKey: process.env.apiKey,
  appId: process.env.appId,
  messagingSenderId: process.env.messagingSenderId,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
};

module.exports.iosFirebaseOptions = {
  apiKey: process.env.iOSapiKey,
  appId: process.env.iOSappId,
  messagingSenderId: process.env.iOSmessagingSenderId,
  projectId: process.env.iOSprojectId,
  storageBucket: process.env.iOSstorageBucket,
  iosClientId: process.env.iosClientId,
  iosBundleId: process.env.iosBundleId,
};
