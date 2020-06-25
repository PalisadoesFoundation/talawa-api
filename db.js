
const mongoose = require("mongoose");



const connect = mongoose
.connect(
  "mongodb+srv://devtest876:319JsGBLuWVP8Jvx@talawa-dev-nk4oo.mongodb.net/official-db?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
)

module.exports = connect