//-------------------------------------------------------VUE FRAMEWORK---------------------------------------------------------
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
    opponentSide: "",
    gameViewerShips: [],
    allShipPositions: [],
    viewerPlayerId: 0,
    viewerSalvoTurn: 0,
    viewerGameState: ""
  }
});

//-------------------------------------------------------WHEN DOM READY, CALL LOAD DATA---------------------------------------------------------
$(function() {
    loadData();
});

//-------------------------------------------------------MAIN FUNCTION WHEN PAGE LOADS - AJAX GET DATA---------------------------------------------------------
function loadData() {
    var gamePlayerId = getQueryVariable("gp");
    $.get("/api/game_view/"+gamePlayerId).done(function(gameDTO) {

        showPlayersByGamePlayerId(gamePlayerId, gameDTO);

        if (app.gameViewerSide === "DARK") {
            $(".container-fluid").addClass("bkg-empire");
            $("#app").addClass("shd-dark");
            $("#battlelog>.card").addClass("card-dark");
            $("#audio-theme").html('<source src="css/audio/dark-side-theme.mp3" type="audio/mp3">');
        } else if (app.gameViewerSide === "LIGHT") {
            $(".container-fluid").addClass("bkg-rebels");
            $("#app").addClass("shd-light");
            $("#battlelog>.card").addClass("card-light");
            $("#audio-theme").html('<source src="css/audio/light-side-theme.mp3" type="audio/mp3">');
        }

        if (app.viewerGameState === "WAIT_OPPONENT") {
            waitingOpponent();
        } else if (app.viewerGameState === "PLACE_SHIPS") {
            placeNewShips();
        } else if (app.viewerGameState === "WAIT_OPPONENT_SHIPS") {
            waitingOpponentShips();
            getShipCol(gameDTO);
        } else {
            getShipCol(gameDTO);

            displaySalvoTurn(app.viewerGameState);
            displaySalvoes(gamePlayerId, gameDTO);
        }
    })
    .fail(function () {
        console.log("Failed to get game view data... ");
    });
}

//----------------------------------------------------GET SHIP COL---------------------------------------------------------
function getShipCol(gameDTO) {
            var grid = $('#grid').data('gridstack');
            if ( typeof grid != 'undefined' ) {
                grid.removeAll();
                grid.destroy(false);
            }
            app.gameViewerShips = gameDTO.ships;
            getAllShipLocations(app.gameViewerShips);
            placeShipsFromBackEnd();
            displayMyShips();
}

//----------------------------------------------------GET ALL SHIP CELLS LOCATION TO COMPARE WITH SALVOS---------------------------------------------------------
function getAllShipLocations(set) {
    set.map(function(ship) {
        for (var i=0; i<ship.locations.length; i++){
            app.allShipPositions.push(ship.locations[i]);
        }
    });
    console.log(app.allShipPositions);
    return;
}
//----------------------------------------------------DISPLAY MY SHIPS IN LOG---------------------------------------------------------

function displayMyShips() {
    if (app.gameViewerSide === "DARK") {
        $("#my-dark-ships").show();
    } else if (app.gameViewerSide === "LIGHT") {
        $("#my-light-ships").show();
    }
}

//---------------------------------------------------------------GET VIEWER DATA AND SHOW PLAYERS NAMES-------------------------------------------------------------------------
function showPlayersByGamePlayerId(id, obj) {
    obj.gamePlayers.map(function (gamePlayer) {
        if (id == gamePlayer.id) {
            app.player_1 = gamePlayer.player.userName;
            app.viewerPlayerId = gamePlayer.player.id;
            app.gameViewerSide = gamePlayer.player.side;
            app.viewerGameState = gamePlayer.gameState;
            app.viewerSalvoTurn = gamePlayer.salvoTurn;

            if (gamePlayer.player.side === "LIGHT") {
                $("#p1").removeClass("text-DARK");
                $("#p1").addClass("text-LIGHT");
                $("#p1-div").removeClass("para-DARK");
                $("#p1-div").addClass("para-LIGHT");
            } else if (gamePlayer.player.side === "DARK") {
                $("#p1").removeClass("text-LIGHT");
                $("#p1").addClass("text-DARK");
                $("#p1-div").removeClass("para-LIGHT");
                $("#p1-div").addClass("para-DARK");
            }
        } else if (id != gamePlayer.id) {
            app.player_2 = gamePlayer.player.userName;
            app.opponentSide = gamePlayer.player.side;
            if (gamePlayer.player.side === "LIGHT") {
                $("#p2").removeClass("text-DARK");
                $("#p2").addClass("text-LIGHT");
                $("#p2-div").removeClass("para-DARK");
                $("#p2-div").addClass("para-LIGHT");
            } else if (gamePlayer.player.side === "DARK") {
                $("#p2").removeClass("text-LIGHT");
                $("#p2").addClass("text-DARK");
                $("#p2-div").removeClass("para-LIGHT");
                $("#p2-div").addClass("para-DARK");
            }
        }
    });
}

function reducePlayerFont() {
    if ($("#p1").width() > 200) {
        $("#p1").removeClass("larger-text").addClass("shorten");
    }
}

//-------------------------------------------------------LOGOUT FUNCTION---------------------------------------------------------
$("#logout").click(function() {
    $.post("/api/logout")
    .done(function() {
        window.location.replace("/web/games.html");
    })
    .fail(function () {
        console.log("Failed to logout... ");
    })
});

//-------------------------------------------------------GET QUERY PARAM FUNCTION---------------------------------------------------------
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


//----------------------------------------------------------------WAITING OPPONENT----------------------------------------------------------------

function waitingOpponent() {
    $("#waiting-opponent-card").show();
}

//----------------------------------------------------------------AJAX POST NEW SHIPS-----------------------------------------------------------------
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
      console.log("Failed to add ships... ");
    })
}

//-------------------------------------------------------ON CLICK BATTLE - POST NEW SHIPS---------------------------------------------------------
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
        shipTypeAndCells.push(shipLoc);
    }
    postShips(shipTypeAndCells);
})

//-------------------------------------------------------ROTATE SHIPS EVENT---------------------------------------------------------
function setListener(grid) {
    $(".grid-stack-item").dblclick(function() {
        var h = parseInt($(this).attr("data-gs-height"));
        var w = parseInt($(this).attr("data-gs-width"));
        var posX = parseInt($(this).attr("data-gs-x"));
        var posY = parseInt($(this).attr("data-gs-y"));

        // Rotate Ships Mechanics...
        if (w>h) {
            if ( grid.isAreaEmpty(posX, posY+1, h, w-1) && posX+h<=10 && posY+w<=10 ) {
                grid.update($(this), posX, posY, h, w);
            } else if ( grid.isAreaEmpty(posX, posY-w+1, h, w-1) && posX+h<=10 && posY-w+1>=0 ) {
                grid.update($(this), posX, posY-w+1, h, w);
            } else {
                searchSpaceAndRotate($(this));
            }
        } else if (h>w) {
            if ( grid.isAreaEmpty(posX+1, posY, h-1, w) && posX+h<=10 ) {
                grid.update($(this), posX, posY, h, w);
            } else if ( grid.isAreaEmpty(posX+1, posY+1, h-1, w) && posX+h<=10 ) {
                grid.update($(this), posX, posY+1, h, w);
            } else if ( grid.isAreaEmpty(posX+1, posY+2, h-1, w) && posX+h<=10 ) {
                grid.update($(this), posX, posY+2, h, w);
            } else if ( grid.isAreaEmpty(posX, posY-1, h, w) && posX+h<=10 && posY>0) {
                grid.update($(this), posX, posY-1, h, w);
            } else if ( grid.isAreaEmpty(posX, posY-2, h, w) && posX+h<=10 && posY>1) {
                grid.update($(this), posX, posY-2, h, w);
            } else {
                searchSpaceAndRotate($(this));
            }
        }
        // When no space near to rotate, search the first available in Grid...
        function searchSpaceAndRotate(widget) {
            for (var j=0; j<10; j++) {
                var found = false;
                for (var i=0; i<10; i++) {
                    if ( grid.isAreaEmpty(i, j, h, w) && i+h<=10 && j+w<=10 ) {
                        grid.update(widget, i, j, h, w);
                        found = true;
                        break;
                    }
                }
                if (found===true){break;}
            }
        }
        // Ship Img rotation...
        var shipImgId = $(this).children().attr("id");
        switch (shipImgId) {
            case "dark-cruiser-img-v":
                $(this).children().attr("id", "dark-cruiser-img-h").attr("src", "css/images/icons/dark-cruiser-h.png");
                break;
            case "dark-cruiser-img-h":
                $(this).children().attr("id", "dark-cruiser-img-v").attr("src", "css/images/icons/dark-cruiser-v.png");
                break;
            case "dark-destroyer-img-h":
                $(this).children().attr("id", "dark-destroyer-img-v").attr("src", "css/images/icons/dark-destroyer-v.png");
                break;
            case "dark-destroyer-img-v":
                $(this).children().attr("id", "dark-destroyer-img-h").attr("src", "css/images/icons/dark-destroyer-h.png");
                break;
            case "dark-bomber-img-v":
                $(this).children().attr("id", "dark-bomber-img-h").attr("src", "css/images/icons/dark-bomber-h.png");
                break;
            case "dark-bomber-img-h":
                $(this).children().attr("id", "dark-bomber-img-v").attr("src", "css/images/icons/dark-bomber-v.png");
                break;
            case "dark-fighter-img-h":
                $(this).children().attr("id", "dark-fighter-img-v").attr("src", "css/images/icons/dark-fighter-v.png");
                break;
            case "dark-fighter-img-v":
                $(this).children().attr("id", "dark-fighter-img-h").attr("src", "css/images/icons/dark-fighter-h.png");
                break;
            case "dark-starfighter-img-v":
                $(this).children().attr("id", "dark-starfighter-img-h").attr("src", "css/images/icons/dark-starfighter-h.png");
                break;
            case "dark-starfighter-img-h":
                $(this).children().attr("id", "dark-starfighter-img-v").attr("src", "css/images/icons/dark-starfighter-v.png");
                break;
            case "light-cruiser-img-v":
                $(this).children().attr("id", "light-cruiser-img-h").attr("src", "css/images/icons/light-cruiser-h.png");
                break;
            case "light-cruiser-img-h":
                $(this).children().attr("id", "light-cruiser-img-v").attr("src", "css/images/icons/light-cruiser-v.png");
                break;
            case "light-destroyer-img-h":
                $(this).children().attr("id", "light-destroyer-img-v").attr("src", "css/images/icons/light-destroyer-v.png");
                break;
            case "light-destroyer-img-v":
                $(this).children().attr("id", "light-destroyer-img-h").attr("src", "css/images/icons/light-destroyer-h.png");
                break;
            case "light-bomber-img-v":
                $(this).children().attr("id", "light-bomber-img-h").attr("src", "css/images/icons/light-bomber-h.png");
                break;
            case "light-bomber-img-h":
                $(this).children().attr("id", "light-bomber-img-v").attr("src", "css/images/icons/light-bomber-v.png");
                break;
            case "light-fighter-img-h":
                $(this).children().attr("id", "light-fighter-img-v").attr("src", "css/images/icons/light-fighter-v.png");
                break;
            case "light-fighter-img-v":
                $(this).children().attr("id", "light-fighter-img-h").attr("src", "css/images/icons/light-fighter-h.png");
                break;
            case "light-starfighter-img-v":
                $(this).children().attr("id", "light-starfighter-img-h").attr("src", "css/images/icons/light-starfighter-h.png");
                break;
            case "light-starfighter-img-h":
                $(this).children().attr("id", "light-starfighter-img-v").attr("src", "css/images/icons/light-starfighter-v.png");
                break;
            default:
                break;
        }
    })
}

//-------------------------------------------------------PLACE NEW SHIPS WITH GRIDSTACK FRAMEWORK---------------------------------------------------------
function placeNewShips() {
    $("#place-ships-card").show();

    var options = {
        //grilla de 10 x 10
        width: 10,
        height: 10,
        //separacion entre elementos (les llaman widgets)
        verticalMargin: 0,
        //altura de las celdas
        cellHeight: 35,
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
        grid.addWidget($('<div><img id="dark-cruiser-img-v" class="grid-stack-item-content grab-cursor" src="css/images/icons/dark-cruiser-v.png" alt="cruiser"></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><img id="dark-destroyer-img-h" class="grid-stack-item-content grab-cursor" src="css/images/icons/dark-destroyer-h.png" alt="destroyer"></div>'),
        5, 1, 4, 1, false);
        grid.addWidget($('<div><img id="dark-bomber-img-v" class="grid-stack-item-content grab-cursor" src="css/images/icons/dark-bomber-v.png" alt="bomber"></div>'),
        4, 3, 1, 3, false);
        grid.addWidget($('<div><img id="dark-fighter-img-v" class="grid-stack-item-content grab-cursor" src="css/images/icons/dark-fighter-v.png" alt="fighter"></div>'),
        2, 6, 1, 3, false);
        grid.addWidget($('<div><img id="dark-starfighter-img-h" class="grid-stack-item-content grab-cursor" src="css/images/icons/dark-starfighter-h.png" alt="starFighter"></div>'),
        6, 7, 2, 1, false);

    } else if (app.gameViewerSide === "LIGHT") {
        grid.addWidget($('<div><img id="light-cruiser-img-v" class="grid-stack-item-content grab-cursor" src="css/images/icons/light-cruiser-v.png" alt="cruiser"></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><img id="light-destroyer-img-v" class="grid-stack-item-content grab-cursor" src="css/images/icons/light-destroyer-v.png" alt="destroyer"></div>'),
        8, 2, 1, 4, false);
        grid.addWidget($('<div><img id="light-bomber-img-v" class="grid-stack-item-content grab-cursor" src="css/images/icons/light-bomber-v.png" alt="bomber"></div>'),
        4, 2, 1, 3, false);
        grid.addWidget($('<div><img id="light-fighter-img-h" class="grid-stack-item-content grab-cursor" src="css/images/icons/light-fighter-h.png" alt="fighter"></div>'),
        1, 7, 3, 1, false);
        grid.addWidget($('<div><img id="light-starfighter-img-v" class="grid-stack-item-content grab-cursor" src="css/images/icons/light-starfighter-v.png" alt="starFighter"></div>'),
        6, 7, 1, 2, false);
    }
    setListener(grid);
}


//-------------------------------------------------------LOAD SHIPS FROM BACKEND WITH GRIDSTACK FRAMEWORK---------------------------------------------------------
function placeShipsFromBackEnd() {
    $("#place-ships-card").hide();

    var options = {
        width: 10,
        height: 10,
        verticalMargin: 0,
        cellHeight: 35,
        disableResize: true,
        float: true,
        disableOneColumnMode: true,
        staticGrid: true,
        animate: true
    }
    $('.grid-stack').gridstack(options);
    var grid = $('#grid').data('gridstack');

    app.gameViewerShips.map(function(ship) {
        var searchChar = ship.locations[0].slice(0, 1);
        var secondChar = ship.locations[1].slice(0, 1);
        if ( searchChar === secondChar ) {
            ship.position = "Horizontal";
        } else {
            ship.position = "Vertical";
        }
        for (var i=0; i < ship.locations.length; i++) {
            ship.locations[i] = ship.locations[i].replace(/A/g, '0');
            ship.locations[i] = ship.locations[i].replace(/B/g, '1');
            ship.locations[i] = ship.locations[i].replace(/C/g, '2');
            ship.locations[i] = ship.locations[i].replace(/D/g, '3');
            ship.locations[i] = ship.locations[i].replace(/E/g, '4');
            ship.locations[i] = ship.locations[i].replace(/F/g, '5');
            ship.locations[i] = ship.locations[i].replace(/G/g, '6');
            ship.locations[i] = ship.locations[i].replace(/H/g, '7');
            ship.locations[i] = ship.locations[i].replace(/I/g, '8');
            ship.locations[i] = ship.locations[i].replace(/J/g, '9');
        }

        var yInGrid = parseInt(ship.locations[0].slice(0, 1));
        var xInGrid = parseInt(ship.locations[0].slice(1, 3)) - 1;

        if (app.gameViewerSide === "DARK") {
            if (ship.type === "cruiser") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="dark-cruiser-img-h" class="grid-stack-item-content" src="css/images/icons/dark-cruiser-h.png" alt="cruiser"></div>'),
                    xInGrid, yInGrid, 5, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="dark-cruiser-img-v" class="grid-stack-item-content" src="css/images/icons/dark-cruiser-v.png" alt="cruiser"></div>'),
                    xInGrid, yInGrid, 1, 5, false);
                }
            } else if (ship.type === "destroyer") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="dark-destroyer-img-h" class="grid-stack-item-content" src="css/images/icons/dark-destroyer-h.png" alt="destroyer"></div>'),
                    xInGrid, yInGrid, 4, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="dark-destroyer-img-v" class="grid-stack-item-content" src="css/images/icons/dark-destroyer-v.png" alt="destroyer"></div>'),
                    xInGrid, yInGrid, 1, 4, false);
                }
            } else if (ship.type === "bomber") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="dark-bomber-img-h" class="grid-stack-item-content" src="css/images/icons/dark-bomber-h.png" alt="bomber"></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="dark-bomber-img-v" class="grid-stack-item-content" src="css/images/icons/dark-bomber-v.png" alt="bomber"></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "fighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="dark-fighter-img-h" class="grid-stack-item-content" src="css/images/icons/dark-fighter-h.png" alt="fighter"></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="dark-fighter-img-v" class="grid-stack-item-content" src="css/images/icons/dark-fighter-v.png" alt="fighter"></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "starFighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="dark-starfighter-img-h" class="grid-stack-item-content" src="css/images/icons/dark-starfighter-h.png" alt="starFighter"></div>'),
                    xInGrid, yInGrid, 2, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="dark-starfighter-img-v" class="grid-stack-item-content" src="css/images/icons/dark-starfighter-v.png" alt="starFighter"></div>'),
                    xInGrid, yInGrid, 1, 2, false);
                }
            }

        } else if (app.gameViewerSide === "LIGHT") {
            if (ship.type === "cruiser") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="light-cruiser-img-h" class="grid-stack-item-content" src="css/images/icons/light-cruiser-h.png" alt="cruiser"></div>'),
                    xInGrid, yInGrid, 5, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="light-cruiser-img-v" class="grid-stack-item-content" src="css/images/icons/light-cruiser-v.png" alt="cruiser"></div>'),
                    xInGrid, yInGrid, 1, 5, false);
                }
            } else if (ship.type === "destroyer") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="light-destroyer-img-h" class="grid-stack-item-content" src="css/images/icons/light-destroyer-h.png" alt="destroyer"></div>'),
                    xInGrid, yInGrid, 4, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="light-destroyer-img-v" class="grid-stack-item-content" src="css/images/icons/light-destroyer-v.png" alt="destroyer"></div>'),
                    xInGrid, yInGrid, 1, 4, false);
                }
            } else if (ship.type === "bomber") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="light-bomber-img-h" class="grid-stack-item-content" src="css/images/icons/light-bomber-h.png" alt="bomber"></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="light-bomber-img-v" class="grid-stack-item-content" src="css/images/icons/light-bomber-v.png" alt="bomber"></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "fighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="light-fighter-img-h" class="grid-stack-item-content" src="css/images/icons/light-fighter-h.png" alt="fighter"></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="light-fighter-img-v" class="grid-stack-item-content" src="css/images/icons/light-fighter-v.png" alt="fighter"></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "starFighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><img id="light-starfighter-img-h" class="grid-stack-item-content" src="css/images/icons/light-starfighter-h.png" alt="starFighter"></div>'),
                    xInGrid, yInGrid, 2, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><img id="light-starfighter-img-v" class="grid-stack-item-content" src="css/images/icons/light-starfighter-v.png" alt="starFighter"></div>'),
                    xInGrid, yInGrid, 1, 2, false);
                }
            }
        }
    })
}

//-------------------------------------------------------CHANGE SALVO CURRENT TURN---------------------------------------------------------
function displaySalvoTurn(gameState) {

    $("#fire-card").show();
    $("#turn-card").show();
    $("#turn-number").html(app.viewerSalvoTurn);

    if (gameState === "WAIT_OPPONENT_SALVO") {
        $("#turn-state").html("Wait Enemy Fire...")
    } else if (gameState === "ENTER_SALVO") {
        $("#turn-state").html("Aim 1 to 5 spots on <b>Blasting Grid</b>.<br><b>Fire</b> when Ready.")
    }
}

function waitingOpponentShips() {
    $("#fire-card").show();
    $("#waiting-opponent-ships-card").show();
}


//----------------------------------------------------------------AJAX POST SALVOS-----------------------------------------------------------------
function postSalvos(salvoJSON) {
    var gamePlayerId = getQueryVariable("gp");
    $.post({
        url: "/api/games/players/"+gamePlayerId+"/salvos",
        data: JSON.stringify(salvoJSON),
        dataType: "text",
        contentType: "application/json"
    })
    .done(function (response) {
        if ($("#salvo-action").hasClass("game-play-alert")) {
            $("#salvo-action").removeClass("game-play-alert");
        }
        loadData();
        console.log( "Salvo added: " + response );
    })
    .fail(function () {
        console.log("Failed to add salvo... ");
    })
}

//----------------------------------------------FIRE SOUND----------------------------------------------
function playFireSound() {
   var fireAudio = document.getElementById("fire-audio");
   fireAudio.play();
}
//-------------------------------------------------------WHEN SHIPS CREATED...---------------------------------------------------------

    //-------------------------------------------------------CREATE SALVOS IN GRID---------------------------------------------------------
    $("#salvo-body > tr > td").click(function() {
        if ( $(this).children().hasClass("spark-salvo") || $(this).hasClass("grid-letter")) {
            return;
        } else if ( $(this).children().hasClass("aim-img") ) {
            $(this).html("");
        } else if ( $(".aim-img").length < 5 ) {
            var letter = $(this).parent().attr("class");
            var number = $(this).attr("class");
            var cell = letter+number;

            $(this).html("<img data-cell='"+cell+"'class='aim-img' src='css/images/aim.png'>");
        }
    })
    //-------------------------------------------------ON CLICK FIRE - POST NEW SALVO------------------------------------------------------
    $("#salvo-col").on("click", "#fire-salvo-btn", function(){

        if ( $(".aim-img").length != 0 && $(".aim-img").length <= 5 ) {
            var salvoJSON = {};
            var turn = $("#turn-number").text();
            var shots = [];
            $(".aim-img").each(function() {
               shots.push($(this).data("cell"));
            })
            salvoJSON.turn = turn;
            salvoJSON.shots = shots;
            playFireSound();
            postSalvos(salvoJSON);

        } else {
            if (!$("#salvo-action").hasClass("game-play-alert")) {
                $("#salvo-action").addClass("game-play-alert");
            }
        }
    })


//-------------------------------------------------------DISPLAY SALVOS FUNCTION---------------------------------------------------------
function displaySalvoes(gamePlayerId, gameDTO) {

    $("#salvo-col").show();

    for (var i=0;i<gameDTO.gamePlayers.length;i++){

        if (gameDTO.gamePlayers[i].id == gamePlayerId) {
            var thisPlayerId = gameDTO.gamePlayers[i].player.id;
            gameDTO.salvoes.map(function (salvo) {
                // --------------------------------------------------- OPPONENT GRID ----------------------------------------------------
                if (salvo.player == thisPlayerId) {
                    // --------------------------------------------------- HITS or MISSES ----------------------------------------------------
                    for (var e=0;e<salvo.locations.length;e++){
                        var letterP1 = salvo.locations[e].substring(0, 1);
                        var numberP1 = salvo.locations[e].substring(1, 3);

                        if (salvo.hits.indexOf(salvo.locations[e]) != -1) {
                           $("#salvo-body>."+letterP1+" td:eq("+numberP1+")").html('<img class="spark-salvo" src="css/images/spark.gif">');
                        } else {
                           $("#salvo-body>."+letterP1+" td:eq("+numberP1+")").html('<img class="spark-salvo" src="css/images/cross.png">');
                        }
                    }
                    // --------------------------------------------------- SINKS ----------------------------------------------------
                    for (var ss=0;ss<salvo.sinks.length;ss++) {

                        for (var s=0;s<salvo.sinks[ss].locations.length;s++) {
                            var sinkLetter = salvo.sinks[ss].locations[s].substring(0, 1);
                            var sinkNumber = salvo.sinks[ss].locations[s].substring(1, 3);
                            var sinkCell = $("#salvo-body>."+sinkLetter+" td:eq("+sinkNumber+")");

                            if (!sinkCell.hasClass("bg-salvo")) {
                                sinkCell.addClass("bg-salvo");
                            }
                        }

                        if (app.opponentSide === "LIGHT") {
                            switch (salvo.sinks[ss].type) {
                                case "cruiser":
                                    $("#light-cruiser-img-v2").attr("src", "css/images/icons/light-cruiser-v2.png");
                                    break;
                                case "destroyer":
                                    $("#light-destroyer-img-v2").attr("src", "css/images/icons/light-destroyer-v2.png");
                                    break;
                                case "bomber":
                                    $("#light-bomber-img-v2").attr("src", "css/images/icons/light-bomber-v2.png");
                                    break;
                                case "fighter":
                                    $("#light-fighter-img-h2").attr("src", "css/images/icons/light-fighter-h2.png");
                                    break;
                                case "starFighter":
                                    $("#light-starfighter-img-v2").attr("src", "css/images/icons/light-starfighter-v2.png");
                                    break;
                                default:
                                    break;
                            }
                        } else if (app.opponentSide === "DARK") {
                            switch (salvo.sinks[ss].type) {
                                case "cruiser":
                                   $("#dark-cruiser-img-v2").attr("src", "css/images/icons/dark-cruiser-v2.png");
                                   break;
                                case "destroyer":
                                   $("#dark-destroyer-img-h2").attr("src", "css/images/icons/dark-destroyer-h2.png");
                                   break;
                                case "bomber":
                                   $("#dark-bomber-img-v2").attr("src", "css/images/icons/dark-bomber-v2.png");
                                   break;
                                case "fighter":
                                   $("#dark-fighter-img-v2").attr("src", "css/images/icons/dark-fighter-v2.png");
                                   break;
                                case "starFighter":
                                   $("#dark-starfighter-img-h2").attr("src", "css/images/icons/dark-starfighter-h2.png");
                                   break;
                                default:
                                   break;
                            }
                        }
                    }
                // --------------------------------------------------- MY GRID ----------------------------------------------------
                } else if (salvo.player != thisPlayerId) {
                    // --------------------------------------------------- HITS or MISSES ----------------------------------------------------
                    for (var h=0;h<salvo.locations.length;h++){
                        var letter = salvo.locations[h].substring(0, 1);
                        var number = salvo.locations[h].substring(1, 3)-1;

                        switch(letter) {
                            case "A":letter = 0;break;
                            case "B":letter = 1;break;
                            case "C":letter = 2;break;
                            case "D":letter = 3;break;
                            case "E":letter = 4;break;
                            case "F":letter = 5;break;
                            case "G":letter = 6;break;
                            case "H":letter = 7;break;
                            case "I":letter = 8;break;
                            case "J":letter = 9;break;
                            default:letter = 0;break;
                        }

                        if ( app.allShipPositions.indexOf(salvo.locations[h]) != -1 ) {
                           $('#grid').append('<div style="position:absolute; top:'+letter*35+'px; left:'+number*35+'px;"><img class="spark" src="css/images/spark.gif"></div>');
                        } else {
                           $('#grid').append('<div style="position:absolute; top:'+letter*35+'px; left:'+number*35+'px;"><img class="spark" src="css/images/cross.png"></div>');
                        }
                    }
                    // --------------------------------------------------- MY SINKS ----------------------------------------------------
                    for (var ms=0;ms<salvo.sinks.length;ms++) {

                        if (app.gameViewerSide === "DARK") {
                            switch (salvo.sinks[ms].type) {
                                case "cruiser":
                                    $("#my-dark-cruiser > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "destroyer":
                                    $("#my-dark-destroyer > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "bomber":
                                    $("#my-dark-bomber > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "fighter":
                                    $("#my-dark-fighter > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "starFighter":
                                    $("#my-dark-starFighter > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                            }
                        } else if (app.gameViewerSide === "LIGHT") {
                            switch (salvo.sinks[ms].type) {
                                case "cruiser":
                                    $("#my-light-cruiser > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "destroyer":
                                    $("#my-light-destroyer > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "bomber":
                                    $("#my-light-bomber > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "fighter":
                                    $("#my-light-fighter > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                                case "starFighter":
                                    $("#my-light-starFighter > img").attr("src", "css/images/not-ok.png").parent().addClass("my-ship-out");
                                    break;
                            }
                        }
                    }
                }
            });
            break;
        }
    }
}
