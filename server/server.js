var express = require("express");
const path = require('path');
var mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
const hbs = require('hbs');
require('dotenv').config()

var publicPath = path.join(__dirname, '../public');
var app = express();
const port = process.env.PORT || 3000;
var url = process.env.MONGOLAB_URI;

app.set('view engine', 'hbs');
//app.use(express.static(publicPath));
//mongoose.connect('mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS'@ds155352.mlab.com:55352/books')
//mongoose.connect("mongodb://lungha:1g9C94ghas0@ds155352.mlab.com:55352/books");


mongoose.Promise = global.Promise;
console.log(process.env.DB_USER)
mongoose.connect('mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@ds155352.mlab.com:55352/books')

var mediaSchema = new mongoose.Schema({
  SourceType: String,
  Title: String,
  Author: String,
  Year: Number,
  MainText: String,
  TitleAuth: String
});

var searchQuery = new mongoose.Schema({
  SearchQuery: String
});

var idNumber = new mongoose.Schema({
  idNumb : String,
});

app.get('/', (req, res) => {
  res.render('homepage.hbs', {
    list: 'hello'
  });
});



app.listen(port, () => {
  console.log("Server listening on port " + port );
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@ds155352.mlab.com:55352/books');

var Media = mongoose.model("Media", mediaSchema);
var IdNumber = mongoose.model("idNumber", mediaSchema);
var SearchQuery = mongoose.model("searchQuery", mediaSchema)

app.post("/thankyou", (req, res) => {
  var myData = new Media(req.body);
  myData.save()
    .then(item => {
      res.render('thankyou.hbs');
    })
    .catch(err => {
      res.status(400).send("unable to save to database");
      console.log(err);
    });
});

function getMainText(database, searchTerm) {
  return database
    .filter(function(obj) {
      return obj.MainText;
  })
  .map(function(obj) {
    const regex = new RegExp('/[^.]*' + searchTerm + '[^.]*\./g')
    return obj.MainText;
  })
}

function filterText (obj, searchTerm) {
  const regex = new RegExp('[^.]*?' + searchTerm + ' [^.]*?\\.', 'g');
  const boldMe = new RegExp(searchTerm, 'g');

  var empty = [];
  var matchedSentences = obj.match(regex);
  var desiredHTML = '<li><p class="resultList">'

  for (var i = 0; i<matchedSentences.length; i++) {
    empty.push(desiredHTML + matchedSentences[i]);
  }
  return empty.join('').replace(boldMe, '<b style="color:blue">'+searchTerm+'</b>')
}

function checkIfContainedInText (obj, searchTerm) {
  const regex = new RegExp('[^.]*?' + searchTerm + ' [^.]*?\\.', 'g');
  var isThereAMatch = obj.match(regex);
  if (isThereAMatch !== null) {
    console.log(obj.match(regex))
    return true;
  } else {
    console.log(obj.match(regex))
    return false;
  }
}

app.post('https://glacial-beach-19594.herokuapp.com/search', (req, res) => {
  var SearchedItem = req.body.SearchQuery
  Media.find().then((medias) => {
    var mainText = getMainText(medias);

    if (checkIfContainedInText(String(mainText), SearchedItem) === false) {
      res.render('notFound.hbs');
      return;
    } else {
      var filteredBulk = filterText(String(mainText), SearchedItem);
      console.log('checkIfContainedInText returned true');
      res.render('search.hbs', {
        title: filteredBulk
      })
    }
  }, (e) => {
    res.status(400).send(e);
  });
});

app.post("/remove", (req, res) => {
  var gonnaBeGone = req.body.Idnum;
  Media.findByIdAndRemove(gonnaBeGone).then((item) => {
    console.log(item);
    res.render('thankyou.hbs');
  })
  .catch(err => {
    res.status(400).send("unable to save");
    console.log(err);
  })
});

function getTitleClean(database) {
  return database
    .filter(function(obj){
    return obj.Title;
  })
  .map(function(obj){
    return obj.Title;
  })
}

function getAuthor(database) {
  return database
    .filter(function(obj){
    return obj.Author;
  })
  .map(function(obj){
    return obj.Author;
  })
}

function getTitle(database) {
  return database
    .filter(function(obj) {
      return obj.Title;
    })
    .map(function(obj) {
      var regexie = /\s/g;
      return `<li onclick=changeTitle("${obj.Title.replace(regexie, '_')}","${obj.Author.replace(regexie, '_')}",${obj.Year},"${obj.MainText.replace(regexie, '_')}","${obj.id}")>    <form method="post" action="/remove">
            <input type=text style="display:none" name=Idnum value="${obj.id}" class="idText">
            <input type="submit" class="idSubmitButton" value="X" style="background: #FFCB47; border: none">
           </form>` + obj.Title + `</li>`;
    });
}

app.get('/addmedia', (req, res) => {
  Media.find().then((medias) => {
    res.render('index.hbs', {
      title: getTitle(medias).join(" "),
    })
  }, (e) => {
    res.status(400).send(e);
  });
});
