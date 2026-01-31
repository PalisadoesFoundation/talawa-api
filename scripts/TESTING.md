# Installation Scripts Testing Guide

## Overview
Comprehensive testing documentation for installation scripts.

## Running Tests Locally
- All installation tests: `pnpm test:install`
- Watch mode: `pnpm test:install:watch`
- With coverage: `pnpm test:install:coverage`

## Test Structure
- `test/installation_scripts/setup/` - Setup script tests
- `test/installation_scripts/dbManagement/` - Database management tests
- `test/installation_scripts/root/` - Root setup.ts tests

## Coverage Requirements
- Minimum 95% coverage for all installation scripts
- All new functions must have corresponding tests

## Contributing
When adding new installation features:
1. Create tests in the appropriate `test/installation_scripts/` subfolder
2. Ensure ≥95% coverage for your changes
3. Run `pnpm test:install:coverage` before submitting PR
