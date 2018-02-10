const fs = require('fs')
const http = require('http')

exports.command = 'upload [file] [host] [port] [namespace]'
exports.describe = 'input file to upload with specified host, port and namespace'

exports.builder = yargs => {
            yargs
                .positional('file', {
                    alias: 'f',
                    type: 'string',
                    describe: 'the file to upload'
                })
                .env('CONTENT_API_SERVICE_HOST')
                .positional('host', {
                    alias: 'H',
                    type: 'string',
                    default: 'content-api',
                    describe: 'the server to upload to'
                })
                .env('CONTENT_API_SERVICE_PORT')
                .positional('port', {
                    alias: 'p',
                    type: 'number',
                    describe: 'the port for the server'
                })
                .positional('namespace', {
                    alias: 'n',
                    type: 'string',
                    describe: 'the namespace for the file'
                })
        }

exports.handler =  argv => {
            // read file and convert to string
            let fileContent = fs.readFileSync(argv.file).toString()

            // set options for HTTP POST request
            let options = {
                host: argv.host,
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
                        name: argv.file.slice(0, -5),
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
