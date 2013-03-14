$().ready(function(){
	$('#play-host').hide();

	$('#play-host-button').click(function(){
		showHost();
	});

	$('#play-join-button').click(function(){
		showPlay();
	})
})

function showHost(){
	$('#play-host').show();
	$('#play-join').hide();
}

function showPlay(){
	$('#play-host').hide();
	$('#play-join').show();
}

function printPlayers(id, json_players){
	var html = '';
	for (var key in json_players)
		html += json_players[key] + ', ';

	html = html.slice(0,-2);

	$('#game-'+id).html(html);
}