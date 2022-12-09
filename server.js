let fs = require("fs");
const http = require('http');
const portNumber = 5000;
const httpSuccessStatus = 200;
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express"); 
const app = express();  
app.listen(portNumber, "0.0.0.0")
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
console.log(`Web server is running at http://localhost:${portNumber}`);

app.get("/", (request, response) => {
    response.render("home");
});

app.post("/home", (request, response) => {
    let url = "http://www.boredapi.com/api/activity/"; 
    let act; 
fetch(url) // get data
    .then(response => response.json())
    .then(json =>  process(json)
    );  
    function process(json){
    let ans  = {
        activity : json.activity, 
        accessibility: json.accessibility,
        type: json.type,
        participant: json.participants
    }
    response.render("result", ans);
    }
});
app.use(bodyParser.urlencoded({extended:false}));

app.post("/result", (request, response) => {;
    response.render("feedback");
});

/* Mongo DB set up */
require("dotenv").config({
    path: path.resolve(__dirname, "credentialsDontPost/.env"),
 });
 const userName = process.env.MONGO_DB_USERNAME;
 const password = process.env.MONGO_DB_PASSWORD;
 const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION,
 };
 const { MongoClient, ServerApiVersion, ConnectionClosedEvent } = require("mongodb");
 const { mainModule } = require("process");
 const { clear } = require("console");
app.post("/feedback", (request, response) => {
    let time = request.body.time;
    let act = request.body. activity;
    let feelings = request.body.feelings;
    const uri = `mongodb+srv://${userName}:${password}@cluster0.bs8gt.mongodb.net/?retryWrites=true&w=majority `;
    const client = new MongoClient(uri, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
       serverApi: ServerApiVersion.v1,
    });
    insertData()
      async function insertData(){
      try {
         await client.connect();
         /* Inserting one movie */
         let info = {
         Time: time,
         Activity: act,
         Feeling: feelings,
         };
         await insertDataHelper(client, databaseAndCollection, info);
      } catch (e) {
         console.error(e);
      } finally {
         await client.close();
      }
    }
    response.render("confirmation");
});

async function insertDataHelper(client, databaseAndCollection, info) {
    const result = await client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(info)
    }

app.post("/confirmation", (request, response) => {
    showall()
    async function showall() {
        const uri = `mongodb+srv://${userName}:${password}@cluster0.bs8gt.mongodb.net/?retryWrites=true&w=majority `;
        const client = new MongoClient(uri, {
           useNewUrlParser: true,
           useUnifiedTopology: true,
           serverApi: ServerApiVersion.v1,
        });
        try {
            await client.connect();
            let filter = {};
            const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
            
            const arr = await cursor.toArray();
            let htmltable = "<table border='1'>";
            htmltable +=  "<tr>";
            htmltable += "<th>Time</th> <th>Activity</th>";
            htmltable +=  "</tr>"
            arr.forEach(elem =>{
                htmltable += "<tr>";
                htmltable += "<td>";
                htmltable += elem.Time; 
                htmltable += "</td>";
                htmltable += "<td>";
                htmltable += elem.Activity;
                htmltable += "</td>";
                htmltable += "</tr>";
            });
            htmltable += "</table>";
            let ans = {
                pastActivity: htmltable
             }
            response.render("lists", ans );

        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }

});
