const fs = require("fs")
const fetch = require("node-fetch")
const moment = require("moment")

exports.command = "update [file] [host] [port] [namespace]"
exports.describe = "update an existing content"

exports.builder = yargs => {
  yargs
    .positional("file", {
      alias: "f",
      type: "string",
      describe: "the file to to use for updating the content",
    })
    .env("CONTENT_API_SERVICE")
    .positional("host", {
      alias: "H",
      type: "string",
      default: "content-api",
      describe: "server for updating",
    })
    .env("CONTENT_API_SERVICE")
    .positional("port", {
      alias: "p",
      type: "number",
      describe: "the port of the server",
    })
    .positional("identifier", {
      alias: "id",
      type: "number",
      describe: "unique identifier for the content",
    })
    .demandOption(["id", "f"])
    .help("h")
    .example(
      "update --identifier 3 --file example.json --host localhost --port 31827",
    )
    .example("update -id 3 -f example.json -H localhost -p 31827")
}

exports.handler = argv => {
  // read file and convert to string
  const fileContent = fs.readFileSync(argv.file).toString()
  const url = `http://${argv.host}:${argv.port}/contents/${argv.identifier}`
  // set object to match dictybase content API
  const body = {
    id: argv.identifier,
    data: {
      id: argv.identifier,
      type: "contents",
      attributes: {
        updated_by: "20",
        content: fileContent,
      },
    },
  }
  updateContent(url, body)
}

// An async function(search google for syntaxes)
const updateContent = async (url, body) => {
  try {
    // get the response(resolves the first promise)
    res = await fetch(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
    if (res.ok) {
      // successful http response(read the fetch API spec)
      // now get the json(resolves the second promise)
      json = await res.json()
      printContent(json)
    } else {
      // this is an http error(error response from server)
      // comes in JSONAPI error format(http://jsonapi.org/examples/#error-objects-basics)
      json = await res.json() // this is the error json(same second promise)
      printError(res, json)
    }
  } catch (err) {
    //possibly a network error or something
    console.log(`network error: ${err.message}`)
  }
}

const printContent = json => {
  output = `resource link: ${json.links.self}
    id: ${json.data.id}
    namespace: ${json.data.attributes.namespace}
    slug: ${json.data.attributes.slug}
       `
  created = moment(json.data.attributes.created_at)
  updated = moment(json.data.attributes.updated_at)
  if (created.isValid()) {
    output += `created on: ${created.fromNow()}
       updated on: ${updated.fromNow()}
            `
  } else {
    console.log("error in parsing date")
  }
  console.log(output)
}

const printError = (res, json) => {
  console.log("got http error******")
  console.log(
    `http response: ${res.status}
         title: ${json.errors[0].title}
         detail: ${json.errors[0].detail}
        `,
  )
}
