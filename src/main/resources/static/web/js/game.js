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
        viewerShotsToMake: 0,
        viewerGameState: "",
        viewerGamePlayerId: 0,
        opponentGamePlayerId: 0

    }
});


//-------------------------------------------------------------WHEN DOM READY, CALL LOAD DATA---------------------------------------------------------
function doMediaQuery(maxWidth500) {
    if (maxWidth500.matches) { // If media query matches
        stopRefreshing();
        refreshData(25);
        loadData(25);
    } else {
        stopRefreshing();
        refreshData(35);
        loadData(35);
    }
}
var maxWidth500 = window.matchMedia("(max-width: 500px)");
maxWidth500.addListener(doMediaQuery); // Attach listener function on state changes

$(function() {

doMediaQuery(maxWidth500); // Call listener function at run time


});

//-------------------------------------------------------------------REFRESH DATA WHEN WAITING OPPONENT MOVE---------------------------------------------------------
var timerId;

function refreshData(gridStackCellNumber) {
    timerId = setInterval(function() { loadData(gridStackCellNumber); }, 5000);
}

function stopRefreshing() {
    clearInterval(timerId);
}


//-------------------------------------------------------MAIN FUNCTION WHEN PAGE LOADS - AJAX GET DATA---------------------------------------------------------
function loadData(gridStackCellNumber) {
    var gamePlayerId = getQueryVariable("gp");
    $.get("/api/game_view/"+gamePlayerId).done(function(gameDTO) {

        showPlayersByGamePlayerId(gamePlayerId, gameDTO);

        if (app.gameViewerSide === "DARK") {
            $(".container-fluid").addClass("bkg-empire");
            $("#app").addClass("shd-dark");
            $("#battlelog>.card").addClass("card-dark");
            if (!isDarkPlaying() && !(app.viewerGameState === "WIN" || app.viewerGameState === "LOSE" || app.viewerGameState === "DRAW")) {
                playDarkTheme();
            }

        } else if (app.gameViewerSide === "LIGHT") {
            $(".container-fluid").addClass("bkg-rebels");
            $("#app").addClass("shd-light");
            $("#battlelog>.card").addClass("card-light");
            if (!isLightPlaying() && !(app.viewerGameState === "WIN" || app.viewerGameState === "LOSE" || app.viewerGameState === "DRAW")) {
                playLightTheme();
            }
        }

        if (app.viewerGameState === "WAIT_OPPONENT") {
            waitingOpponent();
        } else if (app.viewerGameState === "PLACE_SHIPS") {
            stopRefreshing();
            $("#p1-div").addClass("para-turn");
            $("#p2-div").removeClass("para-turn");
            var grid = $('#grid').data('gridstack');
                if ( typeof grid != 'undefined' ) {
                    grid.removeAll();
                    grid.destroy(false);
                }
            if ( $("#grid").children().length != 5 ) {
                placeNewShips(gridStackCellNumber);
            }
        } else if (app.viewerGameState === "WAIT_OPPONENT_SHIPS") {
            waitingOpponentShips();
            getShipCol(gameDTO, gridStackCellNumber);

        } else if (app.viewerGameState === "ENTER_SALVO" || app.viewerGameState === "WAIT_OPPONENT_SALVO") {
            $("#waiting-opponent-ships-card").hide();
            getShipCol(gameDTO, gridStackCellNumber);
            displaySalvoTurn(app.viewerGameState);
            displaySalvoes(gamePlayerId, gameDTO, gridStackCellNumber);

        } else if (app.viewerGameState === "WIN" || app.viewerGameState === "LOSE" || app.viewerGameState === "DRAW" || app.viewerGameState === "EPIC_WIN") {
            stopRefreshing();
            if (app.gameViewerSide === "DARK") {
                stopDarkTheme();
            }
            if (app.gameViewerSide === "LIGHT") {
                stopLightTheme();
            }
            getShipCol(gameDTO, gridStackCellNumber);
            displaySalvoes(gamePlayerId, gameDTO, gridStackCellNumber);
            displayWinLoseDraw(app.viewerGameState);
        }
        $("#loading-page-div").hide();
    })
    .fail(function () {
        console.log("Failed to get game view data... ");
    });
}

//----------------------------------------------------GET SHIP COL---------------------------------------------------------
function getShipCol(gameDTO, gridStackCellNumber) {
            var grid = $('#grid').data('gridstack');
            if ( typeof grid != 'undefined' ) {
                grid.removeAll();
                grid.destroy(false);
            }
            app.gameViewerShips = gameDTO.ships;
            getAllShipLocations(app.gameViewerShips);
            placeShipsFromBackEnd(gridStackCellNumber);
            displayMyShips();
}

//----------------------------------------------------GET ALL SHIP CELLS LOCATION TO COMPARE WITH SALVOS---------------------------------------------------------
function getAllShipLocations(set) {
    set.map(function(ship) {
        for (var i=0; i<ship.locations.length; i++){
            app.allShipPositions.push(ship.locations[i]);
        }
    });
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
            app.viewerGamePlayerId = gamePlayer.id;
            app.player_1 = gamePlayer.player.userName;
            app.viewerPlayerId = gamePlayer.player.id;
            app.gameViewerSide = gamePlayer.player.side;
            app.viewerGameState = gamePlayer.gameState;
            app.viewerSalvoTurn = gamePlayer.salvoTurn;
            app.viewerShotsToMake = gamePlayer.shotsToMake;

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
            app.opponentGamePlayerId = gamePlayer.id;
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
    $("#p1-div").addClass("para-turn");
    $("#waiting-opponent-card").show();
}

function waitingOpponentShips() {
    $("#p1-div").removeClass("para-turn");
    $("#p2-div").addClass("para-turn");
    $("#fire-card").show();
    $("#waiting-opponent-ships-card").show();
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
      playEngineSound();
      doMediaQuery(maxWidth500);
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
    $(".grid-stack-item").click(function() {
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
                $(this).children().attr("id", "dark-cruiser-img-h");
                break;
            case "dark-cruiser-img-h":
                $(this).children().attr("id", "dark-cruiser-img-v");
                break;
            case "dark-destroyer-img-h":
                $(this).children().attr("id", "dark-destroyer-img-v");
                break;
            case "dark-destroyer-img-v":
                $(this).children().attr("id", "dark-destroyer-img-h");
                break;
            case "dark-bomber-img-v":
                $(this).children().attr("id", "dark-bomber-img-h");
                break;
            case "dark-bomber-img-h":
                $(this).children().attr("id", "dark-bomber-img-v");
                break;
            case "dark-fighter-img-h":
                $(this).children().attr("id", "dark-fighter-img-v");
                break;
            case "dark-fighter-img-v":
                $(this).children().attr("id", "dark-fighter-img-h");
                break;
            case "dark-starfighter-img-v":
                $(this).children().attr("id", "dark-starfighter-img-h");
                break;
            case "dark-starfighter-img-h":
                $(this).children().attr("id", "dark-starfighter-img-v");
                break;
            case "light-cruiser-img-v":
                $(this).children().attr("id", "light-cruiser-img-h");
                break;
            case "light-cruiser-img-h":
                $(this).children().attr("id", "light-cruiser-img-v");
                break;
            case "light-destroyer-img-h":
                $(this).children().attr("id", "light-destroyer-img-v");
                break;
            case "light-destroyer-img-v":
                $(this).children().attr("id", "light-destroyer-img-h");
                break;
            case "light-bomber-img-v":
                $(this).children().attr("id", "light-bomber-img-h");
                break;
            case "light-bomber-img-h":
                $(this).children().attr("id", "light-bomber-img-v");
                break;
            case "light-fighter-img-h":
                $(this).children().attr("id", "light-fighter-img-v");
                break;
            case "light-fighter-img-v":
                $(this).children().attr("id", "light-fighter-img-h");
                break;
            case "light-starfighter-img-v":
                $(this).children().attr("id", "light-starfighter-img-h");
                break;
            case "light-starfighter-img-h":
                $(this).children().attr("id", "light-starfighter-img-v");
                break;
            default:
                break;
        }
    })
}

//-------------------------------------------------------PLACE NEW SHIPS WITH GRIDSTACK FRAMEWORK---------------------------------------------------------
function placeNewShips(number) {

    $("#waiting-opponent-card").hide();
    $("#place-ships-card").show();


    var options = {
        //grilla de 10 x 10
        width: 10,
        height: 10,
        //separacion entre elementos (les llaman widgets)
        verticalMargin: 0,
        //altura de las celdas
        cellHeight: number,
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
        grid.addWidget($('<div><div id="dark-cruiser-img-v" class="grid-stack-item-content grab-cursor" alt="cruiser"></div></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><div id="dark-destroyer-img-h" class="grid-stack-item-content grab-cursor" alt="destroyer"></div></div>'),
        5, 1, 4, 1, false);
        grid.addWidget($('<div><div id="dark-bomber-img-v" class="grid-stack-item-content grab-cursor" alt="bomber"></div></div>'),
        4, 3, 1, 3, false);
        grid.addWidget($('<div><div id="dark-fighter-img-v" class="grid-stack-item-content grab-cursor" alt="fighter"></div></div>'),
        2, 6, 1, 3, false);
        grid.addWidget($('<div><div id="dark-starfighter-img-h" class="grid-stack-item-content grab-cursor" alt="starFighter"></div></div>'),
        6, 7, 2, 1, false);

    } else if (app.gameViewerSide === "LIGHT") {
        grid.addWidget($('<div><div id="light-cruiser-img-v" class="grid-stack-item-content grab-cursor" alt="cruiser"></div></div>'),
        1, 0, 1, 5, false);
        grid.addWidget($('<div><div id="light-destroyer-img-v" class="grid-stack-item-content grab-cursor" alt="destroyer"></div></div>'),
        8, 2, 1, 4, false);
        grid.addWidget($('<div><div id="light-bomber-img-v" class="grid-stack-item-content grab-cursor" alt="bomber"></div></div>'),
        4, 2, 1, 3, false);
        grid.addWidget($('<div><div id="light-fighter-img-h" class="grid-stack-item-content grab-cursor" alt="fighter"></div></div>'),
        1, 7, 3, 1, false);
        grid.addWidget($('<div><div id="light-starfighter-img-v" class="grid-stack-item-content grab-cursor" alt="starFighter"></div></div>'),
        6, 7, 1, 2, false);
    }
    setListener(grid);
}

//-------------------------------------------------------LOAD SHIPS FROM BACKEND WITH GRIDSTACK FRAMEWORK---------------------------------------------------------
function placeShipsFromBackEnd(number) {
    $("#place-ships-card").hide();

    var options = {
        width: 10,
        height: 10,
        verticalMargin: 0,
        cellHeight: number,
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
                    grid.addWidget($('<div><div id="dark-cruiser-img-h" class="grid-stack-item-content" alt="cruiser"></div></div>'),
                    xInGrid, yInGrid, 5, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="dark-cruiser-img-v" class="grid-stack-item-content" alt="cruiser"></div></div>'),
                    xInGrid, yInGrid, 1, 5, false);
                }
            } else if (ship.type === "destroyer") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="dark-destroyer-img-h" class="grid-stack-item-content" alt="destroyer"></div></div>'),
                    xInGrid, yInGrid, 4, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="dark-destroyer-img-v" class="grid-stack-item-content" alt="destroyer"></div></div>'),
                    xInGrid, yInGrid, 1, 4, false);
                }
            } else if (ship.type === "bomber") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="dark-bomber-img-h" class="grid-stack-item-content" alt="bomber"></div></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="dark-bomber-img-v" class="grid-stack-item-content" alt="bomber"></div></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "fighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="dark-fighter-img-h" class="grid-stack-item-content" alt="fighter"></div></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="dark-fighter-img-v" class="grid-stack-item-content" alt="fighter"></div></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "starFighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="dark-starfighter-img-h" class="grid-stack-item-content" alt="starFighter"></div></div>'),
                    xInGrid, yInGrid, 2, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="dark-starfighter-img-v" class="grid-stack-item-content" alt="starFighter"></div></div>'),
                    xInGrid, yInGrid, 1, 2, false);
                }
            }

        } else if (app.gameViewerSide === "LIGHT") {
            if (ship.type === "cruiser") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="light-cruiser-img-h" class="grid-stack-item-content" alt="cruiser"></div></div>'),
                    xInGrid, yInGrid, 5, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="light-cruiser-img-v" class="grid-stack-item-content" alt="cruiser"></div></div>'),
                    xInGrid, yInGrid, 1, 5, false);
                }
            } else if (ship.type === "destroyer") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="light-destroyer-img-h" class="grid-stack-item-content" alt="destroyer"></div></div>'),
                    xInGrid, yInGrid, 4, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="light-destroyer-img-v" class="grid-stack-item-content" alt="destroyer"></div></div>'),
                    xInGrid, yInGrid, 1, 4, false);
                }
            } else if (ship.type === "bomber") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="light-bomber-img-h" class="grid-stack-item-content" alt="bomber"></div></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="light-bomber-img-v" class="grid-stack-item-content" alt="bomber"></div></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "fighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="light-fighter-img-h" class="grid-stack-item-content" alt="fighter"></div></div>'),
                    xInGrid, yInGrid, 3, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="light-fighter-img-v" class="grid-stack-item-content" alt="fighter"></div></div>'),
                    xInGrid, yInGrid, 1, 3, false);
                }
            } else if (ship.type === "starFighter") {
                if (ship.position === "Horizontal") {
                    grid.addWidget($('<div><div id="light-starfighter-img-h" class="grid-stack-item-content" alt="starFighter"></div></div>'),
                    xInGrid, yInGrid, 2, 1, false);
                } else if (ship.position === "Vertical") {
                    grid.addWidget($('<div><div id="light-starfighter-img-v" class="grid-stack-item-content" alt="starFighter"></div></div>'),
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
    $("#turn-title").show();
    $("#turn-number").html(app.viewerSalvoTurn);

    if (gameState === "WAIT_OPPONENT_SALVO") {
        $("#p1-div").removeClass("para-turn");
        $("#p2-div").addClass("para-turn");
        $("#fire-salvo-btn").html("Wait...").attr("disabled", true);
        $("#turn-state").html("Wait Enemy Fire...");
    } else if (gameState === "ENTER_SALVO") {
        if (!(app.viewerSalvoTurn===1&&app.viewerGamePlayerId<app.opponentGamePlayerId)) {
            playFire2();
        }
        $("#p1-div").addClass("para-turn");
        $("#p2-div").removeClass("para-turn");
        $("#fire-salvo-btn").html("<b>Fire!</b>").attr("disabled", false);
        stopRefreshing();
        if (app.viewerShotsToMake > 1) {
            $("#turn-state").html("Aim at "+app.viewerShotsToMake+" cells on<br><b>Target Grid</b>.<br><b>Fire</b> when Ready.");
        } else if (app.viewerShotsToMake === 1) {
            $("#turn-state").html("Aim at "+app.viewerShotsToMake+" cell on<br> <b>Target Grid</b>.<br><b>Fire</b> when Ready.");
        }
    }
}

//-------------------------------------------------------CHANGE SALVO CURRENT TURN---------------------------------------------------------
function displayWinLoseDraw(gameState) {
        if (app.viewerGamePlayerId<app.opponentGamePlayerId) {
            playFire2();
        }
        $("#p1-div").removeClass("para-turn");
        $("#p2-div").removeClass("para-turn");
        $("#fire-salvo-btn").html("Ended").attr("disabled", true);
        $("#fire-card").show();
        $("#turn-title").hide();
        $("#turn-card").hide();

        if (gameState === "WIN") {
            $("#win-card").show();
            if (app.gameViewerSide==="DARK") {
                $("#end-game").addClass("end-dark").show();
                playDarkWin();
            } else if (app.gameViewerSide==="LIGHT") {
                $("#end-game").addClass("end-light").show();
                playLightWin();
            }
            setTimeout(function(){ $("#end-game-win").show(); }, 3500);
            setTimeout(function(){ $("#end-game-back-btn").show(); }, 5000);

        } else if (gameState === "LOSE") {
            $("#lose-card").show();
            if (app.gameViewerSide==="DARK") {
                $("#end-game").addClass("end-dark").show();
                setTimeout(function(){ playDarkLose(); }, 3500);
            } else if (app.gameViewerSide==="LIGHT") {
                $("#end-game").addClass("end-light").show();
                setTimeout(function(){ playLightLose(); }, 3000);
            }
            setTimeout(function(){ $("#end-game-lose").show(); }, 3500);
            setTimeout(function(){ $("#end-game-back-btn").show(); }, 5000);



        } else if (gameState === "DRAW") {
            $("#draw-card").show();

            if (app.gameViewerSide==="DARK") {
                $("#end-game").addClass("end-dark").show();
            } else if (app.gameViewerSide==="LIGHT") {
                $("#end-game").addClass("end-light").show();
            }
            setTimeout(function(){ $("#end-game-draw").show(); }, 3500);
            setTimeout(function(){ $("#end-game-back-btn").show(); }, 5000);

        } else if (gameState === "EPIC_WIN") {
            $("#win-card").show();
            $("#end-game").addClass("end-dark").show();
            playDarkWin();

            setTimeout(function(){ $("#end-game-epic").show(); }, 3500);
            setTimeout(function(){ $("#epic-video").show(); }, 8000);
            setTimeout(function(){ playEpic(); }, 9000);
            setTimeout(function(){ $("#end-game-back-btn").show(); }, 52000);
        }
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
        if ($("#turn-state").hasClass("game-play-alert")) {
            $("#turn-state").removeClass("game-play-alert");
        }
        doMediaQuery(maxWidth500);
        console.log( "Salvo added: " + response );
    })
    .fail(function () {
        console.log("Failed to add salvo... ");
    })
}


//-------------------------------------------------------EVENT CLICK AIM ON GRID---------------------------------------------------------
$("#salvo-body > tr > td").click(function () {
    if (app.viewerGameState === "ENTER_SALVO") {
        if ( $(this).children().hasClass("cross-salvo") || $(this).children().hasClass("spark-salvo") || $(this).hasClass("grid-letter")) {
            return;
        } else if ( $(this).children().hasClass("aim-img") ) {
            $(this).html("");
        } else if ( $(".aim-img").length < app.viewerShotsToMake ) {
            var letter = $(this).parent().attr("class");
            var number = $(this).attr("class");
            var cell = letter+number;

            $(this).html("<div data-cell='"+cell+"'class='aim-img'></div>");
        }
    }
})
    //-------------------------------------------------ON CLICK FIRE - POST NEW SALVO------------------------------------------------------
    $("#salvo-col").on("click", "#fire-salvo-btn", function() {

        if ( $(".aim-img").length === app.viewerShotsToMake ) {
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
            if (!$("#turn-state").hasClass("game-play-alert")) {
            // aca no va ningun mensaje
                $("#turn-state").addClass("game-play-alert");
                //BUSCAR UN AUDIO PARA TIRAR ACA SI NO PUSISTE TODOS LOS TIROS!!!!!!!!!!!!!!!!!!!!!!!!!!!
            }
        }
    })


//-------------------------------------------------------DISPLAY SALVOS FUNCTION---------------------------------------------------------
function displaySalvoes(gamePlayerId, gameDTO, cellHeight) {

    $("#salvo-col").show();
    $(".hitsAndMissesAbsoluteDiv").remove();

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
                           $("#salvo-body>."+letterP1+" td:eq("+numberP1+")").html('<div class="spark-salvo"></div>');
                        } else {
                           $("#salvo-body>."+letterP1+" td:eq("+numberP1+")").html('<div class="cross-salvo"></div>');
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
                           $('#grid').append('<div class="hitsAndMissesAbsoluteDiv" style="position:absolute; top:'+letter*cellHeight+'px; left:'+number*cellHeight+'px;"><div class="spark"></div></div>');
                        } else {
                           $('#grid').append('<div class="hitsAndMissesAbsoluteDiv" style="position:absolute; top:'+letter*cellHeight+'px; left:'+number*cellHeight+'px;"><div class="cross"></div></div>');
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





//---------------------------------------------- SOUND EFFECTS ----------------------------------------------
function playFireSound() {
   var fireAudio = document.getElementById("fire-audio");
   fireAudio.play();
}
function playFire2() {
   var fireAudio = document.getElementById("fire-2-audio");
   fireAudio.play();
}
function playEngineSound() {
   var engineAudio = document.getElementById("engine-audio");
   engineAudio.play();
}
function playDarkLose() {
   var darkLose = document.getElementById("dark-lose");
   darkLose.play();
}
function playLightLose() {
   var lightLose = document.getElementById("light-lose");
   lightLose.play();
}
function playDarkWin() {
   var darkWin = document.getElementById("dark-win");
   darkWin.play();
}
function playLightWin() {
   var lightWin = document.getElementById("light-win");
   lightWin.play();
}
function playEpic() {
   var epicVid = document.getElementById("epic-video");
   epicVid.play();
}
//----------------------------------------------LIGHT THEME----------------------------------------------
function playLightTheme() {
   var random = Math.floor((Math.random() * 3) + 1);
   var lightTheme = document.getElementById("light-theme");

   if (random === 1) {
      $("#light-theme").html('<source src="css/audio/light-theme-1.mp3" type="audio/mp3">');
   } else if (random === 2) {
      $("#light-theme").html('<source src="css/audio/light-theme-2.mp3" type="audio/mp3">');
   } else if (random === 3) {
      $("#light-theme").html('<source src="css/audio/light-theme-3.mp3" type="audio/mp3">');
   }
   lightTheme.play();
}
function stopLightTheme() {
   var lightTheme = document.getElementById("light-theme");
   lightTheme.pause();
   lightTheme.currentTime = 0;
}
function isLightPlaying() {
    var audio = document.getElementById("light-theme");
    return !audio.paused;
}
//----------------------------------------------DARK THEME----------------------------------------------
function playDarkTheme() {
   var random = Math.floor((Math.random() * 3) + 1);
   var darkTheme = document.getElementById("dark-theme");

   if (random === 1) {
      $("#dark-theme").html('<source src="css/audio/dark-theme-1.mp3" type="audio/mp3">');
   } else if (random === 2) {
      $("#dark-theme").html('<source src="css/audio/dark-theme-2.mp3" type="audio/mp3">');
   } else if (random === 3) {
      $("#dark-theme").html('<source src="css/audio/dark-theme-3.mp3" type="audio/mp3">');
   }
   darkTheme.play();
}

function stopDarkTheme() {
   var darkTheme = document.getElementById("dark-theme");
   darkTheme.pause();
   darkTheme.currentTime = 0;
}
function isDarkPlaying() {
    var audio = document.getElementById("dark-theme");
    return !audio.paused;
}