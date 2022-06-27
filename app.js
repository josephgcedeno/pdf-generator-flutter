var express    = require('express');
var bodyParser = require('body-parser');
var pdf        = require('html-pdf');
var fs         = require('fs');
var path       = require('path');
var request    = require('request-promise');
var nodemailer = require("nodemailer");
const json2csv = require("json2csv").parse;

var newLine     = '\r\n';
var options     = 
{   format: 'A4',
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
app.use(bodyParser.urlencoded({extended:false}));



app.get('/',(req,res)=>
{
    res.send('Hello Pitik html-pdf generator update');

});

app.post('/requestcsv',(req,res)=>
{


    fs.stat('datas.csv', function (err, stat) {
      if (err == null) {
        console.log('File exists');

        var csv =  `${req.body.message.replace(/,/g, " ")}, ${req.body.which}`  + newLine;  

        fs.appendFile('datas.csv', csv, function (err) {
          if (err) throw err;
          
          res.json({ success: 'The "data to append" was appended to file!' });
        });
      }
    });

    

});



app.post('/generatesendmail',(req,res)=>
{


   
    pdf.create(req.body.data, options).toFile(`./public/uploads/recordofuser${req.body.user_id}.pdf`, function(err, result) {
        if (err){
            return console.log(err);
        }
        else{

            var transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                      user: req.body.user,
                        pass:req.body.pass, 
                    },
                    tls: {
                        // do not fail on invalid certs
                        rejectUnauthorized: false
                    }
            });

            var mailoption={
                from: req.body.user, // sender address
                to: req.body.sendto, // list of receivers
                subject: req.body.subject, // Subject line
                text: req.body.message, // plain text body
                attachments: [{
                    filename: 'file.pdf',
                    path: path.join(__dirname, `./public/uploads/recordofuser${req.body.user_id}.pdf`), // <= Here
                    contentType: 'application/pdf'
                }]
            };

            transporter.sendMail(mailoption,(err,info)=>{
                if(err) return console.log(err)
                res.json({ success: true });

            });

         }
    });

});

// the URL SHOULD BE "localhost:3000/generate-pdf/id"
app.get('/generate-pdf/:id',(req,res)=>
{       
        var user_id = req.params.id; // Node way to get the id from URL

        console.log(`displaying pdf id is: ${user_id}`);
        const printnow = async () => 
        {
                var requestString = {
                    method: 'POST',
                    //uri: 'https://pitik.uic.edu.ph/generate-html-string',
                    uri: 'http://localhost:5000/generate-html-string',
                    body:  {
                        id:user_id
                    },
                    credentials: 'same-origin',
                    json: true
                };

                var sendrequest = await request(requestString)
                .then(function (parsedBody)
                {

                    let result;
                    result = parsedBody['result'];

                    pdf.create(result, options).toFile(`./public/uploads/recordofuser${user_id}.pdf`, function(err, result) {
                        if (err){
                            return console.log(err);
                        }
                         else{
                            var datafile = fs.readFileSync(`./public/uploads/recordofuser${user_id}.pdf`);
                            res.header('content-type','application/pdf');
                            res.send(datafile);
                        }
                    });
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        printnow();
   
});



// function deletepdfs()
// {
//     fs.readdir(`./public/uploads`, (err, files) => {
//       if (err) throw err;

//       for (const file of files) {
//         fs.unlink(path.join(`./public/uploads`, file), err => {
//           if (err) throw err;
//         });
//       }
//     });
// }

//assign port
var port =  process.env.PORT || '3000';
app.listen(port,()=>console.log('server run at port '));