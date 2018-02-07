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
                    default: 'localhost:3000',
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
            // let serializedData = JSON.stringify(fileContent)
            // console.log(serializedData)

            let options = {
                host: argv.server,
                port: 31827, // need to pull from server argument
                path: '/contents',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application.json'
                }
            }

            let model = {
                "data": {
                    "type": "string",
                    "attributes": {
                      "name": "string",
                      "created_by": "string",
                      "content": fileContent,
                      "namespace": argv.namespace
                    }
                }
            }

            let req = http.request(options, res => {
                console.log(`STATUS: ${res.statusCode}`)
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
                res.setEncoding('utf8')
                res.on('data', chunk => {
                    console.log(`BODY: ${chunk}`)
                })
                res.on('end', () => {
                    console.log('No more data in response.')
                })
            })

            // notify of potential error messages
            req.on('error', e => {
                console.log(`Problem with request: ${e.message}`)
            })
            
            // write data to request body
            req.write(JSON.stringify(model))
            req.end()
        }
    )
    .help('h')
    .alias('h', 'help')
    .example(
        'node index upload --file example.json --server localhost:3000 --namespace example'
    )
    .example('node index upload -f example.json -s localhost:3000 -n example')
    .argv
