// Datenbank initialisieren
const sqlite3 = require('sqlite3').verbose();
let userDB = new sqlite3.Database('user.db');
let productDB = new sqlite3.Database('product.db');

// Express.js Webserver
const express = require('express');
const app = express()

// Body-Parser: wertet POST-Formulare aus
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
  extended: true
}))

// EJS Template Engine
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

// Sessionvariablen
var session = require('express-session');
var FileStore = require('session-file-store')(session);

app.use(session({
  store: new FileStore,
  secret: 'example',
  resave: false,
  saveUninitialized: true,
  sessionUser: false,
  cart: false,
  //for testing, set to false initially
  isAdmin: true
}));



// Passwort Verschlüsselung
const bcrypt = require('bcrypt');
const saltRounds = 10;

//Include CSS and JS directories
app.use(express.static(__dirname + "/stylings"));
app.use(express.static(__dirname + "/js"));

app.use(express.static(__dirname + "/img"));

// Webserver starten http://localhost:3000
app.listen(3000, function() {
  console.log("listening on 3000");
});

// Websites
app.get("/", function(req, res) {
  res.redirect("home");
});

//DB erstellen, später auskommentieren
/*
app.get("/", (request,response) =>{
   userDB.run('CREATE TABLE user (id_user INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL)');
   productDB.run('CREATE TABLE products (id_product INTEGER PRIMARY KEY AUTOINCREMENT, productname TEXT NOT NULL, price TEXT NOT NULL, quantity TEXT NOT NULL)');
});
*/

app.get("/home", function(req, res) {
  const sql = 'SELECT * FROM products';

  //for testing, set to false if user view is needed
  req.session.isAdmin = false;
  if (!req.session.cart) {
    req.session.cart = [];
  }
  console.log(req.session.cart);

  productDB.all(sql, function(error, rows) {
    if (error) {
      console.log(error.message);
    } else {

      if (req.session.isAdmin) {
        res.render('indexAdmin', {
          'allItems': rows || [],
          'cart': req.session.cart
        });
      } else {
        res.render('index', {
          'allItems': rows || [],
          'cart': req.session.cart,
          'user': req.session.sessionUser
        });
      }
    }
  });
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/registration", function(req, res) {
  res.render("registration");
});

app.get("/checkout", function(req, res) {
  // req.session.cart.push({
  //   productname: "test",
  //   price: "0.99",
  //   quantity: "3"
  // });
  res.render("checkout", {
    "cart": req.session.cart
  });
});

app.post("/checkout", function(req, res) {
  if(req.session.sessionUser) {
      req.session.cart = [];
      res.redirect("/home");
  } else {
    res.render("error", {
      "msg": "Please log in before checking out."
    }
    });
});

app.get("/newproduct", function(req, res) {
  res.render("newproduct");
});

app.get("/delete", function(req, res) {
  res.render("delete");
});

app.get("/logout", function(req, res) {
  req.session.sessionUser = false;
  isAdmin = false;
  res.render("logout");
});


/*Register user*/

app.post('/registration', (req, res) => {
  const newUser = req.body["name"];
  const newPswd1 = req.body["pw1"];
  const newPswd2 = req.body["pw2"];
  var hashedPswd = false;

  // error
  if (newPswd1 != newPswd2) {
    res.render("error", {
      "msg": "Passwords are not the same."
    });
  }
  if (newUser == '') {
    res.render("error", {
      "msg": "Username is empty."
    });
  }
  if (newPswd1 == '') {
    res.render("error", {
      "msg": "First Password is empty."
    });
  }
  if (newPswd2 == '') {
    res.render("error", {
      "msg": "Second Password is empty."
    });
  }

  userDB.get(`SELECT * FROM user WHERE username='${newUser}'`, (error, row) => {
    if (error) {
      console.log(error.message);
    }
    // error
    if (row != undefined) {
      res.render("error", {
        "msg": "Username is already taken."
      });
    } else {
      bcrypt.hash(newPswd1, saltRounds, function(error, hash) {
        console.log(hashedPswd);
        if (error) {
          console.log(error.message);
          res.render("error", {
            "msg": error.message
          });
        }
        hashedPswd = hash;
        console.log(hashedPswd);
        userDB.run(`INSERT INTO user (username, password) VALUES ('${newUser}', '${hashedPswd}')`, (error) => {
          if (error) {
            console.log(error.message);
            res.render("error", {
              "msg": error.message
            });
          }
        });
        //show successfull registration prompt or something similar. Then redirect to login
        res.redirect('/login');
      });
    }
  });
});

/*Delete user*/

app.post('/delete', (req, res) => {
  const user = req.session.sessionUser;
  const password = req.body["pw"];

  userDB.get(`SELECT * FROM user WHERE username='${req.session.sessionUser}'`, (error, row) => {
    if (row != undefined) {
      const hash = row.password;
      bcrypt.compare(password, hash, function(error, isCorrect) {
        if (isCorrect) {
          req.session.sessionUser = false;
          console.log("Delete now", user, password);
          userDB.run(`DELETE FROM user WHERE username='${user}'`, (error) => {
            console.log("Callback from delete request");
            if (error) {
              console.log(error.message);
            }
            res.redirect('/home');
          });
        } else {
          res.render('error', {
            "msg": "Wrong password"
          });
        }
      });
    } else {
      res.render('error'), {
        "msg": "Row is undefined"
      };
    }
    console.log(req.session.sessionUser);
  });

});

/*Login*/

app.post('/login', function(req, res) {
  const user = req.body["name"];
  const password = req.body["pw"];
  userDB.get(`SELECT * FROM user WHERE username='${user}'`, (error, row) => {
    if (row != undefined) {
      const hash = row.password;
      bcrypt.compare(password, hash, function(error, isCorrect) {
        if (isCorrect) {
          req.session.sessionUser = user;
          res.render('success', {
            'user': user
          });
        } else {
          res.render('error', {
            "msg": "Wrong password"
          });
        }
      });
    } else {
      res.render('error', {
        "msg": "Name or password not found"
      });
    }
  });
});

/*Add item
https://www.npmjs.com/package/express-fileupload
*/

app.post("/addItem", function(req, res) {
  const item_name = req.body["item-name"];
  const item_price = req.body["item-price"];
  const item_quantity = req.body["item-quantity"];

  productDB.all(`SELECT * FROM products WHERE productname='${item_name}'`, function(error, rows) {
    if (error) {
      console.log(error.message);
      res.render("error", {
        "msg": error.message
      });
    }
    if (rows.length != 0) {
      res.render("error", {
        "msg": "Product already exists."
      });
    } else {
      productDB.run(`INSERT INTO products (productname, price, quantity) VALUES ('${item_name}', '${item_price}', ${item_quantity})`, (error) => {
        if (error) {
          console.log(error.message);
          res.render("error", {
            "msg": error.message
          });
        } else {
          res.redirect("home");
        }
      });
    }
  });
});

app.post("/changeItem", function(req, res) {
  const item_name = req.body["item-name"];
  const item_price = req.body["item-price"];
  const item_quantity = req.body["item-quantity"];

  // not yet tested

  productDB.get(`SELECT id_product FROM products WHERE productname='${item_name}'`, function(error, id) {
    if (error) {
      console.log(error.message);
      res.render("error", {
        "msg": error.message
      });
    }
    console.log("Product ID: " + id);
    if (id != null) {
      if (item_price != "") {
        productDB.run(`UPDATE products SET price='${item_price}' WHERE id_product='${id}'`, (error) => {
          if (error) {
            console.log(error.message);
            res.render("error", {
              "msg": error.message
            });
          }
        });
      }
      if (item_quantity != "") {
        productDB.run(`UPDATE products SET quantity='${item_quantity}' WHERE id_product='${id}'`, (error) => {
          if (error) {
            console.log(error.message);
            res.render("error", {
              "msg": error.message
            });
          }
        });
      }
      res.redirect("home");
    } else {
      res.render("error", {
        "msg": "Product not found."
      });
    }
  });
});

app.post("/addToCart", function(req, res) {

  var id = req.body["id"];

  productDB.get(`SELECT * FROM products WHERE id_product ='${id}'`, function(error, row) {

    if (error) {
      console.log(error.message);
      res.render("error", {
        "msg": error.message
      });
    }
    var found = false;
    for(var i = 0; i < req.session.cart.length; i++) {
      if(req.session.cart[i].productname == row.productname) {
        req.session.cart[i].quantity++;
        found=true;
      }
    }
    if(!found) {
        req.session.cart.push({productname:row.productname, price:row.price, quantity:1});
    }
  });

  req.session.save(function(error) {
    if (error) {
      console.log(error.message);
      res.render("error", {
        "msg": error.message
      });
    }
    res.redirect("home");
  });

});
