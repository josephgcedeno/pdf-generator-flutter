var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var pdf = require('html-pdf');
var fs = require('fs');
var path = require('path');

var options =
{
    format: 'A4',
    width: '280mm', height: '396mm',
    "border": {
        "top": "50px",            // default is 0, units: mm, cm, in, px
        "left": "40px",
        "bottom": "50px"
    },
    "phantomPath": "./node_modules/phantomjs-prebuilt/bin/phantomjs"

};

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Set 'views' directory for any views 
// being rendered res.render()
app.set('views', path.join(__dirname, 'views'));

// Set view engine as EJS
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {

    res.send('Hello Pitik html-pdf generator updated with BufferResult');

});


formatData = (params) => {
    // res.send('Hello Pitik html-pdf generator update');
    let basePay = params.basePay;
    let taxPercentage = params.taxPercentage;
    let contributions = params.contributions;

    var templateString = fs.readFileSync('./views/index.html', 'utf-8');

    const html = ejs.render(templateString, { basePay: basePay, taxPercentage: taxPercentage, contributions: contributions, },)

    return html;
};

app.post("/genereate-pdf-report", (req, res) => {
    const params = req.body;
    const htmlToString = formatData(params);

    pdf.create(htmlToString, options).toBuffer(function (err, result) {
        if (err) {
            return console.log(err);
        }
        else {
            res.header('content-type', 'application/pdf');
            res.send(result);
        }
    });
});

var port = process.env.PORT || '3000';
app.listen(port, () => console.log('server run at port '));