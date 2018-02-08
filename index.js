const fs = require('fs')
const http = require('http')
const yargs = require('yargs')

yargs
    .usage('$0 <cmd> [args]')
    .alias('v', 'version')
    .version('1.0.0')
    .describe('v', 'show version information')

    .command(
        'upload [file] [server] [port] [namespace]',
        'input file to upload with specified server, port and namespace',
        yargs => {
            yargs
                .positional('file', {
                    alias: 'f',
                    type: 'string',
                    describe: 'the file to upload'
                })
                .positional('server', {
                    alias: 's',
                    type: 'string',
                    describe: 'the server to upload to'
                })
                .positional('port', {
                    alias: 'p',
                    type: 'number',
                    default: '9999',
                    describe: 'the port for the server'
                })
                .positional('namespace', {
                    alias: 'n',
                    type: 'string',
                    describe: 'the namespace for the file'
                })
        },
        argv => {
            // read file and convert to string
            let fileContent = fs.readFileSync(argv.file).toString()

            // set options for HTTP POST request
            let options = {
                host: argv.server,
                port: argv.port,
                path: '/contents',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                }
            }

            // set object to match dictybase content API
            let model = {
                data: {
                    type: 'contents',
                    attributes: {
                        name: argv.file,
                        created_by: 99999999,
                        content: fileContent,
                        namespace: argv.namespace
                    }
                }
            }

            // make the HTTP request
            let req = http.request(options, res => {
                console.log(`STATUS: ${res.statusCode}\n`)
                console.log(`HEADERS: ${JSON.stringify(res.headers)}\n`)
                res.setEncoding('utf8')
                res.on('data', chunk => {
                    console.log(`BODY: ${chunk}\n`)
                })
                res.on('end', () => {
                    console.log('End of data from response.')
                })
            })

            // notify of potential error messages
            req.on('error', e => {
                console.log(`Problem with request: ${e.message}`)
            })

            // write data to request body
            req.write(JSON.stringify(model))

            // end request
            req.end()
        }
    )
    .help('h')
    .alias('h', 'help')
    .example(
        'node index upload --file example.json --server localhost --port 31827 --namespace example'
    )
    .example('node index upload -f example.json -s localhost -p 31827 -n example')
    .argv
