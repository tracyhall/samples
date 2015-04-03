# csstoless
Python CSS to LESS parser

```
usage: cssToLess.py [-h] [-p] [-m VARIABLE_MAP] input [output]

Translate a complex css file into a valid LESS file

positional arguments:
  input                 CSS file to translate.
  output                LESS output file.

optional arguments:
  -h, --help            show this help message and exit
  -p, --pretty          Pretty print the output file.
  -m VARIABLE_MAP, --map VARIABLE_MAP
                        Path to file with variable map. Format: 1 variable per
                        line, value first then variable name, comma separated.
```

Example input css file and variable map files are included.

Nice to have:
* another mapping file where different selectors can be flagged to be added to separate less files, rather than one large less file, or
* ability to parse comments in the css file to define variables and preferred spots for breaking content into new less files.
