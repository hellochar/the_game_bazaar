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
templates['stuff'] = template_stuff();
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
    if (force){
        force = force;
    } else {
        force = false;
    }

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

    $('.navigation #nav-stuff').click(function(){
        change_page(templates, 'stuff', false, true);
    });

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

function template_stuff(){

    function template_bind(){

    }

    var pg = new page();
    pg.binding = template_bind;
    pg.dom_html = '   i. <br /><br />   The feeling you get the day after sending a letter, and you know there is no possible way that the recipient has received your message, let alone formulated time to write a reply. You still get just a little hopeful when you hear the mailman drive by. You rush out to the postbox a little too quickly and are disappointed by the pile of free coupons, bills, charity flyers, and a late Christmas card from your late Grandma Moses. <br /><br />    ii.<br /><br />    You lost your voice one day. You woke up to a hollow echo in the base your throat and knew you’d lost something special before you’d ever had a chance to say anything worthwhile. You checked under the bed and tried the lost and found, but couldn’t even ask if anyone had heard it lately.<br /><br />   iii.<br /><br />   A sudden awareness that occurs during funerals that you are going to die. You are dying right now – your cells are shedding like snakeskin and your hair is turning silver and every moment is one less than before. You will never know which moment is the last one because you won’t be around to count the grains in your hourglass– and, somehow, this knowledge both sharpens and dulls the grief of saying goodbye to Grandma Moses, like a blade that loses all effectiveness once it’s already in your chest.<br /><br />   iv.<br /><br />   You drove from San Francisco to New York, Seattle to El Paso, down every back road and blue highway, all the late night diners and greasy spoon truck stops, checked into every hotel, motel, bed and breakfast inn, and campsite. Then the neighborhood library closed down and no map could lead you back home again.  You know this feeling, the empty feeling of having completed a good book, watched a great movie, listened to an amazing song, when you know that your life will never match up to all the things you want it to be. <br /><br />   v.<br /><br />   An acute alertness of not being watched. An antithesis to paranoia that arises when you wish to be seen and are instead ignored, like the time you got up early enough to curl your hair into ringlets and dug out the makeup kit you got for your fourteenth birthday. And his October eyes still didn’t look twice in your direction. Your translucent paper-skin covered in doodles of hearts, spirals, and stars is not the art meant to hang in solemn galleries. Your thoughts are not cryptic messages to be decoded thousands of years later. Your bones will not be the subject of evolutionary debates and you do not desire any of these things but surely you are worth someone’s attention?<br /><br />   vi.<br /><br />   The distant mumble of the television in another room, or perhaps up one floor, whose muffled voices are at first annoying and then comfortable, lulling away the loud silences of the night – the buzz of the streetlight, the hum of the fridge, the pulse of your own heartbeat – long enough to put a few hours away for dreaming.<br /><br />   vii.<br /><br />   A wretched sadness juxtaposed against the satisfied smugness of predictions that turned out to be right; a weary “I told you so” directed at a tragedy you saw coming from the beginning, but were powerless to stop. The celebrity alcoholic in and out of rehab, the on again off again relationship of two people completely wrong for each other, the precarious tower of empty coke cans stacked on a rickety lunch table with a short leg on one side whose crashing cacophony brings the Principal out of the office to lecture the involved parties. Even the small prophecies are losses.<br /><br />   viii.<br /><br />   The sense of frustration when the perforated edge of your notebook paper doesn’t tear properly, ripping into the pristine white sidebar like a vicious dog into flesh and, oh, you just can’t do anything right at all, can you?<br /><br />   ix.<br /><br />  A nameless fear with no known origin. The moment your heart quickens and you cannot pinpoint the cause, but manage to convince yourself you\'re about to die. An anxiety that builds, beginning somewhere just below your stomach and crawling up to settle in your ribcage and then constricting around your throat until hiding underneath your covers and willing it away isn’t enough. The panic is soothed by the reassurance of the familiar – a favorite movie, a blend of bergamot and ginger tea, old letters and postcards – and though the chill of apprehension mingles unpleasantly with the warmth of the comforting, it’s enough to calm your nerves all the same. You forget all about the feeling in the morning when the sun peeks through the slats of your drawn dorm window, teasing the promise of a new day. <br /><br />   x.<br /><br />   The swift rush of perspective when you stare at the sky hard enough and see that it is not a flat plane but a curve, that the clouds and stars are not level, but have depth; depth that has to be measured in alien terms because human sensibilities are just too little; depth so far beyond the scope of your imaginings that just staring is enough to make you stretch your arms as far as possible, as though reaching will bring all the things beyond your grasp any closer. The history of the universe is stretched out before you, a book bound at the spine by gravity and written in a language of light. As soon as that happens you have to look away just to feel normal again, arms collapsing heavily to your sides. And even though gravity pulls harder than ever, your steps out into the night grow steadily lighter.<br /><br />   xi.<br /><br />   A disorientation that ensues during a big move – from one home to another, or perhaps from home to college. When your own room is void of anything that marks it as yours except for the quilt embroidered by Grandma Moses that you couldn’t find room in a box for, and yet you can’t stop seeing it as belonging uniquely to you. You bags are packed and your entire life has been compacted into a dozen cardboard boxes sitting in the trunk of a taxi that will take you away – to your new house, to the station, to the airport – but your compass needle still points directly in the direction you are leaving.<br /><br />    xii.<br /><br />    You’re lost in a photo booth. You spent ten years making silly faces behind the curtain and nearly emerged from the other side as a serious adult stuck in black and white stills that got stuffed into a wallet and forgotten about, never looked at again until your hair is as grey and faded as the photograph, but you’re looking at it now, nostalgically, wistfully, wondering if your letter has slipped between the cracks of I’ll do it tomorrow and there will always be time.<br /><br />   xiii.<br /><br />   A short circuit of the brain that typically occurs on overcast, blue-grey days that are neither rainy nor sunny, which create a visual paradox on the ground, where everything appears a touch brighter, a shade sharper, a bit crisper around the edges. The shift of light casts angular shadows that make the world appear to be bursting at the seams and something about the fullness of the scene satisfies the ghosts in your eyes. An appreciation for how subtle a thing can influence your entire day, and you have to compose your own emotions instead of letting the weather dictate your moods.<br /><br />   xiv.<br /><br />    The sudden jolt of seeing someone familiar in an unfamiliar place; an awkwardness that comes when you see an office co-worker or a doctor or an old teacher in a place where you are not used to seeing them – in the grocery store, at the movie theater, browsing the library. When you recognize his October eyes under the fringe of chopped, russet hair on the other side of the bookshelf, you bury your blush in the spine of the nearest book. Often accompanied by the sudden knowledge that this person has an entire life locked away behind doors you never knew existed. Suddenly light has spilled out from underneath one of them and your fingers are brushing the carpet of a room full of ordinary secrets that have not been hidden, but have been kept from your eyes all the same.<br /><br />    xv.<br /><br />    A keen alertness to something just beyond the scope of your understanding, lying across the field of your consciousness like an asymptote begging to be crossed. The ratio of fascination to mystery keeps calling you back to the things you don’t understand; the reason you find poetry in mathematics even though a series of fatally wounded tests has been holding you back the last two years. The thunder in your heart that knows something before you do when you catch his October eyes across the lecture hall, that makes every muscle in your body sing even as you glance away. You watch the girl two rows down snap her gum, loudly, a gunshot against the drone of the professor, and return to doodling curves on your graph paper; the curves become a heart.<br /><br />   xvi.<br /><br />   A late night preoccupation with aliveness – a sense that the deepest part of the night, or the earliest part of the morning, is the most awake part of the day. When your senses are heightened to such a degree that the very air is full of rough crystals grating your lungs and the compulsion to draw breath is so deliberate you wonder how you manage to do it all day without ever thinking about it.<br /><br />   xvii.<br /><br />   A superimposition of aged features on to a youthful face, or the excavation of youthful features from an aged one; a juncture in time where the past and future clash to create the now, and if you just stare hard enough you can see the person he used to be and the person he will become, caught somewhere between the dwindling baby fat around his jawline and the developing stubble at the tip of his chin. Only his October eyes remain the same.<br /><br />   xviii.<br /><br />   The noise of a faraway car driving late at night or perhaps in the lonely cool before dawn, in that sleepy place somewhere between consciousness and dreaming, where everything is warm and vaguely fuzzy. The remote sound of tires on asphalt speaks to a sense of curiosity – where are they going? Why so early? – but the blankets are so heavy, your eyes are so heavy, and before you can wonder anymore, the car is long gone, and so are you.<br /><br />   xix. <br /><br />  A wondrous appreciation for the quick and efficient work of late-night waitresses at the local Waffle House who juggle coffeepots and patrons while bacon sizzles on the grill. You love the way they crack eggs without even looking and flip pancakes like pros and chat with the late night clientele because all the best customers come in before the sun does. You like the way he cleans his plate as though it were the last meal he will ever get - never turn down free food he said, even though he was paying. You spin yourself back and forth slightly on the pleather red barstool once you’ve finished your toast, hands folded in your lap, watching the waitresses craft five-star omelets while listening to the Springsteen records glowing from the jukebox and when he finally puts his fork down and invites you for a ride on the chrome-wheeled suicide machine he inherited from his father, you don’t say no.<br /><br />    xx.<br />  <br />    When you part for the evening he tells you to be safe, and you’re never sure what to say. So you settle for I\'ll try, as though that\'s all it takes, and he guns the motorcycle. You hear his engines roaring on in your dreams all night long, where heaven’s waiting down on the tracks.<br /><br />   xxi.<br /><br />   An unexpected desire to leave home – not forever – but just long enough to have something exciting to talk about when the neighbors visit because the daily grind is ripping the bones from your back and you can only stand to look at so many baby pictures from barely wedded friends you barely knew in high school. A nameless longing to leave the familiarity that you can’t get far enough away from, the suffocating smiles, distant church bells, and the last fumes of exhaust from the bus transit hub. If only you can truly come home, just once, and know what belonging really means. Your world looked so much bigger from the backseat.<br /><br />    xxii.<br /><br />You found your voice one day. You pulled a pen from the junk drawer, or sat down at a keyboard, or bought a journal on a whim and found it curled up around your fingers, sleeping, rusty, but alive. You grabbed a handful of Scrabble tiles and alphabet magnets, bought a magnetic poetry board to shuffle  with your ink-stained fingers and learned how to make them talk instead.<br /><br />   xxiii.<br /><br />   An unforeseen surge of joy caused by the surprise appearance of the letter you’ve been waiting for from a friend not seen in over a year. The flutter of the envelope flap unfolds like wing pinions stretching for flight and the rustle of paper promises hours of reading and responding from your red plush swivel chair near the window. Your baby steps into the world are turning into confident strides and you don’t write a response but a promise; you’ll stop waste your summers praying in vain. One day you’ll visit, no matter the distance, and you’ll come running.<br /><br />   xiv.<br /><br />   A thoughtfulness that follows a long conversation as you catalog all the lines that made you smile and you’d like to keep for those grey days that you spend throwing roses in the rain. And abruptly realizing that when he offhandedly mentioned that you seemed happier, October eyes glimmering, you are. You really are.'

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
                        $('#curr_email').html($('#newEmail').val());
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
