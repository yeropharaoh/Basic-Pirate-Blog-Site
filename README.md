A. your tables: what columns will they have? How will they connect to one another?

	3 tables:
	-Users. 
		Columns: id, username, email, password. 
	-Posts.
		 Columns: id, author, category, title, message. 
	-Comments.
		Columns: id, author, comment, userId, postId
	 

B. make a diagram showing the relationships between tables.
<img src="/public/images/diagram.png"/> 

C. your routes: what routes should you have? What should each route do?

‘Index’ page: allows the user to log in and/or sign up to website.
Buttons: 
‘signup’
‘login’
‘logout’

‘Profile’ page: is accessed once user had logged in.
	User can log out (redirected to index)
	User can ‘create post’ with a title and message.
User can view their created posts and comment on them if they like. 
	Buttons: 
‘see me posts’ button to see own posts
‘see everybody’s posts’

‘newPost’ post route: allows user to create post (title,message) on profile page
		          Comment box- write comment.

‘viewall’ page: displays all users’s posts including your own.
Search button to search for any post’s title and return it on the specificpost page.
	              
‘search’ route: allows user to search for a specific post, by title

‘specificpost/:postId’ dynamic route: passes specific post using req.params to pug to be displayed on the ‘viewall’ page

‘specific post’ page:  specific post that has been clicked on is shown.
         Comments are displayed under each post. P
         post comment on a post.

‘Signup’ route: creates and adds new user to database. 

‘Logout’ route: destroys the session and returns user to homepage

‘Comment’ route: user can add a comment to a post, and can see the comments on the ‘viewall’ page