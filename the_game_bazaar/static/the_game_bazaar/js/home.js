//global variables
var user;

$().ready(function(){
    user = new User();
    //mostly just hides all the divs
    initialize();

    //adds click functions
    bind_divs();

});

/* INITIALIZE FUNCTION
 * mostly gonna be hiding a bunch of divs
 */
function initialize(){
    $('.sign-in').hide();
    $('#signed').hide();

    render_logged_in();
}

/* BINDING FUNCTIONS
 * mostly gonna be click stuff
 */
function bind_divs(){
    //toggles the sign in box
    $('#sign-in').click(function(){
        $('.sign-in').slideToggle(300);
    });

    //submits the sign in form
    $('.sign-in').submit(function(e){
        e.preventDefault();
        var username = $('.sign-in #username').val();
        var pass = $('.sign-in #password').val();
        user.login(username, pass, function(){
            // callback after logging in. If we've successfully logged in
            // we should change the user-corner to reflect that
            if (user.loggedin){
                $('.sign-in').slideToggle(300);
                render_logged_in();
            } else {
                console.log("not logged in");
                $('.sign-in p').remove();
                var error_msg = $('<p>incorrect username or password</p>').hide();
                $('.sign-in').append(error_msg);
                error_msg.slideToggle(300);
            }
        });
    });

    //bind the logout button
    $('#navbar-logout').click(function(){
        user.logout(function(){
            render_logged_in(true);
        });
    })
}

function render_logged_in(from_logged_in){
    $('#not-signed').hide();
    $('.login_required').hide();
    if (from_logged_in){
        $('.login_required').show();  
    } 

    if(user.loggedin){
        $('.login_required').slideToggle(300);
    } else {
        if (from_logged_in){
            $('.login_required').slideToggle(300);
        }
        $('#not-signed').slideToggle(300);
    }
}

/* User object */
function User(){
	//instance vars
	this.loggedin = false;
	this.username = '';
	this.gravatar_url = '';

	//methods
	this.getGravatar = getGravatar;
	this.login = login;
	this.logout = logout;
    this.checkLoggedIn = checkLoggedIn;

    //stuff to do when you initialize
    this.checkLoggedIn();

    function checkLoggedIn(){
        //fills out stuff if you're already logged in
        //also returns whether or not you're logged in
        if (this.loggedin){
            return true;
        } else {
            var result;
            $.ajax({
                type: "GET",
                url: "/auth/check/",
                headers: {
                    "X-CSRFToken": $.cookie('csrftoken'),
                },
                async: false,
                success: function(data){
                    if (data['success'] === true){
                        this.loggedin = true;
                        this.username = data['username'];
                        this.gravatar_url = data['gravatar'];
                        result = true;
                    } else {
                        result = false;
                    }
                }.bind(this),
            });
            return result;
        }
    }

	function getGravatar(){
		return this.gravatar_url;
	}

	function login(username, password, callback){
		$.ajax({
            type: "POST",
            url: "/auth/login/",
            async: false,
            data: {
                "username":username,
                "password":password,
            },
            headers: {
                "X-CSRFToken": $.cookie('csrftoken'),
            },
            success: function (data){
                if(data['success'] === true){
                    this.loggedin = true;
                    this.username = username;
                    //show that you're logged in
                } else {
                    //show an error
                }
                callback();
            }.bind(this),
        });
	}

	function logout(callback){
        console.log('hello world');
        $.ajax({
            type: "POST",
            url: "/auth/logout/",
            async: false,
            headers: {
                "X-CSRFToken": $.cookie('csrftoken'),
            },
            success: function (data){
                this.loggedin = false;
                this.username = '';
                this.gravatar_url = '';
                callback();
            }.bind(this),
        })
	}
}