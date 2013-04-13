$().ready(function(){
    $('.sign-in').hide();

	$('#sign-in').click(function(){
        $('.sign-in').slideToggle(300);
	});
});

function user(){
	//instance vars
	this.loggedin = false;
	this.username = '';
	this.gravatar_url = '';

	//methods
	this.getGravatar = getGravatar;
	this.login = login;
	this.logout = logout;

	function getGravatar(){
		return this.gravatar_url;
	}

	function login(username, password){
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
                return false;
            },
        });
	}

	function logout(){

	}
}