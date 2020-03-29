const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const app = require('express')();
const http = require('http').Server(app);
var io = require('./socket/').listen(http)  

const PORT = process.env.PORT || 7000;

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const activityRoutes = require('./routes/activity');
const respRoutes = require('./routes/responsibility');

// adding Helmet to enhance your API's security
app.use(helmet());
// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// enabling CORS for all requests
app.use(cors());
// adding morgan to log HTTP requests
app.use(morgan('combined'));

// app.get('/', (req, res) => {
//     res.send("Talawa API")
// })
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
  });

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/activities', activityRoutes);
app.use('/responsibility', respRoutes);

app.use((req, res, next) =>{
    const error = new Error('Not found');
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) =>{
    res.status(error.status || 500);
    res.json({
        error:{
            message: error.message
        }
    });
});

http.listen(PORT, function(){
    console.log('listening on *:' + PORT);
});
