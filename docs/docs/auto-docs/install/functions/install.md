[API Docs](/)

***

# Function: install()

> **install**(`config?`): `Promise`\<[`InstallResult`](../../src/install/types/interfaces/InstallResult.md)\>

Defined in: [src/install/index.ts:145](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/install/index.ts#L145)

Main installation function.

This function checks prerequisites and provides setup guidance.
Actual package installation is handled by the shell scripts
(install.sh, install-linux.sh, install-macos.sh, install.ps1).

## Parameters

### config?

`Partial`\<[`InstallConfig`](../../src/install/types/interfaces/InstallConfig.md)\>

Partial configuration options

## Returns

`Promise`\<[`InstallResult`](../../src/install/types/interfaces/InstallResult.md)\>

Installation result with success status and duration.
         Note: packagesInstalled will be empty as this module
         only validates prerequisites, not installs packages.
