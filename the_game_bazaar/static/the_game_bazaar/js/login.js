$().ready(function(){
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
                }
                console.log(data);
                return false;
            }
        });
        return false;
    });
});