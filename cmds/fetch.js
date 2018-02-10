const http = require('http')

exports.command = 'fetch [id] [host] [port]'
exports.describe = 'retrieve content by id'
exports.builder = yargs => {
    yargs
        .env('CONTENT_API_SERVICE_HOST')
        .positional('host', {
            alias: 'H',
            type: 'string',
            default: 'content-api',
            describe: 'api server'
        })
        .env('CONTENT_API_SERVICE_PORT')
        .positional('port', {
            alias: 'p',
            type: 'number',
            describe: 'api server port'
        })
        .positional('identifier', {
            alias: 'id',
            type: 'number',
            describe: 'unique identifier for the content'
        })
        .demandOption(['id'])
        .help('h')
        .example(
            'fetch --identifier 3 --host localhost --port 31827'
        )
        .example(
            'fetch -id 3 -H localhost -p 31827'
        )
}


exports.handler =  argv => {
        // set options for HTTP GET request
        const options = {
            host: argv.host,
            port: argv.port,
            path: '/contents/' + argv.identifier,
            method: 'GET'
        }

        // make the HTTP request
        let req = http.request(options, res => {
            let body
            res.on('data', chunk => {
                body += chunk
            })
            res.on('end', () => {
                c = JSON.parse(body)
            })
        })

        // notify of potential error messages
        req.on('error', e => {
            console.log(`Problem with request: ${e}`)
        })
        req.end()
}
