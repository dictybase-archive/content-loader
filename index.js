const fs = require('fs')
const request = require('request')
const program = require('commander')

program
    .version('1.0.0', '-v, --version')
    .description('Content loader script for the dictyBase API')
    .command('upload [-f|--file=<file>] [-s|--server=<server>] [-n|--namespace=<namespace>]')
    .alias('u')

program.parse(process.argv)