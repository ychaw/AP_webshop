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
const session = require('express-session');
app.use(session({
  secret: 'example',
  resave: false,
  saveUninitialized: true,
  sessionUser: false,
  basket: [],
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
app.listen(3000, function () {
  console.log("listening on 3000");
});

// Websites
app.get("/", function (req, res) {
  res.redirect("home");
});

//DB erstellen, später auskommentieren
/*
app.get("/", (request,response) =>{
   userDB.run('CREATE TABLE user (id_user INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL)');
   productDB.run('CREATE TABLE products (id_product INTEGER PRIMARY KEY AUTOINCREMENT, productname TEXT NOT NULL, price TEXT NOT NULL, quantity TEXT NOT NULL)');
});
*/

app.get("/home", function (req, res) {
  const sql = 'SELECT * FROM products';

  //for testing, set to false if user view is needed
  req.session.isAdmin = true;

  productDB.all(sql, function (error, rows) {
    if (error) {
      console.log(error.message);
    } else {
      if (req.session.isAdmin) {
        res.render('indexAdmin', {
          'allItems': rows || [],
          'basket': req.session.basket || []
        });
      } else {
        res.render('index', {
          'allItems': rows || [],
          'basket': req.session.basket || []
        });
      }
    }
  })
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/registration", function (req, res) {
  res.render("registration");
});

app.get("/checkout", function (req, res) {
  res.render("checkout");
});

app.get("/newproduct", function (req, res) {
  res.render("newproduct");
});

app.get("/delete", function (req, res) {
  res.render("delete");
});

app.get("/logout", function (req, res) {
  sessionUser = false;
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
      bcrypt.hash(newPswd1, saltRounds, function (error, hash) {
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
  const user = sessionUser;
  const password = req.body["pw"];

  userDB.get(`SELECT * FROM user WHERE username='${sessionUser}'`, (error, row) => {
    if (row != undefined) {
      const hash = row.password;
      bcrypt.compare(password, hash, function (error, isCorrect) {
        if (isCorrect) {
          sessionUser = false;
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
    console.log(sessionUser);
  });

});

/*Login*/

app.post('/login', function (req, res) {
  const user = req.body["name"];
  const password = req.body["pw"];
  userDB.get(`SELECT * FROM user WHERE username='${user}'`, (error, row) => {
    if (row != undefined) {
      const hash = row.password;
      bcrypt.compare(password, hash, function (error, isCorrect) {
        if (isCorrect) {
          sessionUser = user;
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

app.post("/addItem", function (req, res) {
  const item_name = req.body["item-name"];
  const item_price = req.body["item-price"];
  const item_quantity = req.body["item-quantity"];

  productDB.run(`INSERT INTO products (productname, price, quantity) VALUES ('${item_name}', '${item_price}', ${item_quantity})`, (error) => {
    if (error) {
      console.log(error.message);
      res.render("error", {
        "msg": error.message
      });
    }
  });
});

app.post("/restockItem", function (req, res) {
  const item_name = req.body["item-name"];
  const item_price = req.body["item-price"];
  const item_quantity = req.body["item-quantity"];
});