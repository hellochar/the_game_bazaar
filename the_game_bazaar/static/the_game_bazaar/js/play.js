function showHost() {
    $('#play-host').show();
    $('#play-join').hide();
}

function showPlay() {
    $('#play-host').hide();
    $('#play-join').show();
}

$().ready(function() {
    $('#play-host').hide();

    $('#play-host-button').click(function(){
        showHost();
    });

    $('#play-join-button').click(function(){
        showPlay();
    });
});
