#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""
Script to make Markdown files MDX compatible.

This script scans Markdown files and escapes special characters (<, >, {, })
to make them compatible with the MDX standard used in Docusaurus v3.

This script complies with:
    1) Pylint
    2) Pydocstyle
    3) Pycodestyle
    4) Flake8
"""
import os
import argparse
import re

def escape_mdx_characters(text):
    """
    Escape special characters in a text string for MDX compatibility.
    Avoids escaping already escaped characters.

    Args:
        text: A string containing the text to be processed.

    Returns:
        A string with special characters (<, >, {, }) escaped, avoiding
        double escaping.
    """
    # Regular expressions to find unescaped special characters
    patterns = {
        "<": r"(?<!\\)<",
        ">": r"(?<!\\)>",
        "{": r"(?<!\\){",
        "}": r"(?<!\\)}"
    }

    # Replace unescaped special characters
    for char, pattern in patterns.items():
        text = re.sub(pattern, f"\\{char}", text)

    return text

def process_file(filepath):
    """
    Process a single Markdown file for MDX compatibility.

    Args:
        filepath: The path to the Markdown file to process.

    Returns:
        None, writes the processed content back to the file only if there are changes.
    """
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()

    # Escape MDX characters
    new_content = escape_mdx_characters(content)

    # Write the processed content back to the file only if there is a change
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(new_content)

def main():
    """
    Main function to process all Markdown files in a given directory.

    Scans for all Markdown files in the specified directory and processes each
    one for MDX compatibility.

    Args:
        None

    Returns:
        None
    """
    parser = argparse.ArgumentParser(description="Make Markdown files MDX compatible.")
    parser.add_argument(
        "--directory",
        type=str,
        required=True,
        help="Directory containing Markdown files to process."
    )

    args = parser.parse_args()

    # Process each Markdown file in the directory
    for root, _, files in os.walk(args.directory):
        for file in files:
            if file.lower().endswith(".md"):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
