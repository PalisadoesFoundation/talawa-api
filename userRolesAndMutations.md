# Mutations According to Roles

## Type Of Users in Talawa 

There are mainly 3 types of User types in talawa -

1. `SUPERADMIN`

2. `ADMIN`

3. `USER`

## Mutations Permitted by Roles.

### `SUPERADMIN` -

These are the Mutations exclusive to the `SUPERADMIN` type. Please note that a few of these mutations also have a few extra criteria with who can access them .For eg. except `createOrganization` mutation all other require that SUPERADMIN should also be the creator of the orgnanization.

1. `blockPluginCreationBySuperadmin`
2. `createAdmin`
3. `createOrganization` - When a superadmin creates and organization , he/she will aso be one of the `admins` and `creator` of that Organization. Therefore the Mutations in the next Sections also applies to Super Admin.  
4. `rejectAdmin`
5. `removeAdmin`
6. `removeOrganization`
7. `updateUserType`

### `ADMIN` -

An Admin of an organization is permitted to make the following Mutations in that Organization-

1. `acceptMembershipRequests`
2. `addOrganizationImage`
3. `addUserToGroupChat`
4. `adminRemoveEvent`
5. `adminRemoveGroup`
6. `adminRemovePost`
7. `blockUser`
8. `rejectMemberShipRequests`
9. `removeDirectChat`
10. `removeMember`
11. `removeOrganizationImage`
12. `removeUserFromGroupChat`
13. `unblockUser`
14. `updateOrganization`

### USER -

All other Mutations except those exclusive to Admin and Super Admin can be accessed by the User type.