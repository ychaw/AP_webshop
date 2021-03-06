// Init database
const sqlite3 = require('sqlite3').verbose();
let userDB = new sqlite3.Database('user.db');
let productDB = new sqlite3.Database('product.db');

// Express.js Webserver
const express = require('express');
const app = express()

// Body-Parser
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
  extended: true
}))

// EJS Template Engine
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

// sessionvariable
var session = require('express-session');
var FileStore = require('session-file-store')(session);

app.use(session({
  store: new FileStore,
  secret: 'example',
  resave: false,
  saveUninitialized: true,
  sessionUser: false,
  cart: false,
  isAdmin: false
}));

// password hash
const bcrypt = require('bcrypt');
const saltRounds = 10;

//file upload
const fileUpload = require('express-fileupload');

//Include CSS, images and icon directories
app.use(express.static(__dirname + "/stylings"));
app.use(express.static(__dirname + "/img"));
app.use(express.static(__dirname + "/icons"));
app.use(fileUpload());

// start server http://localhost:3000
app.listen(3000, function() {
  console.log("listening on 3000");
});

//DB erstellen, später auskommentieren
/*
app.get("/", (request,response) =>{
   userDB.run('CREATE TABLE user (id_user INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL)');
   productDB.run('CREATE TABLE products (id_product INTEGER PRIMARY KEY AUTOINCREMENT, productname TEXT NOT NULL, price INTEGER NOT NULL, quantity INTEGER NOT NULL)');
});
*/

// Websites
app.get("/", function(req, res) {
  res.redirect("home");
});

app.get("/home", function(req, res) {

  const sql = 'SELECT * FROM products';

  if (!req.session.cart) {
    req.session.cart = [];
  } else {
    //check if cart contains negative quantities
    req.session.cart.forEach(function(item) {
      if (item.quantity < 1) {
        var index = req.session.cart.indexOf(item);
        if (index > -1) {
          req.session.cart.splice(index, 1);
        }
      }
    });
  }

  if (req.session.sessionUser == "admin") {
    req.session.isAdmin = true;
  } else {
    req.session.isAdmin = false;
  }

  productDB.all(sql, function(error, rows) {
    if (error) {
      res.render('error', {
        "msg": "Something went wrong."
      });
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
  res.render("checkout", {
    "cart": req.session.cart
  });
});

//account deletion
app.get("/delete", function(req, res) {
  res.render("delete");
});

app.get("/logout", function(req, res) {
  req.session.sessionUser = false;
  isAdmin = false;
  res.render("logout");
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
          if (req.session.sessionUser == "admin") {
            req.session.isAdmin = true;
          }
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

/*Register user*/

app.post('/registration', (req, res) => {
  const newUser = req.body["name"];
  const newPswd1 = req.body["pw1"];
  const newPswd2 = req.body["pw2"];
  var hashedPswd = false;

  //validate input
  if (newPswd1 != newPswd2) {
    res.render("error", {
      "msg": "Passwords are not the same."
    });
  } else if (newUser == '') {
    res.render("error", {
      "msg": "Username is empty."
    });
  } else if (newPswd1 == '') {
    res.render("error", {
      "msg": "First Password is empty."
    });
  } else if (newPswd2 == '') {
    res.render("error", {
      "msg": "Second Password is empty."
    });
  } else {
    userDB.get(`SELECT * FROM user WHERE username='${newUser}'`, (error, row) => {
      if (error) {
        res.render("error", {
          "msg": error.message
        });
      }
      if (row != undefined) {
        res.render("error", {
          "msg": "Username is already taken."
        });
      } else {
        bcrypt.hash(newPswd1, saltRounds, function(error, hash) {
          if (error) {
            res.render("error", {
              "msg": error.message
            });
          }
          hashedPswd = hash;
          userDB.run(`INSERT INTO user (username, password) VALUES ('${newUser}', '${hashedPswd}')`, (error) => {
            if (error) {
              res.render("error", {
                "msg": error.message
              });
            }
          });
          res.redirect('/login');
        });
      }
    });
  }
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
          userDB.run(`DELETE FROM user WHERE username='${user}'`, (error) => {
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
        "msg": "Something went wrong."
      };
    }
  });

});

app.post("/addItem", function(req, res) {
  const item_name = req.body["item-name"];
  const item_price = req.body["item-price"];
  const item_quantity = req.body["item-quantity"];
  var item_picture = req.files.itemPicture;

  if (isNaN(item_price) || isNaN(item_quantity)) {
    res.render("error", {
      "msg": "Enter numbers!."
    });
  } else {
    productDB.all(`SELECT * FROM products WHERE productname='${item_name}'`, function(error, rows) {
      if (error) {
        res.render("error", {
          "msg": error.message
        });
      } else if (rows.length != 0) {
        res.render("error", {
          "msg": "Product already exists."
        });
      } else {
        productDB.run(`INSERT INTO products (productname, price, quantity) VALUES ('${item_name}', '${item_price}', ${item_quantity})`, (error) => {
          if (error) {
            res.render("error", {
              "msg": error.message
            });
          } else {

            //rename image and move it into the right directory
            item_picture.name = item_name + ".png";
            item_picture.mv('./img/' + item_picture.name, function(error) {
              if (error) {
                res.render("error", {
                  "msg": error.message
                });
              } else {
                res.redirect("home");
              }
            });
          }
        });
      }
    });
  }
});

app.post("/changeItem", function(req, res) {
  const item_name = req.body["item-name"];
  const item_price = req.body["item-price"];
  const item_quantity = req.body["item-quantity"];

  if (isNaN(item_price) || isNaN(item_quantity)) {
    res.render("error", {
      "msg": "Enter numbers!."
    });
  } else {
    productDB.get(`SELECT id_product FROM products WHERE productname='${item_name}'`, function(error, id) {
      if (error) {
        res.render("error", {
          "msg": error.message
        });
      } else if (id != null) {
        if (item_price != "") {
          productDB.run(`UPDATE products SET price='${item_price}' WHERE id_product='${id.id_product}'`, (error) => {
            if (error) {
              res.render("error", {
                "msg": error.message
              });
            }
          });
        } else if (item_quantity != "") {
          productDB.run(`UPDATE products SET quantity='${item_quantity}' WHERE id_product='${id.id_product}'`, (error) => {
            if (error) {
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
  }
});

app.post("/addToCart", function(req, res) {

  var id = req.body["id"];

  productDB.get(`SELECT * FROM products WHERE id_product ='${id}'`, function(error, row) {

    if (error) {
      res.render("error", {
        "msg": error.message
      });
    }
    var found = false;
    for (var i = 0; i < req.session.cart.length; i++) {
      if (req.session.cart[i].productname == row.productname) {
        req.session.cart[i].quantity++;
        found = true;
      }
    }
    if (!found) {
      req.session.cart.push({
        productname: row.productname,
        price: row.price,
        quantity: 1
      });
    }
  });

  //save session to avoid preemptive flush of header
  req.session.save(function(error) {
    if (error) {
      res.render("error", {
        "msg": error.message
      });
    } else {
      res.redirect("home");
    }
  });
});

app.post("/checkout", function(req, res) {
  if (req.session.sessionUser) {
    var query = `SELECT * FROM products`;

    productDB.all(query, function(error, rows) {
      if (error) {
        res.render("error", {
          "msg": error.message
        });
      } else {

        //this is quite inefficient, but async issues forced my hand
        //keep the database small!

        rows.forEach(function(row) {
          req.session.cart.forEach(function(item) {
            if (row.productname == item.productname) {
              var currentProductName = item.productname;
              var currentProductQuantity = item.quantity;
              var quantityAfterPurchase = row.quantity - currentProductQuantity;

              productDB.run(`UPDATE products SET quantity='${quantityAfterPurchase}' WHERE productname='${currentProductName}'`);
            }
          });
        });
      }
      req.session.cart = [];
      req.session.save(function(error) {
        if (error) {
          res.render("error", {
            "msg": error.message
          });
        }
        res.redirect("home");
      });
    });
  } else {
    res.render("error", {
      "msg": "Please log in before checking out."
    });
  }
});

app.post("/removeFromCart", function(req, res) {
  var removeProductIndex = req.body["index"];

  //try catch to protect from very fast clicks
  try {
    req.session.cart[removeProductIndex].quantity--;
    if (req.session.cart[removeProductIndex].quantity < 1) {
      if (removeProductIndex == 0) {
        req.session.cart.shift();
      } else if (removeProductIndex == req.session.cart.length) {
        req.session.cart.pop();
      } else {
        for (var i = removeProductIndex + 1; i < req.session.cart.length; i++) {
          req.session.cart[i - 1] = req.session.cart[i];
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    //save session to avoid preemptive flush of header
    req.session.save(function(error) {
      if (error) {
        res.render("error", {
          "msg": error.message
        });
      } else {
        res.redirect("home");
      }
    });
  }
});

app.post("/clearCart", function(req, res) {
  req.session.cart = [];
  req.session.save(function(error) {
    if (error) {
      res.render("error", {
        "msg": error.message
      });
    } else {
      res.redirect("home");
    }
  });
});

app.post("/searchItem", function(req, res) {

  if (req.body["articelName"] == "") {
    res.redirect("/home");
  }

  const sql = 'SELECT * FROM products WHERE productname="' + req.body["articelName"] + "\"";

  productDB.all(sql, function(error, rows) {
    if (error) {
      console.log(error.message);
      res.redirect("/home");
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

app.post("/deleteItem", function(req, res) {
  const sql = 'DELETE FROM products WHERE productname="' + req.body["deleteProduct"] + "\"";

  productDB.run(sql, function(error, rows) {
    if (error) {
      res.render("error", {
        "msg": error.message
      });
    } else {
      res.redirect("/home");
    }
  });
});