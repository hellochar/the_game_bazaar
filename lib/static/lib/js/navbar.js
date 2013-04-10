$().ready(function(){
    function navbarAlert(text){
        $('#navbar-alert-text').html(text);
        $('#navbar-alert').show();
    }

    $('#navbar-alert').hide();

    $('#navbar-alert-close').click(function(){
        $('#navbar-alert').hide();
    })

    $('#navbar-logout').click(function (e){
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
                    navbarAlert("incorrect username or password");
                    //put stuff in error
                }
                return false;
            },
        });
        return false;
    });
});
