$().ready(function(){
	$('#gravatar').html(function(){
		return getGravatar();
	})

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
});

function getGravatar(){
	html = '';
	$.ajax({
        type: "GET",
        url: "/ajax/gravatar/",
        async: false,
        data: {
            "size":200,
        },
        headers: {
            "X-CSRFToken": $.cookie('csrftoken')
        },
        success: function (data){
            html = data;
        }
    });
    return html;
}

function changePassword(){
	if($('#newPassword').val() !== $('#newPasswordConfirm').val()){
		navbarAlert('Your new password fields must match');
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
					navbarAlert('You password has been changed');	
				} else if (data.success == false){
					navbarAlert(data.error);
				} else {
					navbarAlert('An error has occurred on the server, try again later.');
				}
			}
		});
	}
}

function changeEmail(){
	if($('#newEmail').val() !== $('#newEmailConfirm').val()){
		navbarAlert('Your email fields must match');
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
					navbarAlert('You email has been changed');	
					$('#gravatar').html(function(){
						return getGravatar();
					});
				} else if (data.success == false){
					navbarAlert(data.error);
				} else {
					navbarAlert('An error has occurred on the server, try again later.');
				}
			}
		});
	}
}