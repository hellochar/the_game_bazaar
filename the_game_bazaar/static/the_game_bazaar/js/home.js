//global variables
var user;

/* this holds a bunch of 'pages'
 * associative array keyed by the page to a function
 * that returns a page object.
 *
 * 'logo' and 'title' is special 
 * logo is placed next to navigation when not on title
 *
 * TEMPLATE SYSTEM
 * --So you want to add a page--
 * create a template by following the template examples
 *      necessary lines are:
            var pg = new page();
            pg.binding = template_binding;
            pg.dom_html = '<html>blah blah</html>'
            return pg;
        template_bindings is a function to be run after the page changes
        that way you can do whatever javascriptiness after the dom has changed
 * Note: prefix your function names by template, for sanity
 * add your template to templates object, keyed by the page name
        don't overlap names
    when you want to change a page, just call change_page('name_of_key')
 */
var templates = new Object();
templates.current_page = '';
templates.from_title = false;
templates['logo'] = template_logo();
templates['title'] = template_title();
templates['register'] = template_register();
templates['about'] = template_about();
templates['play'] = template_play();
templates['edit'] = template_edit();
templates['profile'] = template_profile();
templates['history'] = template_history();
templates['clan'] = template_clan();
templates['pivotal'] = template_pivotal();

$().ready(function(){

    //create a new user
    user = new User();

    //mostly just hides all the divs
    initialize();

    //adds click functions
    bind_divs();

    //look at the anchor and change page accordingly
    var hash = window.location.hash.replace('#', '');
    if (hash !== ''){
        change_page(templates, hash, false, true);
    } else {
        change_page(templates, 'title', false, false);
    }
});

function change_page(templates, page, force, change_hash){
    force = force || false;

    if (templates.current_page !== page || force){

        template_page = templates[page];
        //do some fancy animations
        $('#content').fadeToggle(300, function(){
            if(templates.current_page !== 'title'){
                $('#logo').html(templates['logo'].dom_html);
                $('#logo').fadeIn(300);
            } else {
                $('#logo').fadeOut(300);
            }

            $('#content').html(template_page.dom_html);
            if (template_page.binding !== null){
                template_page.binding();
            }
            $('#content').fadeToggle(300);
        });

        //update some state
        templates.current_page = page;
        if(change_hash){
            window.location.hash = '#'+page;   
        }
    }
}

/* INITIALIZE FUNCTION
 * mostly gonna be hiding a bunch of divs
 */
function initialize(){
    $('.sign-in').hide();
    $('#signed').hide();
    $('#signed #user-dropdown').hide();

    render_logged_in();
}

/* BINDING FUNCTIONS
 * mostly gonna be click stuff
 */
function bind_divs(){
    //toggles the sign in box
    $('#not-signed #sign-in').click(function(){
        $('.sign-in').slideToggle(300);
    });

    $('#not-signed #register').click(function(){
        change_page(templates, 'register', false, true);
    });

    //NAVIGATION BINDINGS
    $('.navigation #nav-home').click(function(){
        change_page(templates, 'title', false, true);
    });

    $('.navigation #nav-about').click(function(){
        change_page(templates, 'about', false, true);
    })

    $('.navigation #nav-pivotal').click(function(){
        change_page(templates, 'pivotal', false, true);
    });

    $('.navigation #nav-play').click(function(){
        change_page(templates, 'play', false, true);
    })

    $('.navigation #nav-edit').click(function(){
        change_page(templates, 'edit', false, true);
    })

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
                change_page(templates, 'play');
            } else {
                $('.sign-in p').remove();
                var error_msg = $('<p id="err">incorrect username or password</p>').hide();
                $('.sign-in').append(error_msg);
                error_msg.slideToggle(300);
            }
        });
    });

    //USER CORNER BINDINGS
    $('#signed #user-nav').click(function(){
        $('#signed #user-dropdown').slideToggle(300);
    });

    $('#signed #user-dropdown').click(function(){
        $('#signed #user-dropdown').slideToggle(300);
    })

    //DROPDOWN MENU BINDINGS
    $('#signed #user-dropdown #dropdown-profile').click(function(){
        change_page(templates, 'profile', false, true);
    })

    $('#signed #user-dropdown #dropdown-history').click(function(){
        change_page(templates, 'history', false, true);
    })

    $('#signed #user-dropdown #dropdown-clan').click(function(){
        change_page(templates, 'clan', false, true);
    })

    //bind the logout button
    $('#navbar-logout').click(function(){
        user.logout(function(){
            render_logged_in(true);
            change_page(templates, 'title', false, true);
        });
    })
}

/* RENDERS LOGGING IN/LOGGING OUT UI 
 * Called whenever a user logs out or logs in
 * Makes sure that UI that can only be showed when you're logged in is shown
 * and UI that shouldn't be shown when you're logged out is not shown
 * and etc...
 */
function render_logged_in(from_logged_in){
    $('.sign-in #err').remove();
    $('.sign-in input').val('');
    $('#not-signed').hide();
    $('.login_required').hide();
    if (from_logged_in){
        $('.login_required').show();  
    } 

    if(user.loggedin){
        //place in username
        $('#signed #user-nav #username').html(user.username);

        //place in clan name
        $('.clan-name').html(user.getFormattedClanName());

        //place in gravatar
        var gurl = user.getGravatar(40);
        $('#signed #user-nav #gravatar').html(gurl);

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
	this.gravatar_img = '';
    this.email = '';
    this.clan = '';

	//methods
	this.getGravatar = getGravatar;
    this.refreshGravatar = refreshGravatar;
	this.login = login;
	this.logout = logout;
    this.checkLoggedIn = checkLoggedIn;
    this.getFormattedClanName = getFormattedClanName;

    //stuff to do when you initialize
    this.checkLoggedIn();

    function getFormattedClanName(){
        if (this.clan !== null){
            return '['+this.clan+']';
        } else {
            return '';
        }
    }

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
                        this.gravatar_img = data['gravatar'];
                        this.email = data['email'];
                        this.clan = data['clan'];
                        result = true;
                    } else {
                        result = false;
                    }
                }.bind(this),
            });
            return result;
        }
    }

	function getGravatar(size){
        var g_url = this.gravatar_img.replace('?s=40', '?s='+size);
        return g_url;
	}

    function refreshGravatar(){
        g_url = '';
        $.ajax({
            type: "GET",
            url: "/ajax/gravatar/",
            async: false,
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                g_url = data;
            }
        });
        this.gravatar_img = g_url;
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
                    this.username = data['username'];
                    this.gravatar_img = data['gravatar'];
                    this.clan = data['clan'];
                    this.email = data['email'];
                    //show that you're logged in
                } else {
                    //show an error
                }
                callback();
            }.bind(this),
        });
	}

	function logout(callback){
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
                this.clan = '';
                this.email = '';
                callback();
            }.bind(this),
        })
	}
}

/* Utility function to print players */
function printPlayers(json_players){
    var html = '';
    for (var key in json_players){
        var player = json_players[key];
        if (player !== ""){
            html += json_players[key] + ', ';
        }
    }
    html = html.slice(0,-2);
    return html;
};
/**********************************************************
 * TEMPLATES
 * try to prepend the word 'template' onto the funciton so
 * there aren't name conflicts. Remember to return valid html
 *********************************************************/

function page(){
    this.binding = null;
    this.dom_html = '';
}

function template_title(){
    var pg = new page();
    pg.binding = null;
    pg.dom_html = '<div class="title"><h1>The Game Bazaar</h1></div>';
    return pg;
}

function template_logo(){
    var pg = new page();
    pg.binding = null;
    pg.dom_html = '<div class="logo"><h1>The Game Bazaar</h1></div>';
    return pg;
}

function template_register(){

    function template_bind(){
        $('#content #error').css({
            'margin': '10px',
            'background-color': 'rgb(168, 21, 45)',
            'text-align': 'center',
            '-moz-border-radius': '5px',
            'border-radius': '5px',
        });

        $('#register-form').submit(function (e){
            e.preventDefault();
            $.ajax({
                type: "POST",
                url: "/auth/register/",
                data: {
                    "username":$('#registerUsername').val(),
                    "password":$('#registerPassword').val(),
                    "email":$('#registerEmail').val()
                },
                headers: {
                    "X-CSRFToken": $.cookie('csrftoken')
                },
                success: function (data){
                    if (data.success === true) {
                        window.location.hash = '';
                        window.location.pathname = data.redirect_url;
                    } else {
                        $('#content #error').html(data.error);
                        $('#content #error').animate({
                            backgroundColor: 'rgb(255, 155, 155)',
                        }, 50, function(){
                            $('#content #error').animate({
                                backgroundColor: 'rgb(168, 21, 45)',
                            }, 300)
                        });
                    }
                }
            });
        });
    }

    var pg = new page();
    pg.binding = template_bind;
    pg.dom_html = '\
        <div id="error"></div>\
        <form class="form-horizontal" id="register-form">\
            <fieldset>\
                <div class="control-group">\
                    <label class="control-label" for="registerUsername">Username</label>\
                    <div class="controls">\
                        <input id="registerUsername" type="text" class="input-block-level input-large" placeholder="username">\
                    </div>\
                </div>\
                <div class="control-group">\
                    <label class="control-label" for="registerPassword">Password</label>\
                    <div class="controls">\
                        <input type="password" class="input-block-level input-large" placeholder="password" id="registerPassword">\
                    </div>\
                </div>\
                <div class="control-group">\
                    <label class="control-label" for="registerEmail">Email</label>\
                    <div class="controls">\
                        <input type="text" class="input-block-level input-large" placeholder="email" id="registerEmail">\
                    </div>\
                </div>\
                <div class="control-group">\
                    <div class="controls">\
                        <button class="btn btn-large btn-primary" type="submit">Sign Up</button>\
                    </div>\
                </div>\
            </fieldset>\
        </form>'

    return pg;
}

function template_edit(){
    function getMyMaps(){
        $.ajax({
            type: "GET",
            url: "/ajax/maps/",
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                var html = '';
                html += '\
                <table class="table table-striped">\
                    <thead><tr>\
                        <th>Map ID</th>\
                        <th>Map name</th>\
                        <th>Max Players</th>\
                        <th>Creator</th>\
                    </tr></thead>\
                    <tbody>';

                for (var i = 0; i < data.length; i++){
                    var map = data[i];
                    if (map.creator === user.username){
                        html += '\
                            <tr>\
                                <td>'+map.id+'</td>\
                                <td>'+map.name+'</td>\
                                <td>'+map.max_players+'</td>\
                                <td>'+map.creator+'</td>\
                                <td><a class="btn btn-warning" href="/editor/#'+map.id+'">Edit</a></td>\
                            </tr>';                 
                    }
                }
                html += '</tbody></tabl>';

                $('#content #my-maps').html(html);
            }
        });
    }

    function getAllMaps(){
        $.ajax({
            type: "GET",
            url: "/ajax/maps/",
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                var html = '';
                html += '\
                <table class="table table-striped">\
                    <thead><tr>\
                        <th>Map ID</th>\
                        <th>Map name</th>\
                        <th>Max Players</th>\
                        <th>Creator</th>\
                    </tr></thead>\
                    <tbody>';

                for (var i = 0; i < data.length; i++){
                    var map = data[i];
                    html += '\
                        <tr>\
                            <td>'+map.id+'</td>\
                            <td>'+map.name+'</td>\
                            <td>'+map.max_players+'</td>\
                            <td>'+map.creator+'</td>\
                            <td><a class="btn btn-warning" href="/editor/#'+map.id+'">Edit</a></td>\
                        </tr>';
                }

                html += '</tbody></tabl>';
                $('#content #all-maps').html(html);
            }
        });
    };

    function template_binding(){
        $('#content #my-maps').html(function(){
            return getMyMaps();
        });

        $('#content #all-maps').html(function(){
            return getAllMaps();
        });

        //css stuff
        $('.edit-table').css({
            backgroundColor: 'white',
        });
    }
    var pg = new page();
    pg.binding = template_binding;
    pg.dom_html = '\
        <div>\
            <h4>Create maps:</h4>\
            <a class="btn btn-large btn-success" href="/editor/">Create new map!</a>\
            <br />\
            <h4>Your Maps:</h4>\
            <div class="edit-table" id="my-maps"></div>\
            <br />\
            <h4>All Maps:</h4>\
            <div class="edit-table" id="all-maps"></div>\
        </div>';
    return pg;
}

function template_play(){

    function getLobbyTable(){
        $.ajax({
            type: "GET",
            url: "/ajax/lobby/",
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                var html = '';
                html += "<table class='table table-striped'>";
                html += "<thead><tr>";
                html += "<th>Game ID</th>";
                html += "<th>Map Name</th>";
                html += "<th>Players</th>";
                html += "<th></th>";
                html += "</tr></thead><tbody>";
                //iterator down data and get stuff
                for (var i = 0; i < data.length; i++){
                    var game = data[i];
                    html += "<tr>\
                                <td>"+game.id+"</td>\
                                <td>"+game.map_name+"</td>\
                                <td>"+printPlayers(game.players)+"</td>\
                                <td>\
                                    <a href='/game/"+game.id+"' class='btn'>Join</a>\
                                </td>\
                            </tr>";
                }
                //close table
                html += "</tbody></table>";
                $('#content #play-lobby .play-table').html(html);
            }
        });
    };

    function getHostTable(){
        $.ajax({
            type: "GET",
            url: "/ajax/maps/",
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                var html = '';
                html += "<table class='table table-striped'>\
                            <thead><tr>\
                                    <th>Map ID</th>\
                                    <th>Map Name</th>\
                                    <th># of players</th>\
                                    <th></th>\
                            </tr></thead>\
                            <tbody>"
                for (var i = 0; i < data.length; i++){
                    var map = data[i];
                    html += "<tr>\
                                <td>"+map.id+"</td>\
                                <td>"+map.name+"</td>\
                                <td>"+map.max_players+"</td>\
                                <td>\
                                    <form action='/game/' method='POST' style='margin:0px'>\
                                        <div style='display:none'><input name='csrfmiddlewaretoken' type='hidden' value='"+$.cookie('csrftoken')+"'></div>\
                                        <input name='map_id' type='hidden' value='"+map.id+"'/>\
                                        <button class='btn'>Host</button>\
                                    </form>\
                                </td>\
                            </tr>";
                }

                //close table
                html += "</tbody></table>";
                $('#content #play-host .play-table').html(html);
            }
        });
    }

    function template_binding(){
        //css stuff
        $('#content .play-table').css({
            backgroundColor: 'white',
        });

        $('#content h4').css({
            'float': 'left',
            'margin': '5px',
        });

        $('#content button').css({
            'float': 'right',
        });
 
        $('#content #play-host-button').click(function(){
            $('#content #play-lobby').fadeOut(200, function(){
                $('#content #play-host').fadeIn(200);
            });

        });

        $('#content #play-lobby-button').click(function(){
            $('#content #play-host').fadeOut(200, function(){
                $('#content #play-lobby').fadeIn(200);
            });

        });

        $('#content #refresh-play-button').click(function(){
            getLobbyTable();
        })
        $('#content #refresh-play-button').css({
            "margin-left":"5px",
        });

        getLobbyTable();
        getHostTable();

        $('#content #play-lobby').show();
        $('#content #play-host').hide();
    }

    var pg = new page();
    pg.binding = template_binding;
    pg.dom_html = '\
        <div class="page-header"><h1>Join!<small> or </small>Host!</h1></div>\
        <div id="play-lobby">\
            <h4>Play a Game!</h4>\
            <button id="refresh-play-button" class="btn btn-warning">Refresh</button>\
            <button id="play-host-button" class="btn btn-primary">Host a Game</button>\
            <br />\
            <br />\
            <div class="play-table"></div>\
        </div>\
        \
        <div id="play-host">\
            <h4>Host a game!</h4>\
            <button id="play-lobby-button" class="btn btn-primary">Play a Game</button>\
            <br />\
            <br />\
            <div class="play-table"></div>\
        </div>\
        ';

    return pg;
}

function template_profile(){
    function changePassword(){
        if($('#newPassword').val() !== $('#newPasswordConfirm').val()){
            $('#content #password-error').html("new passwords must match");
        } else {
            $.ajax({
                type: "POST",
                url: "/auth/change/",
                headers: {
                    "X-CSRFToken": $.cookie('csrftoken'),
                },
                data: {
                    "old_pass": $('#oldPassword').val(),
                    "new_pass": $('#newPassword').val(),
                },
                success: function(data){
                    if (data.success == true){
                        //clear out the form
                        $('#oldPassword').val('');
                        $('#newPassword').val('');
                        $('#newPasswordConfirm').val('');

                        //set the message  
                        $('#content #password-error').html('Your password has been changed');
                    } else if (data.success == false){
                        $('#content #password-error').html(data.error);
                    } else {
                        $('#content #password-error').html("server error");

                    }
                }
            });
        }
    }

    function changeEmail(){
        if($('#newEmail').val() !== $('#newEmailConfirm').val()){
            $('#content #email-error').html("Your email fields must match");
        } else {
            $.ajax({
                type: "POST",
                url: "/auth/change/",
                headers: {
                    "X-CSRFToken": $.cookie('csrftoken'),
                },
                data: {
                    "email": $('#newEmail').val(),
                },
                success: function(data){
                    if (data.success == true){
                        $('#curr-email').html($('#newEmail').val());
                        $('#content #email-error').html("Your email has been changed");
                        user.email = $('#newEmail').val();
                        $('#content #gravatar').html(function(){
                            user.refreshGravatar();
                            return user.getGravatar(150);
                        });

                        $('#user-nav #gravatar').html(function(){
                            return user.getGravatar(40);
                        });

                    } else if (data.success == false){
                        $('#content #email-error').html(data.error);
                    } else {
                        $('#content #email-error').html("server error");
                    }
                }
            });
        }
    }

    function template_binding(){
        //fill in content
        $('#content #profile-username').html(user.username);
        $('#content #curr-email').html(user.email);
        $('#content #gravatar').html(user.getGravatar(150));

        //bind the forms
        $('#change_pass_form').submit(function(e){
            e.preventDefault();
            changePassword();
            return false;
        });

        $('#change_email_form').submit(function(e){
            e.preventDefault();
            changeEmail();
            return false;
        });

        //do some css
        $('#content #one-line').css({
            'position':'relative',
        })

        $('#content #one-line #profile-username').css({
            'position':'absolute',
            'margin-bottom':'15px',
            'margin-left':'5px',
            'bottom':'0px',
            'display':'inline',
            'font-size':'4em',
        });
        $('#content #one-line #gravatar').css({
            'display':'inline',
        });
        $('#content legend').css({
            'color':'white',
        });
        $('#content #change_pass_form #password-error').css({
            'display':'inline',
            'float':'right',
            'margin-left': '10px',
            'color':'red',
        });
        $('#content #change_email_form #email-error').css({
            'display':'inline',
            'float':'right',
            'margin-left': '10px',
            'color':'red',
        });
    }

    var pg = new page();
    pg.binding = template_binding;
    pg.dom_html = '\
            <div id="one-line">\
                <div id="gravatar"></div>\
                <div id="profile-username"></div>\
            </div>\
            <div class="row">\
                <form class="form-horizontal" id="change_pass_form">\
                    <legend>Change Password<div id="password-error"></div></legend>\
                    <div class="control-group">\
                        <label class="control-label" for="oldPassword">Old Password</label>\
                        <div class="controls">\
                            <input type="password" id="oldPassword" placeholder=".....">\
                        </div>\
                    </div>\
                    <div class="control-group">\
                        <label class="control-label" for="newPassword">New Password</label>\
                        <div class="controls">\
                            <input type="password" id="newPassword" placeholder=".....">\
                        </div>\
                    </div>\
                    <div class="control-group">\
                        <label class="control-label" for="newPasswordConfirm">New Password (confirm)</label>\
                        <div class="controls">\
                            <input type="password" id="newPasswordConfirm" placeholder=".....">\
                            <button style="margin-left:10px" type="submit" class="btn">Change</button>\
                        </div>\
                    </div>\
                </form>\
            </div>\
            <div class="row">\
                <form class="form-horizontal" id="change_email_form">\
                    <legend>Change Email<div id="email-error"></div></legend>\
                    <p style="float:left">current email:&nbsp&nbsp<div id="curr-email"></div></p>\
                    <div class="control-group">\
                        <label class="control-label" for="newEmail">New Email</label>\
                        <div class="controls">\
                            <input type="text" id="newEmail" placeholder=".....">\
                        </div>\
                    </div>\
                    <div class="control-group">\
                        <label class="control-label" for="newEmailConfirm">New Email (confirm)</label>\
                        <div class="controls">\
                            <input type="text" id="newEmailConfirm" placeholder=".....">\
                            <button style="margin-left:10px" type="submit" class="btn">Change</button>\
                        </div>\
                    </div>\
                </form>\
            </div>\
    ';
    return pg;
}

function template_history(){

    function template_binding(){
        html = '';
        $.ajax({
            type: "GET",
            async: false,
            url: "/ajax/history/",
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                html += "<table class='table table-striped'>";
                html += "<thead><tr>";
                html += "<th>Game ID</th>";
                html += "<th>Map Name</th>";
                html += "<th>Players</th>";
                html += "</tr></thead><tbody>";
                //iterator down data and get stuff
                for (var i = 0; i < data.length; i++){
                    var game = data[i];
                    html += "<tr>\
                                <td>"+game.id+"</td>\
                                <td>"+game.map_name+"</td>\
                                <td>"+printPlayers(game.players)+"</td>\
                            </tr>";
                }
                //close table
                html += "</tbody></table>";
            }
        });

        $('#content #history-table').html(html);

        $('#content #history-table').css({
            'backgroundColor':'white',
        });
    }

    var pg = new page();
    pg.binding = template_binding;
    pg.dom_html = '\
        <h4>Your Game History</h4>\
        <div id="history-table"></div>\
    ';
    return pg;
}

function template_clan(){

    function create_clan(name){
        $.ajax({
            type: "POST",
            async: false,
            url: "/clan/create/",
            data: { "name": name },
            headers: { "X-CSRFToken": $.cookie('csrftoken') },
            success: function (data){
                if(data['success'] === true){
                    user.clan = name;
                    change_page(templates, 'clan', true, true);
                    $('.clan-name').html(user.getFormattedClanName());
                } else {
                    $('#content #not-a-member #error').html(data['error']);
                    $('#content #not-a-member #error').show();
                }
            }
        });
    }

    function join_clan(name){
        $.ajax({
            type: "POST",
            async: false,
            url: "/clan/join/",
            data: {
                "name": name,
            },
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function(data){
                if(data['success'] == true){
                    user.clan = name;
                    change_page(templates, 'clan', true, true);
                    $('.clan-name').html(user.getFormattedClanName());
                } else {
                    $('#content #not-a-member #error').html(data['error']);
                    $('#content #not-a-member #error').show();

                }
            }
        });
    }

    function leave_clan(){
        $.ajax({
            type: "POST",
            async: false,
            url: "/clan/leave/",
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function(data){
                if(data['success'] === true){
                    user.clan = null
                    change_page(templates, 'clan', true, true);
                    $('.clan-name').html(user.getFormattedClanName());
                } else {
                    $('#content #already-member #error').html("A server error occurred");
                    $('#content #already-member #error').show();
                }
            }
        })
    }

    function get_members_clan(){
        $.ajax({
            type: "GET",
            url: "/clan/members/",
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function(data){
                if(data['success'] === true){
                    var member_list = '<ul>';
                    $.each(data['data'], function (index, value) {
                        member_list += '<li>'+value+'</li>';
                    });
                    member_list += '</ul>';
                    $('#content #clan-member-list').html(member_list);
                    $('#content #clan-owner').html('<ul><li>'+data['owner']+'</li></ul>');
                } else {
                    $('#content #already-member #error').html(data['error']);
                }
            }
        });
    }

    function template_binding(){
        
        if(user.clan !== null){
            //user is a member of a clan
            $('#content #not-a-member').hide();
            $('#content .clan-name').html(user.getFormattedClanName());
            $('#content #already-member button').click(function(){
                leave_clan();
            });
            get_members_clan();
        } else {
            //user is NOT a member of a clan
            $('#content #already-member').hide();
            $('#content #create-clan').submit(function(e){
                e.preventDefault();
                create_clan($('#content #create-clan #name').val());
            });

            $('#content #join-clan').submit(function(e){
                e.preventDefault();
                join_clan($('#content #join-clan #name').val());
            });

            /************************************
             * Make Error Message show up with:
             *      -a red border
             *      -red text
             *      -centered text
             ************************************/
            $('#content #not-a-member #error').hide();

            $('#content #already-member #error').hide();

            $('#content .error').css({
                'border': '1px solid',
                'color':'rgb(255, 0, 0)',
                'text-align': 'center',
            });
        }
    }

    var pg = new page();
    pg.binding = template_binding;
    pg.dom_html = '\
        <div id="already-member">\
            <h5 class="error" id="error"></h5>\
            <h4>You are a member of: <h3 class="clan-name"></h3></h4>\
            <button>Leave Clan</button>\
            <h4>Clan Owner:</h4>\
            <div id="clan-owner">getting owner...</div>\
            <h4>Members:</h4>\
            <div id="clan-member-list">getting list...</div>\
        </div>\
        \
        <div id="not-a-member">\
            <h5 class="error" id="error"></h5>\
            <form id="join-clan">\
                <h4>Join a Clan</h4>\
                Clan: <input id="name" type="text"></input>\
                <input type="submit"></input>\
            </form>\
            \
            <form id="create-clan">\
                <h4>Create a Clan</h4>\
                Clan: <input id="name" type="text"></input>\
                <input type="submit"></input>\
            </form>\
        </div>\
    ';
    return pg;
}

function template_pivotal(){

    function getPivotalInfo(){
        $.ajax({
            type: "GET",
            url: "/ajax/pivotal/",
            async: false,
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function(data){
                html = '<table class="table">';
                $(data).find('activity').each(function(index, element){
                    var description = $(element).find('description').text();
                    if (description.match(/^[^".]+accepted "/) !== null){
                        html += '<tr>\
                        <td>'+$(element).find('occurred_at').text()+'</td>\
                        <td>'+description+'</td>\
                        </tr>';
                    }
                });
                html += '</table>';
                $('#content #list').html(html);
            }
        }).done(function(){
            $('#content #list tr').css({
                'color':'white',
                'margin-top':'10px',
            }); 
        })
    }

    function template_binding(){
        getPivotalInfo();
    }

    var pg = new page();
    pg.binding = template_binding;
    pg.dom_html = '\
        <h3>Pivotal Tracker Activity</h3>\
        <div id="list"></div>\
    ';
    return pg;
}

function template_about(){
    function template_binding(){
        $('#content #developers').css({
            "color":"white",
            "text-align":"center",
        });

        $('#content #developers img').css({
            "height":"150",
        })
    }

    var pg = new page();
    pg.binding = template_binding;
    pg.dom_html = '\
        <div id="accordion">\
            <h3>Our App ~ Its all about the game</h3>\
            <div>\
                <p>\
                The Game Bazaar is a tool to let users test gameplay ideas in minutes. We will build an RTS game framework (plus actual game) that runs on the web browser. The system will contain a platform to let users view and play games, modify others’ games, and make their own. The goal is to create a natural environment by which the best games are enjoyed regularly by the community, improvements made by anyone, and new ideas steadily flowing in. We will take care of how to connect players together. Multiple players can play in the same together in a real time setting. Another major component of the system will be a map editor, also on the web browser, to let users create and modify games. The map editor will let users place units, change gameplay mechanics, and write custom code for the game.\
                </p>\
            </div>\
            <hr />\
            <h3>Developers ~ "{} + undefined = NaN"</h3>\
            <div>\
                <p>\
                    <table id="developers">\
                    <tr><td><img src="'+static_url+'the_game_bazaar/img/about/edwin.JPG"></td><td><img src="'+static_url+'the_game_bazaar/img/about/james.JPG"></td><td><img src="'+static_url+'the_game_bazaar/img/about/xiaohan.JPG"></td><td><img src="'+static_url+'the_game_bazaar/img/about/rohan.JPG"></td><td><img src="'+static_url+'the_game_bazaar/img/about/kevin.JPG"></td></tr>\
                    <tr><td>Edwin Xie</td><td>James Muerle</td><td>Xiaohan Zhang</td><td>Rohan Ramakrishnan</td><td>Kevin Fang</td></tr>\
                    </table>\
                </p>\
            </div>\
        </div>\
    ';
    return pg;
}