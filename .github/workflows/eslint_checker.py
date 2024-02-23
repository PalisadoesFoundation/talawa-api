import os
import re
import argparse

def check_eslint_disable_comments(directory):
    """Check for ESLint disable comments in JavaScript and TypeScript files.

    Args:
        directory: Directory to search for JavaScript and TypeScript files

    Returns:
        None

    """
    excluded_files = ['tests/resolvers/Mutation/refreshToken.spec.ts', 'src/index.ts', 'src/resolvers/middleware/currentUserExists.ts']   
    # Get regex pattern to identify ESLint disable comments
    regex_pattern = re.compile(r'\/\/\s*eslint-disable')

    # List of directories to search within
    search_directories = ['src', 'tests']

    # Traverse through the specified directories
    for dir_name in search_directories:
        dir_path = os.path.join(directory, dir_name)
        for root, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith(('.js', '.ts')) and file not in excluded_files:
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r') as f:
                        lines = f.readlines()
                        for line_num, line in enumerate(lines, start=1):
                            if regex_pattern.search(line):
                                print(f"ESLint disable comment found in {filepath} at line {line_num}: {line.strip()}")

def main():
    """Main function to run the script.

    This function parses command-line arguments and initiates the check.

    Args:
        None

    Returns:
        None

    """
    parser = argparse.ArgumentParser(description='Check for ESLint disable comments in JavaScript and TypeScript files')
    parser.add_argument('directory', help='Root directory of the project')
    args = parser.parse_args()

    directory = args.directory

    check_eslint_disable_comments(directory)

if __name__ == '__main__':
    main()
