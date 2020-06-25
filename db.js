
const mongoose = require("mongoose");



const connect = mongoose
.connect(
  "mongodb://root:janelle123@ds023428.mlab.com:23428/talawa",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
)

module.exports = connect