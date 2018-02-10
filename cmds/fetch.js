const fetch = require('node-fetch')

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
        const url = `http://${argv.host}:${argv.port}/contents/${argv.identifier}`
        getContent(url)
}

// An async function(search google for syntaxes)
const getContent = async (url) => {
    try {
        // get the response(resolves the first promise)
        res = await fetch(url)
        if (res.ok) { // successful http response(read the API spec)
            // now get the json(resolves the second promise)
            json = await res.json()
            printContent(json)
        } else { // this is an http error(error response from server)
            // comes in JSONAPI error format(http://jsonapi.org/examples/#error-objects-basics)
            json = await res.json() // this is the error json(same promise)
            printError(res,json)
        }
    } catch (err) {
        //possibly a network error or something
        console.log(`network error: ${err.message}`)
    }

}

const printContent = (json) => {
    console.log(
        `resource link: ${json.links.self}
        namespace: ${json.data.attributes.namespace}
        slug: ${json.data.attributes.slug}
    `)
}

const printError = (res,json) => {
    console.log('got http error******')
    console.log(
        `http response: ${res.status}
         title: ${json.errors[0].title}
         detail: ${json.errors[0].detail}
        `)

}
