const fs = require('fs')
const fetch = require('node-fetch')
const moment = require('moment')

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
        .demandOption(['n','f'])
        .help('h')
        .example(
            'upload --file example.json --host localhost --port 31827 --namespace example'
        )
        .example('upload -f example.json -H localhost -p 31827 -n example')
}

exports.handler =  argv => {
        // read file and convert to string
        const fileContent = fs.readFileSync(argv.file).toString()
        const url = `http://${argv.host}:${argv.port}/contents`
        // set object to match dictybase content API
        const body = {
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
        postContent(url,body)
}


// An async function(search google for syntaxes)
const postContent = async (url,body) => {
    try {
        // get the response(resolves the first promise)
        res = await fetch(url,{
                        method: 'POST',
                        body: JSON.stringify(body)
                    })
        if (res.ok) { // successful http response(read the fetch API spec)
            // now get the json(resolves the second promise)
            json = await res.json()
            printContent(json)
        } else { // this is an http error(error response from server)
            // comes in JSONAPI error format(http://jsonapi.org/examples/#error-objects-basics)
            json = await res.json() // this is the error json(same second promise)
            printError(res,json)
        }
    } catch (err) {
        //possibly a network error or something
        console.log(`network error: ${err.message}`)
    }
}

const printContent = (json) => {
    output = `resource link: ${json.links.self}
    id: ${json.data.id}
    namespace: ${json.data.attributes.namespace}
    slug: ${json.data.attributes.slug}
       `
    created = moment(json.data.attributes.created_at)
    if (created.isValid()) {
        output += `created on: ${created.fromNow()}`
    } else {
        console.log('error in parsing date')
    }
    console.log(output)
}

const printError = (res,json) => {
    console.log('got http error******')
    console.log(
        `http response: ${res.status}
         title: ${json.errors[0].title}
         detail: ${json.errors[0].detail}
        `)

}
