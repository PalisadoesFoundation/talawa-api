# Common Installation Validation Functions

This directory contains shared validation functions used across different platform installation scripts (Linux, macOS, etc.).

## Files

- **validation.sh** - Security-critical validation functions for preventing command injection
- **validation.test.sh** - Automated test suite for validation functions

## Running Tests

The validation functions include automated tests to ensure security against command injection attacks.

### Run all tests

```bash
cd scripts/install/common
./validation.test.sh
```

### Expected output

```
Test Summary
========================================================================
Total tests run:    44
Tests passed:       44
Tests failed:       0

✓ All tests passed!
```

## Test Coverage

The test suite validates:

### Valid Version Strings (Should PASS)
- Exact versions: `18.0.0`, `23.7.0`
- Caret ranges: `^18.0.0`
- Tilde ranges: `~18.0.0`
- Comparison operators: `>=18.0.0`, `>18.0.0`, `<=18.0.0`, `<18.0.0`
- LTS keywords: `lts`, `latest`, `lts/latest`, `lts/gallium`
- Prerelease versions: `1.0.0-alpha`, `1.0.0-beta.1`

### Invalid Version Strings (Should REJECT)

#### Command Injection Attempts
- Semicolon injection: `18.0.0; rm -rf /`
- Logic operators: `18.0.0 && malicious`, `18.0.0 || malicious`
- Command substitution: `18.0.0$(whoami)`, `` 18.0.0`whoami` ``
- Pipe injection: `18.0.0 | cat /etc/passwd`
- Redirect injection: `18.0.0 > /tmp/exploit`
- Background processes: `18.0.0 & background`

#### Invalid Characters
- Spaces: ` 18.0.0`, `18.0.0 `
- Special characters: `*`, `?`, `[`, `]`, `{`, `}`, `!`, `@`, `%`, `#`
- Shell metacharacters: `$`, `` ` ``, `|`, `>`, `<`, `&`

#### Option Injection
- Dash prefix: `-18.0.0`, `--version`

#### Empty/Invalid Values
- Empty strings: `""`
- Null values: `null`
- Non-version strings: `not-a-version`, `abc`

## Security

These validation functions are **security-critical** and protect against:
1. **Command Injection** - Preventing arbitrary command execution
2. **Option Injection** - Preventing malicious flags to package managers  
3. **Path Traversal** - Restricting to valid version patterns

Any changes to validation logic should be carefully reviewed and tested.

## Contributing

When modifying validation functions:

1. Update tests in `validation.test.sh` for new patterns
2. Run the full test suite to ensure no regressions
3. Document any new validation rules in function comments
4. Consider security implications of any relaxed restrictions

## Integration

Installation scripts should source this file:

```bash
# At the beginning of your script, define required functions
info() { echo -e "${BLUE}ℹ${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Then source the validation library
source "$(dirname "$0")/../common/validation.sh"

# Now you can use validation functions
NODE_VERSION=$(jq -r '.engines.node' package.json)
if ! validate_version_string "$NODE_VERSION" "Node.js version"; then
    error "Invalid version in package.json"
    exit 1
fi
```
