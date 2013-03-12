$().ready(function(){
    $('#register-form').submit(function (e){
        e.preventDefault();
        $.ajax({
            type: "POST",
            url: "/auth/register/",
            data: {
                "username":$('#registerUsername').val(),
                "password":$('#registerPassword').val(),
                "email":$('#registerEmail').val(),
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