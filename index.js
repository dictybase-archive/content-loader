const fs = require('fs')
const http = require('http')
const yargs = require('yargs')

yargs
    .usage('$0 <cmd> [args]')
    .alias('v', 'version')
    .version('1.0.0')
    .describe('v', 'show version information')

    .command(
        'upload [file] [server] [namespace]',
        'input file to upload with specified server and namespace',
        yargs => {
            yargs
                .positional('file', {
                    alias: 'f',
                    type: 'string',
                    default: 'index',
                    describe: 'the file to upload'
                })
                .positional('server', {
                    alias: 's',
                    type: 'string',
                    default: 'http://localhost:3000',
                    describe: 'the server to upload to'
                })
                .positional('namespace', {
                    alias: 'n',
                    type: 'string',
                    default: 'index', // change to filename
                    describe: 'the namespace for the file'
                })
        },
        argv => {
            let fileContent = fs.readFileSync(argv.file).toString()
            let serialized = JSON.stringify(fileContent)
            console.log(serialized)


        }
    )
    .help('h')
    .alias('h', 'help')
    .example(
        'node index upload --file example.json --server localhost:3000 --namespace example'
    )
    .example('node index upload -f example.json -s localhost:3000 -n example')
    .argv
