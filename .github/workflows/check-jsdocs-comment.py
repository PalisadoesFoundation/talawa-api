#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

"""Script to check whether JSDocs command is required to run or not.

Methodology:

    Analyses the `.js`files to find
    whether comments compliant to JSDocs
    are present or not.
    This script was created to help improve documentation of codebase
    and only updating docs if required.
NOTE:
    This script complies with our python3 coding and documentation standards
    and should be used as a reference guide. It complies with:
        1) Pylint
        2) Pydocstyle
        3) Pycodestyle
        4) Flake8
    Run these commands from the CLI to ensure the code is compliant for all
    your pull requests.
"""

# standard imports
import os
import re


def get_regex_pattern():
    """Return the regex pattern against which files are analysed.

    Args:
        None

    Returns:
        pattern: An regex Pattern object

    """
    # The regex checks if the content of files contain a comment of
    # form => /** {charachters | newline} */ ,
    # file may also contain any number of 
    # newlines or charachters before or after the comment.
    # To analyse the regex visit https://regex101.com/ and paste the regex
    regex = '^(.|\n)*(\\/\\*\\*(.|\n)*\\*\\/)+(.|\n)*$'
    pattern = re.compile(regex)
    return pattern


def get_directories():
    """Return a list of directories to analyse against the regex.

    Args:
        None

    Returns:
        directories: A list of directory

    """
    # get current working dir
    directory = os.getcwd()
    # list of dir to look in repo for files
    directories = [
        directory,
        os.path.expanduser(os.path.join(directory, 'src')),
        os.path.expanduser(os.path.join(directory, 'tests'))
    ]
    return directories


def get_js_files(directories):
    """Create a list of full .js file paths to include in the analysis.

    Args:
        directories: Directories object

    Returns:
        result: A list of full file paths

    """
    # Initialize key variables
    result = []
    # iterate through files in directories
    for d in directories:
        for root, _, files in os.walk(d, topdown=False):
            for name in files:
                # append files with .js extension
                if name.endswith('.js'):
                    result.append(os.path.join(root, name))

    return result


def analyse_files_against_regex_pattern(files, pattern):
    """Run files against regex pattern.

    Args:
        files : list of file paths which are to be analysed
        pattern : regex Pattern Object

    Returns:
        comments_for_jsdoc_exists : boolean to specify running of docs

    """
    # boolean to check if docs are to be generated
    comments_for_jsdoc_exists = False
    # reading file content and comparing with pattern
    for filepath in files:
        if comments_for_jsdoc_exists:
            break
        with open(filepath, encoding='utf-8') as code:
            file_content = code.read()
            matches = pattern.search(file_content)
            if matches:
                comments_for_jsdoc_exists = True
                break

    return comments_for_jsdoc_exists


def set_github_env_variable(comments_for_jsdoc_exists):
    """Set github env variable.

    Args:
        comments_for_jsdoc_exists : Boolean

    Returns:
        None

    """
    # this is to setup workflow env variable
    env_file = os.getenv('GITHUB_ENV')
    try:
        with open(env_file, 'a') as myfile:
            if comments_for_jsdoc_exists:
                myfile.write('RUN_JSDOCS=True')
            else:
                myfile.write('RUN_JSDOCS=False')
    except TypeError:
        print('no env file found')


def main():
    """Analyze .js files against regex pattern.

    This function calls the helper functions.

    Args:
        None

    Returns:
        None

    """
    pattern = get_regex_pattern()
    directories = get_directories()
    files = get_js_files(directories)
    comments_for_jsdoc_exists = analyse_files_against_regex_pattern(
        files, pattern)
    set_github_env_variable(comments_for_jsdoc_exists)


if __name__ == '__main__':
    main()
