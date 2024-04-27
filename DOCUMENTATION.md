# Documentation

Welcome to our documentation guide. Here are some useful tips you need to know!

## Table of Contents

<!-- toc -->

- [Where to find our documentation](#where-to-find-our-documentation)
- [How to use Docusaurus](#how-to-use-docusaurus)
- [Other information](#other-information)

<!-- tocstop -->

## Where to find our documentation

Our documentation can be found in ONLY TWO PLACES:

1. **_Inline within the repository's code files_**: We have automated processes to extract this information and place it in our Talawa documentation site [docs.talawa.io](https://docs.talawa.io/).
1. **_In our `talawa-docs` repository_**: Our [Talawa-Docs](https://github.com/PalisadoesFoundation/talawa-docs) repository contains user edited markdown files that are automatically integrated into our Talawa documentation site [docs.talawa.io](https://docs.talawa.io/) using the [Docusaurus](https://docusaurus.io/) package.

## How to use Docusaurus

The process in easy:

1. Install `talawa-docs` on your system
1. Launch docusaurus on your system according to the `talawa-docs`documentation.
   - A local version of `docs.talawa.io` should automatically launched in your browser at http://localhost:3000/
1. Add/modify the markdown documents to the `docs/` directory of the `talawa-docs` repository
1. If adding a file, then you will also need to edit the `sidebars.js` which is used to generate the [docs.talawa.io](https://docs.talawa.io/) menus.
1. Always monitor the local website in your brower to make sure the changes are acceptable.
   - You'll be able to see errors that you can use for troubleshooting in the CLI window you used to launch the local website.

## Other information

**_PLEASE_** do not add markdown files in this repository. Add them to `talawa-docs`!
