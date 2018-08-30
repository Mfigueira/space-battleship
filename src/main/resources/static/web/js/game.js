var app = new Vue({
  el: "#app",
  data: {
    grid: {
            "numbers": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
            "letters": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
    },
    player_1: "",
    player_2: ""
  }
});

$(document).ready(function() {
    var gamePlayerId = getQueryVariable("gp");

    $.get("/api/game_view/"+gamePlayerId).done(function(gameDTO) {
            console.log(gameDTO);
            displayShipLocations(gameDTO.ships);
            displaySalvoes(gamePlayerId, gameDTO);
            showPlayersByGamePlayerId(gamePlayerId, gameDTO);
        });
});


function showPlayersByGamePlayerId(id, obj) {
    obj.gamePlayers.map(function (gamePlayer) {
        if (id == gamePlayer.id) {
            app.player_1 = gamePlayer.player.email + " (you)";
            if (gamePlayer.player.side === "LIGHT") {
                $("#p1").removeClass("text-DARK")
                $("#p1").addClass("text-LIGHT")
            } else if (gamePlayer.player.side === "DARK") {
                $("#p1").removeClass("text-LIGHT")
                $("#p1").addClass("text-DARK")
            }
        } else if (id != gamePlayer.id) {
            app.player_2 = " vs " + gamePlayer.player.email;
            if (gamePlayer.player.side === "LIGHT") {
                $("#p2").removeClass("text-DARK")
                $("#p2").addClass("text-LIGHT")
            } else if (gamePlayer.player.side === "DARK") {
                $("#p2").removeClass("text-LIGHT")
                $("#p2").addClass("text-DARK")
            }
        }
    });
}

$("#logout").click(function() {
    $.post("/api/logout").done(function() {
        window.location.replace("/web/games.html")
    })
});

function getQueryVariable(variable) {
   var query = window.location.search.substring(1);
   var vars = query.split("&");
   for (var i=0;i<vars.length;i++) {
       var pair = vars[i].split("=");
       if(pair[0] == variable){
           return pair[1];
           }
   }
   return(false);
}

function displayShipLocations(ships) {
    var cruiser = "<img class='ship-img' src=\"css/images/icons/light-cruiser.png\">";
    var starFighter = "<img class='ship-img' src=\"css/images/icons/light-starfighter.png\">";
    var destroyer = "<img class='ship-img' src=\"css/images/icons/light-fighter.png\">";
    var bomber = "<img class='ship-img' src=\"css/images/icons/light-bomber.png\">";
    for (var i=0;i<ships.length;i++){
        var locations = ships[i].locations;
        var shipType = ships[i].type;
        for (var e=0;e<locations.length;e++){
            var letter = locations[e].substring(0, 1);
            var number = locations[e].substring(1, 3);
            switch (shipType) {
                case "cruiser":
                    $("#grid-body>."+letter+" td:eq("+number+")").html(cruiser).addClass("bg-ship");
                    break;
                case "bomber":
                    $("#grid-body>."+letter+" td:eq("+number+")").html(bomber).addClass("bg-ship");
                    break;
                case "destroyer":
                    $("#grid-body>."+letter+" td:eq("+number+")").html(destroyer).addClass("bg-ship");
                    break;
                case "starFighter":
                    $("#grid-body>."+letter+" td:eq("+number+")").html(starFighter).addClass("bg-ship");
                    break;
                case "fighter":
                    $("#grid-body>."+letter+" td:eq("+number+")").html(starFighter).addClass("bg-ship");
                    break;
                default:
                    $("#grid-body>."+letter+" td:eq("+number+")").html("SHIP").addClass("bg-ship");
            }
        }
    }
}

function displaySalvoes(gamePlayerId, gameDTO) {

   for (var i=0;i<gameDTO.gamePlayers.length;i++){

       if (gameDTO.gamePlayers[i].id == gamePlayerId) {
           var thisPlayerId = gameDTO.gamePlayers[i].player.id;
           gameDTO.salvoes.map(function (salvo) {
               if (salvo.player == thisPlayerId) {
                   var myTurn = salvo.turn;
                   for (var e=0;e<salvo.locations.length;e++){
                       var letterP1 = salvo.locations[e].substring(0, 1);
                       var numberP1 = salvo.locations[e].substring(1, 3);
                       $("#salvo-body>."+letterP1+" td:eq("+numberP1+")").addClass("bg-salvo").html(myTurn);
                   }
               } else if (salvo.player != thisPlayerId) {
                   var yourTurn = salvo.turn;
                   for (var h=0;h<salvo.locations.length;h++){
                       var letter = salvo.locations[h].substring(0, 1);
                       var number = salvo.locations[h].substring(1, 3);
                       if ($("#grid-body>."+letter+" td:eq("+number+")").hasClass("bg-ship")) {
                           $("#grid-body>."+letter+" td:eq("+number+")").addClass("bg-salvo").html(yourTurn);
                       }
                   }
               }
           });
       }
   }
}