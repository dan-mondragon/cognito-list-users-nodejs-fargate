var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const express = require('express')
var fs = require('fs');
const path = require('path');
const app = express();
const port = 8080;

var uploadToBucket = function(fileName){
    console.log("uploadToBucket");
    try{
        let s3 = new AWS.S3();
        const fileContent = fs.readFileSync(fileName, 'utf8');
        const params = {
            Bucket: 'el-patron-confirmed-users-prd',
            Key: generateFileName(),
            Body: fileContent
        }
    
        s3.upload(params, function(err, data) {
            if (err) {
                throw err;
            }
            console.log(`File uploaded successfully. ${data.Location}`);
        });
    }
    catch(e) {
        console.log(e);
    }
}

var cognitoListUsers = async function(paginationToken){
    console.log("cognitoListUsers");
    try{
        let cognito = new AWS.CognitoIdentityServiceProvider();
        let params = {
            UserPoolId: "us-east-1_BKu7qAohu",
            Limit: 60,
            Filter: "cognito:user_status = \"CONFIRMED\"",
          };
          
        if (paginationToken !== '') {
           params.PaginationToken = paginationToken;
        }
    
        return cognito.listUsers(params).promise();
    }
    catch(e) {
        console.log(e);
    }
}

var writeUsers = function(rawUsers, writer){
    console.log("writeUsers");
    try{
        let i = 0;
        rawUsers.Users.map(user => {
            let atts = {}
            i++;
    
            for (const att of user.Attributes) {
              atts[att.Name] = att.Value;
            }
    
            let userObj = {
              username: user.Username,
              sub: atts.hasOwnProperty('sub') ? atts.sub : '',
              email: atts.hasOwnProperty('email') ? atts.email : '',
              phone: atts.hasOwnProperty('phone_number') ? atts.phone_number : '',
              legacyId: atts.hasOwnProperty('custom:legacy_id') ? atts['custom:legacy_id'] : '',
              status: user.UserStatus,
            }
    
            writer.write(`${userObj.sub},${userObj.email},${userObj.phone}\n`);
        });
    
        return i;
    }
    catch(e) {
        console.log(e);
    }
}

var setUpWriter = function(fileName){
    console.log("setUpWriter");
    deletePreviousFiles();
    try{
        let writer = fs.createWriteStream(fileName, {
            flags: 'a'
        })
        writer.write(`Id,Email,Telefono\n`);
        return writer;
    }
    catch(e) {
        console.log(e);
    }
}

var deletePreviousFiles = function(){
    console.log("deletePreviousFiles");
    try{
        const directory = './users-file';
        let filenames = fs.readdirSync(directory);
        filenames.forEach(file => {
            fs.unlinkSync(path.join(directory, file));
        });
    }
    catch(e) {
        console.log(e);
    }
}

var generateFileName = function(){
    console.log("generateFileName");
    let dateObj = new Date();
    let month = dateObj.getUTCMonth() + 1; //months from 1-12
    let day = dateObj.getUTCDate();
    let year = dateObj.getUTCFullYear();

    return `usuarios_patron-${year}-${month}-${day}.csv`;
}

var getUsers = async function() {
    console.log(process.env);
    try {
        let more = true;
        let count = 0;
        let paginationToken = '';
        let fileName = `./users-file/${generateFileName()}`;
        let writer = setUpWriter(fileName);
        while (more) {
            var rawUsers = await cognitoListUsers(paginationToken);
            var i = writeUsers(rawUsers, writer);
            count += i;
            if (rawUsers.hasOwnProperty('PaginationToken')) {
                paginationToken = rawUsers.PaginationToken;
            } else {
                more = false;
            }
        }
        console.log("Users:" + count);
        writer.end();
        uploadToBucket(fileName);
    }
    catch (e) {
        console.log(e);
    }
}

app.get('/', (req, res) => {
    console.log("Hello World");
    res.send("Hello World");
})

app.get('/create-users-file', (req, res) => {
    console.log("Creating users...");
    getUsers();
    res.send("Success");
})

app.listen(port, () => console.log(`Example app listening on port ${port}`))