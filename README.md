# srv4dev

![npm (scoped)](https://img.shields.io/npm/v/@mischback/srv4dev?style=flat)

![GitHub package.json version (development)](https://img.shields.io/github/package-json/v/mischback/srv4dev/development?style=flat)
![GitHub branch checks state](https://img.shields.io/github/actions/workflow/status/mischback/srv4dev/ci-default.yml?branch=development&style=flat&logo=github)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat&logo=prettier)](https://github.com/prettier/prettier)
![GitHub License](https://img.shields.io/github/license/mischback/srv4dev?style=flat)

A minimal http server for local development that integrates nodemon.

**srv4dev** started initially from the requirement to have the tiniest possible
http development server, just like Python's `python -m http.server 8000`.

While working some more on my personal, SSG-based, website, I felt the need to
incorporate automatic rebuilding in the background aswell, so `nodemon` was
integrated.

**Please note** that this package is by no means more than a tiny development
server. **DO NOT USE** this in any _production environment_.

## Installation

```bash
npm install --save-dev @mischback/srv4dev
```

## Usage

```bash
npx srv4dev
```

## Configuration

**srv4dev** reads most of its configuration from command line parameters:

- `--address`, `-a`: The interface to bind the http server to (default: localhost)
- `--debug`, `-d`: Activate debug mode
- `--nodemonConfig`, `-c`: Path/filename of nodemon configuration file
- `--port`, `-p`: The port to bind the http server to (default: 8000)
- `--quiet`, `-q`: Suppress all output
- `--webRoot`, `-w`: The directory to use as http server root

Additionally, `nodemon` is configured by its configuration file (by default
`nodemon.json`). Please refer to
[nodemon's documentation](https://github.com/remy/nodemon#config-files).

## Contributing

This is a simple utility, mainly targeted at my very own development needs.

Feel free to use, feel free to submit bugs, but please understand that this
package will not receive much of my attention.

If you're really missing a feature: Feel free to fork and submit a pull
request. Most likely I will merge it.

# License

[MIT](https://choosealicense.com/licenses/mit)
