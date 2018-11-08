// Datenbank initialisieren
const sqlite3 = require('sqlite3').verbose();
let userDB = new sqlite3.Database('user.db');
let productDB = new sqlite3.Database('product.db');

// Express.js Webserver
const express = require('express');
const app = express()

// Body-Parser: wertet POST-Formulare aus
const bodyParser= require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))

// EJS Template Engine
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

// Sessionvariablen
const session = require('express-session');
app.use(session({
	secret: 'example',
	resave: false,
	saveUninitialized: true
}));

// Passwort Verschlüsselung
const passwordHash = require('bcrypt');

//Include CSS and JS directories
app.use(express.static(__dirname + "/stylings"));
app.use(express.static(__dirname + "/js"));

// Webserver starten http://localhost:3000
app.listen(3000, function(){
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
	productDB.run('CREATE TABLE user (id_product INTEGER PRIMARY KEY AUTOINCREMENT, productname TEXT NOT NULL, price TEXT NOT NULL, quantity TEXT NOT NULL)');
});
*/

app.get("/home", function(req, res) {
  res.render("index");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/registration", function(req, res) {
  res.render("registration");
});

app.get("/checkout", function(req, res) {
  res.render("checkout");
});

app.get("/newproduct", function(req, res) {
  res.render("newproduct");
});

app.post("/navigation", function(req, res) {
	res.redirect(req.body["goTo"]);
});

/*Register user*/

app.post('/registration', (req, res) => {
	const newUser = req.body["user"];
	const newPswd1 = req.body["pw1"];
	const newPswd2 = req.body["pw2"];

	if (newUser in users || newPswd1 != newPswd2 || newUser == '' || newPswd1 == '' || newPswd2 == '') {
		// error
		// Hab erstmal das hier eingefügt... 
		// Kannst du natürlich noch schöner machen
		// Aber so ist erstmal eine Funktionalität vorhanden
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
			<form action="/regestration" method="GET">
					<button type="submit">Try again</button>
			</form>
		`);
		res.end();
	} else {
		db.run(`INSERT INTO users (userName, userPW) VALUES ('${newUser}', '${newPswd}')`, (error) => {
			if (error) {
				console.log(error.message);
			}
		});
		//show successfull registration prompt or something similar. Then redirect to login
		res.redirect('/login');
	}
});

/*Delete user*/

app.post('/delete', (req, res) => {
	const user = req.body["user"];

	userDB.run(`DELETE FROM user WHERE userName='${user}'`, (error) => {
			if (error){
					console.log(error.message);
			}
	});
	res.redirect('/login');
});

/*Login*/

app.post('/login', function (req, res) {
	const user = req.body["name"];
	const password = req.body["pw"];

	userDB.get(`SELECT * FROM user WHERE userName='${user}'`,(error,row)=>{
			if (row != undefined){
					if (password == row.password){
							res.render('success', { 'user': user });
					} else {
							res.render('error');
					}
			} else {
					res.render('error');
			}
	});
});
