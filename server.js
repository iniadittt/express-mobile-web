if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//////////////////////////   IMPORT LIBRARY   \\\\\\\\\\\\\\\\\\\\\\\\\\

const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const initializePassport = require('./passport-config')


//////////////////////////   USE LIBRARY   \\\\\\\\\\\\\\\\\\\\\\\\\\

const app = express()
const port = 3000
const users = []

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

//////////////////////////   APP SET   \\\\\\\\\\\\\\\\\\\\\\\\\\

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


//////////////////////////   USE MIDDLEWARE   \\\\\\\\\\\\\\\\\\\\\\\\\\

app.use('/assets', express.static('assets'))
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))


//////////////////////////   HTTP METHOD   \\\\\\\\\\\\\\\\\\\\\\\\\\

app.get('/', checkAuthenticated, (req, res) => {
    const semester = req.user.semester * 12.5
    res.render('index.ejs', { name: req.user.name, semester })
})

app.get('/chat', checkAuthenticated, (req, res) => {
    res.render('chat.ejs', {})
})

app.get('/notifikasi', checkAuthenticated, (req, res) => {
    res.render('notifikasi.ejs', {})
})

app.get('/akun', checkAuthenticated, checkAuthenticated, (req, res) => {
    res.render('akun.ejs', {})
})

app.get('/login', checkNotAuthenticated, async(req, res) => {
    const hashedPassword = await bcrypt.hash('admin', 10)
    users.push({
        id: Date.now().toString(),
        name: 'Administrator',
        email: 'admin@umc.ac.id',
        password: hashedPassword,
        semester: 8
    })
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/registrasi', checkNotAuthenticated, (req, res) => {
    res.render('registrasi.ejs')
})

app.post('/registrasi', checkNotAuthenticated, async(req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            semester: 1
        })
        res.redirect('/login')
    } catch {
        res.redirect('/registrasi')
    }
})

app.delete('/logout', (req, res) => {
    req.logOut({ keepSessionInfo: false },
        (error) => {
            if (error) console.log(error)
        })
    res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next()
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/')
    next()
}


//////////////////////////   RUN WEB SERVER   \\\\\\\\\\\\\\\\\\\\\\\\\\

app.listen(port, () => {
    console.log(`Server berjalan pada port ${port}`)
})