
function notify(event) {
  console.log("notifying...");

  const request = require('request')

  request.post('http://firepi.altervista.org/localization.php', {
    json: event
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)
  })
}

exports.notify = notify;
