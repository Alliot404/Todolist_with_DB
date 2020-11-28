//getting ready node modules
const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


// console.log(date);
// const request = require("request");
// const https = require("https");

//creating instance of app to use app. methods
const app = express();
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));

// let item = "";

//creating database with mongoose
mongoose.connect("mongodb+srv://admin-abhi:password@cluster0.1dcnz.mongodb.net/todolistDB",{useNewUrlParser: true ,useUnifiedTopology: true});

//creating mongoose schema
const itemsSchema = {
  name: String
};

//mongoose model based on the schema
const Item = mongoose.model("Item",itemsSchema);

// creating new documents with mongoose
const item1 = new Item ({
  name: "Hit the + button to add a new item"
});

const item2 = new Item ({
  name: "Check the box to delete an item"
});


const defaultItems =  [item1,item2]; // created default item array

//new list Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


//using ejs
app.set('view engine', 'ejs');

app.get("/",function(req,res){

  Item.find({},function(err,foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});//passing founditems into list.ejs
    }
});
});

app.get("/:customeListname", function(req,res){
  const customeListname= _.capitalize(req.params.customeListname);

//findone method to avoid creating many home list data
List.findOne({name: customeListname}, function(err, foundList){
  if(!err){
    if(!foundList){
      //create a new list
      //creating new list document with mongoose
      const list = new List({
        name: customeListname,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customeListname);
    }
    else{
      //show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});

});

//handles the post request to the home route
app.post("/",function(req,res){

  const itemName = req.body.newItem;
  const listName = req.body.list;  // adding new items to new list


// creating new document of Item
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/"); //after saving we redirect to home and new foundItems will be added
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName=== "Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

app.get("/about",function(req,res){
  res.render("about");
});


//heroku listening port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


//listening on port and starting server
app.listen(port,function(){
  console.log("server has started on port 3000");
});
