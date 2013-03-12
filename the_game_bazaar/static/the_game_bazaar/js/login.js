$().ready(function(){
	$('#login_page').show();
	$('#register_page').hide();

	$('#signin-form').submit(function (e){
		e.preventDefault();
		console.log("submitted");
		$.ajax({
			type: "POST",
			url: "/auth/login",
			data: {
				"username":$('#username').val(),
				"password":$('#password').val()
			},
			headers: {
				"X-CSRFToken": $.cookie('csrftoken'),
			},
			success: function (data){
				console.log(data);
                if(data['success'] === true){
                    window.location.pathname = '/';
                }
				return false;
			},
		});
		return false;
	});

    $('#register-form').submit(function (e){
        e.preventDefault();
        console.log("submitted");
        $.ajax({
            type: "POST",
            url: "/auth/register",
            data: {
                "username":$('#username-reg').val(),
                "password":$('#password-reg').val(),
                "email":$('#email-reg').val(),
            },
            headers: {
                "X-CSRFToken": $.cookie('csrftoken'),
            },
            success: function (data){
                console.log(data);
                return false;
            },
        });
        return false;
    });

	$('#register').click(function(){
		$('#login_page').hide();
		$('#register_page').show();
	});

	$('#login').click(function(){
		$('#login_page').show();
		$('#register_page').hide();
	});
});