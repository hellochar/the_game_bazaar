$().ready(function(){
	$(".alert").alert();
	$('#navbar-logout').submit(function (e){
		e.preventDefault();
		$.ajax({
			type: "POST",
			url: "/auth/logout/",
			headers: {
				"X-CSRFToken": $.cookie('csrftoken'),
			},
			success: function (data){
				if(data['success'] === true){
                    window.location.pathname = '/';
                }
			},
		});
		return false;
	});

	$('#navbar-login').submit(function (e){
		e.preventDefault();
		$.ajax({
			type: "POST",
			url: "/auth/login/",
			data: {
				"username":$('#navbar-username').val(),
				"password":$('#navbar-password').val()
			},
			headers: {
				"X-CSRFToken": $.cookie('csrftoken'),
			},
			success: function (data){
                if(data['success'] === true){
                    window.location.pathname = '/';
                } else {
                	//put stuff in error
                }
				return false;
			},
		});
		return false;
	});
});