var app = new Vue({
  el: "#app",
  data: {
    grid: {
            "numbers": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
            "letters": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
    },
    player_1: "",
    player_2: "",
    gameViewerSide: "",
    gameViewerShips: []
  }
});

$(function() {
    loadData();
});

function loadData() {
    var gamePlayerId = getQueryVariable("gp");
    $.get("/api/game_view/"+gamePlayerId).done(function(gameDTO) {
        //displayShipLocations(gameDTO.ships);
        showPlayersByGamePlayerId(gamePlayerId, gameDTO);
        displaySalvoes(gamePlayerId, gameDTO);

        if (gameDTO.ships.length === 0) {
            placeNewShips();
        } else {
            app.gameViewerShips = gameDTO.ships;
            //placeShipsFromBackEnd();
        }
    });
}


function showPlayersByGamePlayerId(id, obj) {
    obj.gamePlayers.map(function (gamePlayer) {
        if (id == gamePlayer.id) {
            app.player_1 = gamePlayer.player.email + " (you)";
            app.gameViewerSide = gamePlayer.player.side;
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


/*
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
*/


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


//--------------------------------PLACING SHIPS----------------------------------
function postShips(shipTypeAndCells) {
    var gamePlayerId = getQueryVariable("gp");
    $.post({
      url: "/api/games/players/"+gamePlayerId+"/ships",
      data: JSON.stringify(shipTypeAndCells),
      dataType: "text",
      contentType: "application/json"
    })
    .done(function (response) {
      loadData();
      console.log( "Ships added: " + response );
    })
    .fail(function () {
      console.log("Failed to add ships: ");
    })
}

$("#placed-ships-btn").click(function(){
    var shipTypeAndCells = [];

    for (var i=1; i<=5; i++) {
        var shipLoc = new Object();
        var cellsArray = [];

        var h = parseInt($("#grid .grid-stack-item:nth-child("+i+")").attr("data-gs-height"));
        var w = parseInt($("#grid .grid-stack-item:nth-child("+i+")").attr("data-gs-width"));
        var posX = parseInt($("#grid .grid-stack-item:nth-child("+i+")").attr("data-gs-x"));
        var posY = parseInt($("#grid .grid-stack-item:nth-child("+i+")").attr("data-gs-y"))+64;

        if (w>h) {
            for (var e=1; e<=w; e++) {
                var HHH = String.fromCharCode(posY+1)+(posX+e);
                cellsArray.push(HHH);
                shipLoc.type = $("#grid .grid-stack-item:nth-child("+i+")").children().attr("alt");
                shipLoc.cells = cellsArray;
            }
        } else if (h>w) {
            for (var d=1; d<=h; d++) {
                var VVV = String.fromCharCode(posY+d)+(posX+1);
                cellsArray.push(VVV);
                shipLoc.type = $("#grid .grid-stack-item:nth-child("+i+")").children().attr("alt");
                shipLoc.cells = cellsArray;
            }
        }
        console.log(shipLoc);
        shipTypeAndCells.push(shipLoc);
    }
    console.log(shipTypeAndCells);
    postShips(shipTypeAndCells);
})

function setListener(grid) {
    $(".grid-stack-item").dblclick(function() {
        var h = parseInt($(this).attr("data-gs-height"));
        var w = parseInt($(this).attr("data-gs-width"));
        // var posX = parseInt($(this).attr("data-gs-x"));
        // var posY = parseInt($(this).attr("data-gs-y"));

        for (var i=0, e=0; i<10; i++, e++) {
            if ( grid.isAreaEmpty(i, e, h, w) && grid.isAreaEmpty(i, e, w, h) ) {
                grid.move($(this), i, e);
                grid.resize($(this), h, w);
                break;
            }
        }

        if ( $(this).children().attr("id") === "dark-cruiser-img-v" ){
            $(this).children().attr("id", "dark-cruiser-img-h").attr("src", "css/images/icons/dark-cruiser-h.png");
        } else if ( $(this).children().attr("id") === "dark-cruiser-img-h" ){
            $(this).children().attr("id", "dark-cruiser-img-v").attr("src", "css/images/icons/dark-cruiser-v.png");
        } else if ( $(this).children().attr("id") === "dark-destroyer-img-h" ){
            $(this).children().attr("id", "dark-destroyer-img-v").attr("src", "css/images/icons/dark-destroyer-v.png");
        } else if ( $(this).children().attr("id") === "dark-destroyer-img-v" ){
            $(this).children().attr("id", "dark-destroyer-img-h").attr("src", "css/images/icons/dark-destroyer-h.png");
        } else if ( $(this).children().attr("id") === "dark-bomber-img-v" ){
            $(this).children().attr("id", "dark-bomber-img-h").attr("src", "css/images/icons/dark-bomber-h.png");
        } else if ( $(this).children().attr("id") === "dark-bomber-img-h" ){
            $(this).children().attr("id", "dark-bomber-img-v").attr("src", "css/images/icons/dark-bomber-v.png");
        } else if ( $(this).children().attr("id") === "dark-fighter-img-h" ){
            $(this).children().attr("id", "dark-fighter-img-v").attr("src", "css/images/icons/dark-fighter-v.png");
        } else if ( $(this).children().attr("id") === "dark-fighter-img-v" ){
            $(this).children().attr("id", "dark-fighter-img-h").attr("src", "css/images/icons/dark-fighter-h.png");
        } else if ( $(this).children().attr("id") === "dark-starfighter-img-v" ){
            $(this).children().attr("id", "dark-starfighter-img-h").attr("src", "css/images/icons/dark-starfighter-h.png");
        } else if ( $(this).children().attr("id") === "dark-starfighter-img-h" ){
            $(this).children().attr("id", "dark-starfighter-img-v").attr("src", "css/images/icons/dark-starfighter-v.png");
        } else if ( $(this).children().attr("id") === "light-cruiser-img-v" ){
            $(this).children().attr("id", "light-cruiser-img-h").attr("src", "css/images/icons/light-cruiser-h.png");
        } else if ( $(this).children().attr("id") === "light-cruiser-img-h" ){
            $(this).children().attr("id", "light-cruiser-img-v").attr("src", "css/images/icons/light-cruiser-v.png");
        } else if ( $(this).children().attr("id") === "light-destroyer-img-h" ){
            $(this).children().attr("id", "light-destroyer-img-v").attr("src", "css/images/icons/light-destroyer-v.png");
        } else if ( $(this).children().attr("id") === "light-destroyer-img-v" ){
            $(this).children().attr("id", "light-destroyer-img-h").attr("src", "css/images/icons/light-destroyer-h.png");
        } else if ( $(this).children().attr("id") === "light-bomber-img-v" ){
            $(this).children().attr("id", "light-bomber-img-h").attr("src", "css/images/icons/light-bomber-h.png");
        } else if ( $(this).children().attr("id") === "light-bomber-img-h" ){
            $(this).children().attr("id", "light-bomber-img-v").attr("src", "css/images/icons/light-bomber-v.png");
        } else if ( $(this).children().attr("id") === "light-fighter-img-h" ){
            $(this).children().attr("id", "light-fighter-img-v").attr("src", "css/images/icons/light-fighter-v.png");
        } else if ( $(this).children().attr("id") === "light-fighter-img-v" ){
            $(this).children().attr("id", "light-fighter-img-h").attr("src", "css/images/icons/light-fighter-h.png");
        } else if ( $(this).children().attr("id") === "light-starfighter-img-v" ){
            $(this).children().attr("id", "light-starfighter-img-h").attr("src", "css/images/icons/light-starfighter-h.png");
        } else if ( $(this).children().attr("id") === "light-starfighter-img-h" ){
            $(this).children().attr("id", "light-starfighter-img-v").attr("src", "css/images/icons/light-starfighter-v.png");
        }
    })
}


function placeNewShips() {
    var options = {
        //grilla de 10 x 10
        width: 10,
        height: 10,
        //separacion entre elementos (les llaman widgets)
        verticalMargin: 0,
        //altura de las celdas
        cellHeight: 35,
        cellWidth: 35,
        //desabilitando el resize de los widgets
        disableResize: true,
        //widgets flotantes
        float: true,
        //removeTimeout: 100,
        //permite que el widget ocupe mas de una columna
        disableOneColumnMode: true,
        //false permite mover, true impide
        staticGrid: false,
        //activa animaciones (cuando se suelta el elemento se ve más suave la caida)
        animate: true
    }
    //se inicializa el grid con las opciones
    $('.grid-stack').gridstack(options);
    var grid = $('#grid').data('gridstack');

    if (app.gameViewerSide === "DARK") {
        grid.addWidget($('<div><img id="dark-cruiser-img-v" class="grid-stack-item-content" src="css/images/icons/dark-cruiser-v.png" alt="cruiser"></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><img id="dark-destroyer-img-v" class="grid-stack-item-content" src="css/images/icons/dark-destroyer-v.png" alt="destroyer"></div>'),
        8, 0, 1, 4, false);
        grid.addWidget($('<div><img id="dark-bomber-img-v" class="grid-stack-item-content" src="css/images/icons/dark-bomber-v.png" alt="bomber"></div>'),
        5, 1, 1, 3, false);
        grid.addWidget($('<div><img id="dark-fighter-img-v" class="grid-stack-item-content" src="css/images/icons/dark-fighter-v.png" alt="fighter"></div>'),
        3, 5, 1, 3, false);
        grid.addWidget($('<div><img id="dark-starfighter-img-v" class="grid-stack-item-content" src="css/images/icons/dark-starfighter-v.png" alt="starFighter"></div>'),
        6, 7, 1, 2, false);

    } else if (app.gameViewerSide === "LIGHT") {
        grid.addWidget($('<div><img id="light-cruiser-img-v" class="grid-stack-item-content" src="css/images/icons/light-cruiser-v.png" alt="cruiser"></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><img id="light-destroyer-img-v" class="grid-stack-item-content" src="css/images/icons/light-destroyer-v.png" alt="destroyer"></div>'),
        8, 2, 1, 4, false);
        grid.addWidget($('<div><img id="light-bomber-img-v" class="grid-stack-item-content" src="css/images/icons/light-bomber-v.png" alt="bomber"></div>'),
        4, 2, 1, 3, false);
        grid.addWidget($('<div><img id="light-fighter-img-h" class="grid-stack-item-content" src="css/images/icons/light-fighter-h.png" alt="fighter"></div>'),
        1, 7, 3, 1, false);
        grid.addWidget($('<div><img id="light-starfighter-img-v" class="grid-stack-item-content" src="css/images/icons/light-starfighter-v.png" alt="starFighter"></div>'),
        6, 7, 1, 2, false);
    }
    setListener(grid);
}

function placeShipsFromBackEnd() {
    var options = {
        //grilla de 10 x 10
        width: 10,
        height: 10,
        //separacion entre elementos (les llaman widgets)
        verticalMargin: 0,
        //altura de las celdas
        cellHeight: 35,
        cellWidth: 35,
        //desabilitando el resize de los widgets
        disableResize: true,
        //widgets flotantes
        float: true,
        //removeTimeout: 100,
        //permite que el widget ocupe mas de una columna
        disableOneColumnMode: true,
        //false permite mover, true impide
        staticGrid: true,
        //activa animaciones (cuando se suelta el elemento se ve más suave la caida)
        animate: true
    }
    //se inicializa el grid con las opciones
    $('.grid-stack').gridstack(options);
    var grid = $('#grid').data('gridstack');

    app.gameViewerShips.map(function(ship) {

        ship.

    })

    var width;
    var height;

    if (app.gameViewerSide === "DARK") {
        grid.addWidget($('<div><img id="dark-cruiser-img-v" class="grid-stack-item-content" src="css/images/icons/dark-cruiser-v.png" alt="cruiser"></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><img id="dark-destroyer-img-v" class="grid-stack-item-content" src="css/images/icons/dark-destroyer-v.png" alt="destroyer"></div>'),
        8, 0, 1, 4, false);
        grid.addWidget($('<div><img id="dark-bomber-img-v" class="grid-stack-item-content" src="css/images/icons/dark-bomber-v.png" alt="bomber"></div>'),
        5, 1, 1, 3, false);
        grid.addWidget($('<div><img id="dark-fighter-img-v" class="grid-stack-item-content" src="css/images/icons/dark-fighter-v.png" alt="fighter"></div>'),
        3, 5, 1, 3, false);
        grid.addWidget($('<div><img id="dark-starfighter-img-v" class="grid-stack-item-content" src="css/images/icons/dark-starfighter-v.png" alt="starFighter"></div>'),
        6, 7, 1, 2, false);

    } else if (app.gameViewerSide === "LIGHT") {
        grid.addWidget($('<div><img id="light-cruiser-img-v" class="grid-stack-item-content" src="css/images/icons/light-cruiser-v.png" alt="cruiser"></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><img id="light-destroyer-img-v" class="grid-stack-item-content" src="css/images/icons/light-destroyer-v.png" alt="destroyer"></div>'),
        8, 2, 1, 4, false);
        grid.addWidget($('<div><img id="light-bomber-img-v" class="grid-stack-item-content" src="css/images/icons/light-bomber-v.png" alt="bomber"></div>'),
        4, 2, 1, 3, false);
        grid.addWidget($('<div><img id="light-fighter-img-h" class="grid-stack-item-content" src="css/images/icons/light-fighter-h.png" alt="fighter"></div>'),
        1, 7, 3, 1, false);
        grid.addWidget($('<div><img id="light-starfighter-img-v" class="grid-stack-item-content" src="css/images/icons/light-starfighter-v.png" alt="starFighter"></div>'),
        6, 7, 1, 2, false);
    }
    setListener(grid);
}
