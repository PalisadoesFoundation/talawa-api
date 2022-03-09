#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
import os
from collections import namedtuple
import re

def main():
    # get current working dir
    directory = os.getcwd()
    # this is to setup workflow env variable
    env_file = os.getenv('GITHUB_ENV')
    # The regex checks if the content of files contain a comment of form => /** {charachters | newline} */ ,
    # file may also contain any number of newlines or charachters before or after the comment. 
    # To analyse the regex visit https://regex101.com/ and paste the regex
    pattern = re.compile('^(.|\n)*(\/\*\*(.|\n)*\*\/)+(.|\n)*$');
    # list of dir to look in repo for files
    directories = [
        directory,
        os.path.expanduser(os.path.join(directory, 'lib')),
        os.path.expanduser(os.path.join(directory, 'src')),
        os.path.expanduser(os.path.join(directory, 'test'))
    ]
    # list of files 
    result = []
    for d in directories:
        for root, _, files in os.walk(d, topdown=False):
            for name in files:
                # only append files with .js extension
                if(name.endswith('.js')):
                    result.append(os.path.join(root, name))
    
    # boolean to check if docs are to be generated
    comments_for_jsdoc_exists = False
    # reading file content and comparing with pattern
    for filepath in result:
        if comments_for_jsdoc_exists:
            break
        with open(filepath, encoding='utf-8') as code:
            file_content = code.read();
            matches = pattern.search(file_content)
            if matches:
                comments_for_jsdoc_exists = True
                break
    # setting github env variable to decide to run jsdoc pipeline
    try:
        with open(env_file, 'a') as myfile:
            if comments_for_jsdoc_exists == True:
                myfile.write('RUN_JSDOCS=True')
            else:
                myfile.write('RUN_JSDOCS=False')
    except TypeError:
        print('no env file found')

if __name__ == '__main__':
    main()