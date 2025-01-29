[**talawa-api**](../../../README.md)

***

# Function: setPathEnvVar()

> **setPathEnvVar**(`installDir`): `void`

Sets the PATH environment variable to include the directory where MinIO is installed.

This function modifies the PATH environment variable to include the specified installation directory.
It handles different platforms:
- On Windows, it uses `setx` to update the system PATH variable.
- On Unix-based systems (macOS and Linux), it appends the directory to the PATH in the current shell session
  and writes the update to the shell configuration file (`~/.bashrc` for Linux, `~/.zshrc` for macOS).

**Assumption:**
This function assumes that the shell configuration file (`.bashrc` or `.zshrc`) already exists. In most typical
development environments, these files are present. If the file does not exist, users may need to create it manually
to ensure the PATH update is applied in future shell sessions.

## Parameters

### installDir

`string`

The directory where MinIO is installed.

## Returns

`void`

## Throws

Error If updating the PATH environment variable fails.

## Defined in

[src/setup/setPathEnvVar.ts:24](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/setup/setPathEnvVar.ts#L24)
