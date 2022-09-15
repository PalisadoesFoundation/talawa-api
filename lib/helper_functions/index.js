const addTenantId = require('./addTenantId');
const auth = require('./auth');
const deleteDuplicatedImage = require('./deleteDuplicatedImage');
const deleteImage = require('./deleteImage');
const getTenantFromId = require('./getTenantFromId');
const imageAlreadyInDbCheck = require('./imageAlreadyInDbCheck');
const imageExtensionCheck = require('./imageExtensionCheck');
const mailer = require('./mailer');
const newDbUrl = require('./newDbUrl');
const organizationExists = require('./organizationExists');
const ReuploadDuplicateCheck = require('./ReuploadDuplicateCheck');
const tenantCtx = require('./tenantCtx');
const uploadImage = require('./uploadImage');
const userExists = require('./userExists');
const orgHasTenant = require('./orgHasTenant');

module.exports = {
  addTenantId,
  auth,
  deleteDuplicatedImage,
  deleteImage,
  getTenantFromId,
  imageAlreadyInDbCheck,
  imageExtensionCheck,
  mailer,
  newDbUrl,
  organizationExists,
  ReuploadDuplicateCheck,
  tenantCtx,
  uploadImage,
  userExists,
  orgHasTenant,
};
