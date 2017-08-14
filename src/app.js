const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const express = require('express');
let bodyParser = require('body-parser');
let session = require('express-session');

let db = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5000/blog_app`);

let app = express();

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname + '/../public'))

app.set('views', './views');
app.set('view engine', 'pug');

app.use(session({
	secret: 'issa secret',
	resave: true,
	saveUninitialized: true
}));

//modeling
const User = db.define('users', {
    username: {
        type: Sequelize.STRING,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
    }
}, {
    timestamps: false
})

const Post = db.define('posts', {
    title: {
        type: Sequelize.STRING
    },
    message: {
        type: Sequelize.STRING
    },
    userId: {
      type: Sequelize.INTEGER
    }
}, {
    timestamps: false
})

const Comment = db.define('comments', {
    comment: {
        type: Sequelize.STRING
    },
  }, {
    timestamps: false
})

//Establishing relationships between models
User.hasMany(Post);
User.hasMany(Comment);
Post.belongsTo(User);
Post.hasMany(Comment);
Comment.belongsTo(User);
Comment.belongsTo(Post);

//routing
app.get('/', (request, response)=>{
	response.render('index', {
		message: request.query.message,
		user: request.session.user
	});
});

app.post('/signup', (req, res) => {
  var password = req.body.sgpassword
  bcrypt.hash(password, 8, (err, hash) => { //created hash for password security
      if (err) throw err;
      User.create({
          username: req.body.sgusername,
          email: req.body.sgemail,
          password: hash
      })
          .then((user) => {
              console.log("User create promise returned success!")
              req.session.user = user;
              res.redirect('/profile');
              console.log('do i make it here?')
          })
          .catch((error) => {
              console.error(error)
          })
  });
});


app.post('/login', function (request, response) {
  if(request.body.email.length === 0) {
    response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
    return;
  }

  if (request.body.password.length === 0) {
    response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
    return;
  }
  var email = request.body.email
  var password = request.body.password

  console.log(password);

  User.findOne({
          where: {
              email: email
          }
      })
      .then((user) => {
        console.log(user);
        console.log(user.email);
        bcrypt.compare(password, user.password, (err, data) => { //validates password
          if (err) throw err;
          if (user !== null && password === user.password) {
              request.session.user = user;
              response.redirect('/profile');
          } else {
              response.redirect('/?message=' + encodeURIComponent("Invalid email or password matey."));
          }
      })
      .catch(function(error) {
          console.error(error)
          response.redirect('/?message=' + encodeURIComponent("Aarrrggh! An Error has occurred. Please check the server."));
      })
    });    
});

//profile page where logged in user can create and see own posts
app.get('/profile', (req,res) =>{   
  var user = req.session.user
  Post.findAll({
    where:{
      userId: user.id
    },
    include: [{
          model: Comment, 
          as: 'comments'
          },{
            model: User,
            as: 'user'
          }]
      })
      .then((posts)=>{
    res.render('profile', {userInfo: user, posts:posts})
  })
});

//logout
app.get('/logout', (req,res)=>{
  req.session.destroy((error) => {
    if(error) {
      throw error;
    }
    res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
  })
})

// create new post on profile
app.post('/newPost', (req,res)=>{
  var user = req.session.user;
  console.log(user)
  User.findOne({
    where: {
      email: user.email
    }
  })
  .then((user) => {
    return user.createPost({
      title: req.body.title,
      message: req.body.message
    }).then(()=>{
      res.redirect('/profile');
    })
      
  })
  .catch((error) => {
        console.log('Scurvy! Error occured!', error);
        res.redirect('/?message=' + encodeURIComponent('Error has occurred. Please check the server.'));
    });
});

//View everybody's posts page
app.get('/viewall', (req, res) => {
  var user = req.session.user;
  if (user === undefined) {       //only accessible for logged in users
        res.redirect('/login?message=' + encodeURIComponent("Please log in to view all posts."));
    } else {
      User.findAll()      //find User and Post data for use in /viewall
      .then((users) => {
        Post.findAll({
          include: [{       //show posts including comments
            model: Comment,
            as: 'comments'
          }]
        })
      .then((posts) => {
          res.render('viewall', {
            posts: posts,
            users: users,
          })
      })
      })
    .catch((error) => {
      console.log('Oh noes! An error has occurred!', error);
      res.redirect('/?message=' + encodeURIComponent('Error has occurred. Please check the server.'));
    });
  }
});


//create dynamic route to pass specific post using req.params to pug
app.get('/specificpost/:postId', (req,res)=> {
  Post.findOne({
    where: {id :req.params.postId}    //finds specific post (select* from posts where id = :postId)
  })
  .then((post) => {
            console.log(post.id);
            console.log(post.title);
            console.log(post.message);
            res.render('specificpost', {specificpost: post});
        });
})


//search for specifc post (by title)
app.post('/search', (req, res) => {
  Post.findOne({
        where: { title: req.body.search }
    }).then((post) => {
            console.log(post.id);
            res.redirect(`/specificpost/${post.id}`)
        });
})

//Comment route
app.post('/comment', (req, res) => {
  var user = req.session.user;
  User.findOne({
    where: {
      email: user.email
    }
  })
  .then((user) => {
    return Comment.create({
        comment: req.body.comment,
        postId: req.body.postId,
        userId: user.id
      })
    .then(() => {
        res.redirect('/viewall');
      })
    })
  .catch((error) => {
      console.log('Oh noes! An error has occurred! Kill it with fire!', error);
      res.redirect('/?message=' + encodeURIComponent('Error has occurred. Please check the server.'));
  })
});

db.sync({force:false})

app.listen(3000, function() {
    console.log('Listening on port 3000');
});