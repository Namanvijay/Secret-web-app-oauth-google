//jshint esversion:6
const express=require('express');
const bodyparser=require('body-parser');
const ejs=require('ejs');
const flash = require('connect-flash');
const mongoose=require('mongoose');
const session = require('express-session')
const passport=require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');
require('dotenv').config();
const passportLocal=require('passport-local-mongoose');
const app=express();






app.set('view engine','ejs');
app.use(flash());



app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(__dirname+'public'));
app.use(session({
    secret: 'hello',
    resave: false,
    saveUninitialized: false
    
  }));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/users",{useUnifiedTopology: true,useNewUrlParser:true});
mongoose.set("useCreateIndex",true);

const userschema=new mongoose.Schema(
{
    email:String,
    password:String,
    googleId:String,
    secrets:String

});
userschema.plugin(passportLocal);
userschema.plugin(findOrCreate);
const User=new mongoose.model("User",userschema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

console.log(process.env.CLIENT_ID);
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/',function(req,res)
{
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
   
res.redirect('/secrets');
});
app.get('/login',function(req,res)
{
    res.render("login");
});
app.get('/register',function(req,res)
{
    res.render("register");
});
app.get('/submit',function(req,res)
{

    if(req.isAuthenticated())
    {
        res.render('submit');
    }
    else
    res.redirect('/login');

});
app.post('/submit',function(req,res)
{
    const presentuser=req.user;
   
    User.findById(presentuser.id,function(err,founduser)
    {
        if(err)
        console.log(err);
        else
        founduser.secrets=req.body.secret;
        founduser.save(function(err)
        {
            if(err)
            console.log(err);
            else
            res.redirect('/secrets');
        });
    });

});
app.get('/secrets',function(req,res)
{
    User.find({'secrets':{$ne:null}},function(err,founduser)
    {
        if(err)
        console.log(err);
        else
        {
            if(founduser)
            {
                console.log(founduser);
                res.render('secrets',{users:founduser});

            }
           

        }
       
    });
    
    
});
app.post('/register',function(req,res)
{
    
    User.register({username:req.body.username},req.body.password,function(err,user)
    {
       
        if(err)
        {
           
            console.log(err);
            res.redirect('/register');
         
        }
        else
        {
          
            passport.authenticate("local")(req,res,function()
            {
              res.redirect("/secrets");
            });
        }
    });
   
});
// app.post('/login',function(req,res)
// {
//     const user=new User(
//         {
//             username:req.body.username,
//             password:req.body.password
//         }
//     );
//     req.login(user,function(err)
//     {
//         if(err)
//         {
//             console.log(err);
//             res.redirect('/login');

//         }
       
//         else
//         passport.authenticate('local')(req,res,function()
//         {
//             res.redirect('/secrets');
//         })
//     })
    
// });
app.get('/logout',function(req,res)
{
    req.logout();
    res.redirect("/");
});
app.post('/login',
  passport.authenticate('local', { successRedirect: '/secrets',
                                   failureRedirect: '/login' ,
                              
                                }));



app.listen('5000',function()
{
    console.log("Server is running on port 5000");

});


