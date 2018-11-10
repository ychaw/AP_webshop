// Datenbank initialisieren
const sqlite3 = require('sqlite3').verbose();
let userDB = new sqlite3.Database('user.db');
let productDB = new sqlite3.Database('product.db');

// Express.js Webserver
const express = require('express');
const app = express()

// Body-Parser: wertet POST-Formulare aus
const bodyParser = require('body-parser')
<<<<<<< HEAD
app.use(bodyParser.urlencoded({
  extended: true
}))
=======
app.use(bodyParser.urlencoded({ extended: true }))
>>>>>>> e29455e5b3c33f2edf92fc811681d2144cda4761

// EJS Template Engine
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

// Sessionvariablen
const session = require('express-session');
app.use(session({
  secret: 'example',
  resave: false,
  saveUninitialized: true,
  sessionUser: false
}));

// Passwort Verschlüsselung
const bcrypt = require('bcrypt');
const saltRounds = 10;

//Include CSS and JS directories
app.use(express.static(__dirname + "/stylings"));
app.use(express.static(__dirname + "/js"));

// Webserver starten http://localhost:3000
<<<<<<< HEAD
app.listen(3000, function() {
  console.log("listening on 3000");
=======
app.listen(3000, function () {
	console.log("listening on 3000");
>>>>>>> e29455e5b3c33f2edf92fc811681d2144cda4761
});

// Websites
app.get("/", function (req, res) {
	res.redirect("home");
});

//DB erstellen, später auskommentieren
/*
app.get("/", (request,response) =>{
   userDB.run('CREATE TABLE user (id_user INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL)');
   productDB.run('CREATE TABLE user (id_product INTEGER PRIMARY KEY AUTOINCREMENT, productname TEXT NOT NULL, price TEXT NOT NULL, quantity TEXT NOT NULL)');
});
*/

app.get("/home", function (req, res) {
	res.render("index");
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

<<<<<<< HEAD
app.get("/delete", function(req, res) {
  res.render("delete");
});

app.get("/logout", function(req, res) {
  sessionUser = false;
  res.render("logout");
=======
app.get("/delete", function (req, res) {
	res.render("delete");
});

app.get("/logout", function (req, res) {
	sessionUser = false;
	res.render("logout");
>>>>>>> e29455e5b3c33f2edf92fc811681d2144cda4761
});


/*Register user*/

app.post('/registration', (req, res) => {
<<<<<<< HEAD
  const newUser = req.body["name"];
  const newPswd1 = req.body["pw1"];
  const newPswd2 = req.body["pw2"];
  var hashedPswd = false;
  var nameTaken = false;

  userDB.get(`SELECT * FROM user WHERE username='${newUser}'`, (error, row) => {
    if (row != undefined) {
      nameTaken = true;
    }
    if (error) {
      console.log(error.message);
    }
    if (nameTaken || newPswd1 != newPswd2 || newUser == '' || newPswd1 == '' || newPswd2 == '') {
      // error
      // Hab erstmal das hier eingefügt...
      // Kannst du natürlich noch schöner machen
      // Aber so ist erstmal eine Funktionalität vorhanden
      if (nameTaken) {
        res.render("error", {
          "msg": "Username is already taken."
        });
      }
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

=======
	const newUser = req.body["name"];
	const newPswd1 = req.body["pw1"];
	const newPswd2 = req.body["pw2"];
	let users = [];

	userDB.all(`SELECT username FROM user`, (error, row) => {
		if (row != undefined) {
			users = row.map(getUsername);
			// users is full
		} else {
			res.render('error'), { "msg": "Row is undefined" };
		}
	});
	// users is still empty, needs fix

	console.log(users);
	// still testing if newUser is in userDB
	if (newUser in users || newPswd1 != newPswd2 || newUser == '' || newPswd1 == '' || newPswd2 == '') {
		// still testing errorCode functionality
		errorCode (users, newUser, newPswd1, newPswd2);
	} else {
		userDB.run(`INSERT INTO user (username, password) VALUES ('${newUser}', '${newPswd2}')`, (error) => {
			if (error) {
				console.log(error.message);
				res.render("error", { "msg": error.message });
			}
		});
		//show successfull registration prompt or something similar. Then redirect to login
		res.redirect('/login');
	}
	res.redirect('/login');
>>>>>>> e29455e5b3c33f2edf92fc811681d2144cda4761
});

/*Delete user*/

app.post('/delete', (req, res) => {
<<<<<<< HEAD
  const user = sessionUser;
  const password = req.body["pw"];

  userDB.get(`SELECT * FROM user WHERE username='${sessionUser}'`, (error, row) => {
    if (row != undefined) {
      const hash = row.password;
      bcrypt.compare(password, hash, function(error, isCorrect) {
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
=======
	const user = sessionUser;
	const password = req.body["pw"];

	userDB.get(`SELECT * FROM user WHERE username='${sessionUser}'`, (error, row) => {
		if (row != undefined) {
			if (password == row.password) {
				sessionUser = false;

			} else {
				res.render('error', { "msg": "Wrong password" });
			}
		} else {
			res.render('error'), { "msg": "Row is undefined" };
		}
		if (!sessionUser) {
			console.log("Delete now", user, password);
			userDB.run(`DELETE FROM user WHERE username='${user}'`, (error) => {
				console.log("Callback from delete request");
				if (error) {
					console.log(error.message);
				}
				res.redirect('/home');
			});
		} else {
			res.render("error", { "msg": "Logging out failed" });
		}

		console.log(sessionUser);
	});

>>>>>>> e29455e5b3c33f2edf92fc811681d2144cda4761
});

/*Login*/

<<<<<<< HEAD
app.post('/login', function(req, res) {
  const user = req.body["name"];
  const password = req.body["pw"];

  userDB.get(`SELECT * FROM user WHERE username='${user}'`, (error, row) => {

    if (row != undefined) {
      const hash = row.password;
      bcrypt.compare(password, hash, function(error, isCorrect) {

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
=======
app.post('/login', function (req, res) {
	const user = req.body["name"];
	const password = req.body["pw"];

	userDB.get(`SELECT * FROM user WHERE username='${user}'`, (error, row) => {
		if (row != undefined) {
			if (password == row.password) {
				sessionUser = user;
				res.render('success', { 'user': user });
			} else {
				res.render('error', { "msg": "Wrong password" });
			}
		} else {
			res.render('error', { "msg": "No password found" });
		}
	});
});







function getUsername(name) {
	return name.username;
}

function errorCode (users, newUser, newPswd1, newPswd2) {
	if (newUser in users) {
		res.write("<html><body><li>Username is already taken.</li></body></html>");
	}
	if (newPswd1 != newPswd2) {
		res.write("<html><body><li>Passwords are not the same.</li></body></html>");
	}
	if (newUser == '') {
		res.write("<html><body><li>Username is empty.</li></body></html>");
	}
	if (newPswd1 == '') {
		res.write("<html><body><li>First Password is empty.</li></body></html>");
	}
	if (newPswd2 == '') {
		res.write("<html><body><li>Second Password is empty.</li></body></html>");
	}
	res.write(`
		<br>
		<form action="/registration" method="GET">
				<button type="submit">Try again</button>
		</form>
	`);
	res.end();
}
>>>>>>> e29455e5b3c33f2edf92fc811681d2144cda4761
