const fetch = require("node-fetch")
const moment = require("moment")

exports.command = "fetchbyslug [slug] [host] [port]"
exports.describe = "retrieve content by slug"
exports.builder = yargs => {
  yargs
    .env("CONTENT_API_SERVICE")
    .positional("host", {
      alias: "H",
      type: "string",
      default: "content-api",
      describe: "api server",
    })
    .env("CONTENT_API_SERVICE")
    .positional("port", {
      alias: "p",
      type: "number",
      describe: "api server port",
    })
    .positional("slug", {
      alias: "s",
      type: "string",
      describe: "slug name of the content",
    })
    .demandOption(["slug"])
    .help("h")
    .example("fetch --slug dsc-information --host localhost --port 31827")
    .example("fetch -s dsc-faq -H localhost -p 31827")
}

exports.handler = argv => {
  const url = `http://${argv.host}:${argv.port}/contents/slug/${argv.slug}`
  getContent(url)
}

// An async function(search google for syntaxes)
const getContent = async url => {
  try {
    // get the response(resolves the first promise)
    res = await fetch(url)
    if (res.ok) {
      // successful http response(read the API spec)
      // now get the json(resolves the second promise)
      json = await res.json()
      printContent(json)
    } else {
      // this is an http error(error response from server)
      // comes in JSONAPI error format(http://jsonapi.org/examples/#error-objects-basics)
      json = await res.json() // this is the error json(same promise)
      printError(res, json)
    }
  } catch (err) {
    //possibly a network error or something
    console.log(`network error: ${err.message}`)
  }
}

const printContent = json => {
  output = `resource link: ${json.links.self}
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
