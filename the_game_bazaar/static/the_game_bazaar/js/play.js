$().ready(function(){
	$('#play-host').hide();

	$('#play-host-button').click(function(){
		showHost();
	});

	$('#play-join-button').click(function(){
		showPlay();
	})

	$('#play-join-table').html(getLobbyTable);
	console.log(getLobbyTable());
})

function getLobbyTable(){
	html = '';
	$.ajax({
	    type: "GET",
	    async: false,
	    url: "/ajax/lobby/",
	    headers: {
	        "X-CSRFToken": $.cookie('csrftoken')
	    },
	    success: function (data){
	    	console.log(data);
			//open table	    	
	    	html += "<table>";
	    	//table headers
	    	html += "<thead><tr>";
        	html += "<th>Game ID</th>";
        	html += "<th>Map Name</th>";
        	html += "<th>Players</th>";
            html += "<th></th>";
       		html += "</tr></thead><tbody>";
       		//iterator down data and get stuff
       		for (var i = 0; i < data.length; i++){
       			var game = data[i];
       			html += "<tr>\
                            <td>"+game.id+"</td>\
                            <td>"+game.map_name+"</td>\
                            <td id='game-"+game.id+"'></td>\
                            <td>\
                                <form action='/game/join' method='POST' style='margin:0px'>\
                                    {% csrf_token %}\
                                    <input name='game-id' type='hidden' value="+game.id+" />\
                                    <button class='btn'>Join</button>\
                                </form>\
                            </td>\
                            <script>\
                                    printPlayers({{ game.id }}, $.parseJSON('{{ game.players|safe }}'));\
                            </script>\
                        </tr>";
			}

       		//close table
	    	html += "</tbody></table>";
	    }
	});
	return html;
}

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