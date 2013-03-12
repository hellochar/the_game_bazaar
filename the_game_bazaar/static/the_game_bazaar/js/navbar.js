$().ready(function(){
	
	$('#navbar-logout').submit(function (e){
		e.preventDefault();
		$.ajax({
			type: "POST",
			url: "/auth/logout",
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


});