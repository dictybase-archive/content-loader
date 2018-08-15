const fs = require("fs")
const path = require("path")
const fetch = require("node-fetch")
const moment = require("moment")
const Minio = require("minio")

exports.command =
  "minio [folder] [miniohost] [minioport] [accesskey] [secretkey] [host] [port] [namespace] [user]"
exports.describe = "get files from minio and upload to content api server"

exports.builder = yargs => {
  yargs
    .positional("folder", {
      alias: "f",
      type: "string",
      describe: "the folder to download from minio"
    })
    .env("MINIO_SERVICE_HOST")
    .positional("miniohost", {
      alias: "mh",
      type: "string",
      describe: "minio host"
    })
    .env("MINIO_SERVICE_PORT")
    .positional("minioport", {
      alias: "mp",
      type: "number",
      describe: "minio port"
    })
    .env("S3_ACCESS_KEY")
    .positional("accesskey", {
      alias: "akey",
      type: "string",
      describe: "access key for S3 server"
    })
    .env("S3_SECRET_KEY")
    .positional("secretkey", {
      alias: "skey",
      type: "string",
      describe: "secret key for S3 server"
    })
    .env("CONTENT_API_SERVICE")
    .positional("host", {
      alias: "H",
      type: "string",
      default: "content-api",
      describe: "the server to upload to"
    })
    .env("CONTENT_API_SERVICE")
    .positional("port", {
      alias: "p",
      type: "number",
      describe: "the port for the server"
    })
    .positional("namespace", {
      alias: "n",
      type: "string",
      describe: "the namespace for the folder"
    })
    .positional("user", {
      alias: "u",
      type: "number",
      describe: "the user who is uploading the content"
    })
    .demandOption(["n", "f", "u"])
    .help("h")
    .example(
      "minio --folder frontpageV1 --miniohost 192.168.99.100 --minioport 33377 --accesskey qwerty --secretkey asdf --host localhost --port 31827 --namespace example --user 999"
    )
    .example(
      "minio -f frontpageV1 -mh 192.168.99.100 -mp 33377 -akey qwerty --skey asdf -H localhost -p 31827 -n example -u 999"
    )
}

exports.handler = argv => {
  // make folder if it doesn't exist
  if (!fs.existsSync(argv.folder)) {
    fs.mkdirSync(argv.folder)
  }

  // instantiate minioClient object
  const minioClient = new Minio.Client({
    endPoint: argv.miniohost,
    port: argv.minioport,
    secure: false,
    accessKey: argv.accesskey,
    secretKey: argv.secretkey
  })

  // get list of objects then download each one into specified folder
  const stream = minioClient.listObjects("dictybase", argv.folder, true)
  stream.on("data", obj => {
    minioClient.getObject("dictybase", obj.name, (err, dataStream) => {
      if (err) {
        return console.log(err)
      }
      const file = fs.createWriteStream(obj.name)
      dataStream.on("data", chunk => {
        file.write(chunk)
      })
      dataStream.on("end", () => {
        file.end()
        console.log(`Finished downloading ${obj.name}`)
      })
      dataStream.on("error", err => {
        console.error(err)
      })
    })
  })
  stream.on("error", err => {
    console.log(err)
  })

  // read folder
  fs.readdir(argv.folder, (err, files) => {
    if (err) {
      console.log(err)
      process.exit(1) // stop the script
    }
    // for each file in folder, run this script
    files.forEach(file => {
      // read file and convert to string
      const fileContent = fs.readFileSync(`${argv.folder}/${file}`).toString()
      const url = `http://${argv.host}:${argv.port}/contents`
      // set object to match dictybase content API
      const body = {
        data: {
          type: "contents",
          attributes: {
            name: path.basename(file, path.extname(file)),
            created_by: argv.user,
            content: fileContent,
            namespace: argv.namespace
          }
        }
      }
      postContent(url, body)
    })
  })
}

// An async function(search google for syntaxes)
const postContent = async (url, body) => {
  try {
    // get the response(resolves the first promise)
    res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body)
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
    // possibly a network error or something
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
  if (created.isValid()) {
    output += `created on: ${created.fromNow()}`
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
        `
  )
}
