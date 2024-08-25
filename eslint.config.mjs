import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsdoc from "eslint-plugin-tsdoc";
import _import from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { parseForESLint } from "@graphql-eslint/eslint-plugin"; // Importing `parseForESLint` if needed in a custom rule

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/.github",
        "**/.vscode",
        "**/build",
        "**/coverage",
        "**/node_modules",
        "src/types",
        "docs/Schema.md",
    ],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        tsdoc,
        import: fixupPluginRules(_import),
        // No need to include `@graphql-eslint` here
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser, // Use `tsParser` to parse TypeScript
    },

    rules: {
        "no-restricted-imports": ["error", {
            patterns: ["**/src/**"],
        }],

        "import/no-duplicates": "error",
        "tsdoc/syntax": "error",
        "@typescript-eslint/ban-ts-comment": "error",
        "@typescript-eslint/ban-types": "error",
        "@typescript-eslint/no-duplicate-enum-values": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-var-requires": "error",
    },
}, {
    files: ["**/*.ts"],

    languageOptions: {
        parser: tsParser, // Use `tsParser` to parse TypeScript
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
            tsconfigRootDir: ".",
        },
    },

    rules: {
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/explicit-function-return-type": "error",

        "@typescript-eslint/naming-convention": ["error", {
            selector: "interface",
            format: ["PascalCase"],
            prefix: ["Interface", "TestInterface"],
        }, {
            selector: ["typeAlias", "typeLike", "enum"],
            format: ["PascalCase"],
        }, {
            selector: "typeParameter",
            format: ["PascalCase"],
            prefix: ["T"],
        }, {
            selector: "variable",
            format: ["camelCase", "UPPER_CASE"],
            leadingUnderscore: "allow",
        }, {
            selector: "parameter",
            format: ["camelCase"],
            leadingUnderscore: "allow",
        }, {
            selector: "function",
            format: ["camelCase"],
        }, {
            selector: "memberLike",
            modifiers: ["private"],
            format: ["camelCase"],
            leadingUnderscore: "require",
        }, {
            selector: "variable",
            modifiers: ["exported"],
            format: null,
        }],
    },
}, {
    files: ["./src/typeDefs/**/*.ts"],
    processor: "@graphql-eslint/graphql", // Use processor for TypeScript GraphQL files
}, {
    files: ["./src/typeDefs/**/*.graphql"],

    processor: "@graphql-eslint/graphql", // Use processor for GraphQL files
}, {
    files: ["tests/**/*"],

    rules: {
        "no-restricted-imports": "off",
    },
}, {
    files: ["./src/index.ts", "./src/utilities/copyToClipboard.ts"],

    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-empty-function": "off",
    },
}];
