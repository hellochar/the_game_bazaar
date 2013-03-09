$().ready(function(){
	$('.form-signin').submit(function (e){
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
				return false;
			},
		});
		return false;
	});	
});