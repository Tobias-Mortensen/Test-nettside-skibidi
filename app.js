const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Konfigurer session
app.use(
    session({
        secret: "hemmeligNøkkel",
        resave: false,
        saveUninitialized: true,
    })
);

// Middleware for å sjekke pålogging
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
}

// Ruter legges under her
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "login.html"));
});

app.get("/ny-bruker", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "ny-bruker.html"));
});

app.get("/ansatte", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "ansatte.html"));
});

app.get("/hvem-er-vi", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "hvem-er-vi.html"));
});

// Denne ruten skal være beskyttet
app.get("/kunder", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "kunder.html"));
});

// Denne ruten skal være beskyttet
app.get("/nexachat", isAuthenticated,  (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "nexachat.html"));
});

app.get("/support", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "støtte.html"));
});

app.get("/skibbidi", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "view", "skibbidi.html"));
});


app.post("/ny-bruker", async (req, res) => {
    const { brukernavn, epost, født, passord } = req.body;
    const hashedPassword = await bcrypt.hash(passord, 10);
    const newUser = { brukernavn, epost, født, passord: hashedPassword };

    fs.readFile("bruker.json", "utf8", (err, fileData) => {
        const jsonData = fileData ? JSON.parse(fileData) : [];

        jsonData.push(newUser);

        fs.writeFile("bruker.json", JSON.stringify(jsonData, null, 2), (writeErr) => {
            res.redirect("/");
        });
    });
});

app.post("/login", (req, res) => {
    const { brukernavn, passord } = req.body;

    fs.readFile("bruker.json", "utf8", async (err, fileData) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal server error");
        }

        const users = JSON.parse(fileData);
        const user = users.find((u) => u.brukernavn === brukernavn);

        if (user && (await bcrypt.compare(passord, user.passord))) {
            req.session.user = user;
            res.redirect("/");
        } else {
            res.redirect("/");
        }
    });
});

// Post-rute for chat
app.post("/nexachat", (req, res) => {
    const { kommentar } = req.body;
    const user = req.session.user;
    const newComment = { 
        user: user.brukernavn,
        kommentar,
    };
    fs.readFile("kommentar.json", "utf8", (err, fileData) => {
        const comments = fileData ? JSON.parse(fileData) : [];
        comments.push(newComment);
        fs.writeFile("kommentar.json", JSON.stringify(comments, null, 2), (writeErr) => {
            res.redirect("/nexachat");
        });
    });
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// Api for å hente kommentarer fra json-filen
app.get("/kommentarer", (req, res) => {
fs.readFile("kommentar.json", "utf8", (err, fileData) => {
        const comments = JSON.parse(fileData);
        res.json(comments);
    });
});

async function fetchComments() {
 const response = await fetch("/kommentarer");
 const comments = await response.json();
 const commentsDiv = document.getElementById("kommentar");
 commentsDiv.innerHTML = "";
 comments.forEach((comment) => {
     const kommentar = document.createElement("div");
     kommentar.className = "kommentar-wrapper";
     const nameElement = document.createElement("p");
     nameElement.className = "brukernavn";
     const commentElement = document.createElement("p");
     commentElement.className = "kommentar";
     kommentar.appendChild(nameElement);
     kommentar.appendChild(commentElement);
     commentsDiv.appendChild(kommentar);

     nameElement.textContent = comment.user;
     commentElement.textContent = comment.kommentar;
 });
}

// Kjører serveren her
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


