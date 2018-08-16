const fs = require("fs")
const path = require("path")
const fetch = require("node-fetch")
const moment = require("moment")
const tmp = require("tmp")
const Minio = require("minio")

exports.command = "minio [route] [miniohost] [minioport] [accesskey] [secretkey] [host] [port] [namespace] [user]"
exports.describe = "get files from minio and upload to content api server"

exports.builder = yargs => {
  yargs
    .positional("route", {
      alias: "r",
      type: "string",
      describe: "the path (route) to the minio folder to download from",
    })
    .env("MINIO_SERVICE_HOST")
    .positional("miniohost", {
      alias: "mh",
      type: "string",
      describe: "minio host",
    })
    .env("MINIO_SERVICE_PORT")
    .positional("minioport", {
      alias: "mp",
      type: "number",
      describe: "minio port",
    })
    .env("S3_ACCESS_KEY")
    .positional("accesskey", {
      alias: "akey",
      type: "string",
      describe: "access key for S3 server",
    })
    .env("S3_SECRET_KEY")
    .positional("secretkey", {
      alias: "skey",
      type: "string",
      describe: "secret key for S3 server",
    })
    .env("CONTENT_API_SERVICE")
    .positional("chost", {
      alias: "ch",
      type: "string",
      default: "content-api",
      describe: "the server to upload to",
    })
    .env("CONTENT_API_SERVICE")
    .positional("cport", {
      alias: "cp",
      type: "number",
      describe: "the port for the server",
    })
    .positional("namespace", {
      alias: "n",
      type: "string",
      describe: "the namespace for the folder",
    })
    .positional("user", {
      alias: "u",
      type: "number",
      describe: "the user who is uploading the content",
    })
    .demandOption(["r", "n", "u"])
    .help("h")
    .example(
      "minio --route contents/frontpageV1 --miniohost 192.168.99.100 --minioport 33377 --accesskey qwerty --secretkey asdf --chost localhost --cport 31827 --namespace example --user 999",
    )
    .example(
      "minio -r contents/frontpageV1 -mh 192.168.99.100 -mp 33377 -akey qwerty -skey asdf -ch localhost -cp 31827 -n example -u 999",
    )
}

const printContent = json => {
  let output = `resource link: ${json.links.self}
    id: ${json.data.id}
    namespace: ${json.data.attributes.namespace}
    slug: ${json.data.attributes.slug}
       `
  const created = moment(json.data.attributes.created_at)
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
        `,
  )
}

// An async function(search google for syntaxes)
const postContent = async (url, body) => {
  try {
    // get the response(resolves the first promise)
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (res.ok) {
      // successful http response(read the fetch API spec)
      // now get the json(resolves the second promise)
      const json = await res.json()
      printContent(json)
    } else {
      // this is an http error(error response from server)
      // comes in JSONAPI error format(http://jsonapi.org/examples/#error-objects-basics)
      const json = await res.json() // this is the error json(same second promise)
      printError(res, json)
    }
  } catch (err) {
    // possibly a network error or something
    console.log(`network error: ${err.message}`)
  }
}

exports.handler = argv => {
  // make temp folder
  const tmpobj = tmp.dirSync()
  // console.log("Dir: ", tmpobj.name)

  // instantiate minioClient object
  const minioClient = new Minio.Client({
    endPoint: argv.miniohost,
    port: argv.minioport,
    secure: false,
    accessKey: argv.accesskey,
    secretKey: argv.secretkey,
  })

  // get bucket and folder from route argument
  const splitPath = argv.route.split("/")
  const bucket = splitPath[0]
  const folder = splitPath[1]

  // make folder if it doesn't exist
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
  }

  // get list of objects then download each one into specified folder
  const stream = minioClient.listObjects(bucket, folder, true)
  stream.on("data", obj => {
    minioClient.getObject(bucket, obj.name, (err, dataStream) => {
      if (err) {
        return console.log(err)
      }
      const file = fs.createWriteStream(`${obj.name}`)
      dataStream.on("data", chunk => {
        file.write(chunk)
      })
      dataStream.on("end", () => {
        file.end()
        console.log(`Finished downloading ${obj.name}`)
      })
      dataStream.on("error", error => {
        console.log(error)
      })
    })
  })
  stream.on("error", err => {
    console.log(err)
  })

  // read folder
  fs.readdir(folder, (err, files) => {
    if (err) {
      console.log(err)
      process.exit(1) // stop the script
    }
    // for each file in folder, run this script
    files.forEach(file => {
      // read file and convert to string
      const fileContent = fs.readFileSync(`${folder}/${file}`).toString()
      const url = `http://${argv.chost}:${argv.cport}/contents`
      // set object to match dictybase content API
      const body = {
        data: {
          type: "contents",
          attributes: {
            name: path.basename(file, path.extname(file)),
            created_by: argv.user,
            content: fileContent,
            namespace: argv.namespace,
          },
        },
      }
      postContent(url, body)
    })
  })
  // manual folder cleanup
  tmpobj.removeCallback()
}