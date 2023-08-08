//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const app = express();
const _ = require("lodash")

app.set('view engine', 'ejs');
mongoose.set("strictQuery", false);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Define the database URL to connect to.
const mongoDB = "mongodb+srv://rotem0308:rotem0309@cluster0.xj0jlnn.mongodb.net/todoListDB";
const PORT = process.env.PORT
// Wait for database to connect, logging an error if there is a problem
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

const itemsSchema = {
  name: String
};

const Item = new mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});


const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = new mongoose.model("List", listSchema);



app.post("/", async function (req, res) {
  try {
    const { newItem } = req.body;
    let currentList;
    const listName = req.body.list
    const item = new Item({
      name: newItem
    })
    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      const currentList = await List.findOne({ name: listName })
      currentList.items.push(item);
      currentList.save();
      res.redirect('/' + listName)
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
});

app.post("/delete", function (req, res) {
  const checkedListName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if (checkedListName === "Today") {
    //In the default list
    del().catch(err => console.log(err));

    async function del() {
      await Item.deleteOne({ _id: checkedItemId });
      res.redirect("/");
    }
  } else {
    //In the custom list

    update().catch(err => console.log(err));

    async function update() {
      await List.findOneAndUpdate({ name: checkedListName }, { $pull: { items: { _id: checkedItemId } } });
      res.redirect("/" + checkedListName);
    }
  }

});

app.get("/", async function (req, res) {
  try {
    const items = await Item.find();
    if (items.length === 0) {
      const result = await Item.insertMany(defaultItems);
      res.redirect('/');
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }

  } catch (err) {
    console.error("Error:", err.message);
  }

});


app.get("/:id", async function (req, res) {
  try {
    const id = _.capitalize(req.params.id);
    const lists = await List.findOne({ name: id });

    if (!lists) {
      //Create a new list
      const list = new List({
        name: id,
        items: defaultItems
      })
      list.save();
      res.redirect('/' + id);
    } else {
      //show an existing list
      res.render('list', { listTitle: lists.name, newListItems: lists.items })
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
})
// list.save();


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(PORT, function () {
  console.log("Server started on port 3000");
});
