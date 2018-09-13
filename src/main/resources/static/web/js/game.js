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
    gameViewerShips: []
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
        displaySalvoes(gamePlayerId, gameDTO);

        if (app.gameViewerSide === "DARK") {
            $(".container-fluid").addClass("bkg-empire");
            $("#app").addClass("shd-dark");
            $("#audio-theme").html('<source src="css/audio/dark-side-theme.mp3" type="audio/mp3">');
        } else if (app.gameViewerSide === "LIGHT") {
            $(".container-fluid").addClass("bkg-rebels");
            $("#app").addClass("shd-light");
            $("#audio-theme").html('<source src="css/audio/light-side-theme.mp3" type="audio/mp3">');
        }

        if (gameDTO.ships.length === 0) {
            placeNewShips();
        } else {
            var grid = $('#grid').data('gridstack');
            if ( typeof grid != 'undefined' ) {
                grid.removeAll();
                grid.destroy(false);
            }
            app.gameViewerShips = gameDTO.ships;
            placeShipsFromBackEnd();
        }
    })
    .fail(function () {
        console.log("Failed to get game view data... ");
    });
}

//-------------------------------------------------------SHOW PLAYERS NAMES---------------------------------------------------------
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

//-------------------------------------------------------DISPLAY SALVOS FUNCTION---------------------------------------------------------
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
                $(this).children().attr("id", "default-img").attr("src", "css/images/star.png");
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
        grid.addWidget($('<div><img id="dark-destroyer-img-h" class="grid-stack-item-content" src="css/images/icons/dark-destroyer-h.png" alt="destroyer"></div>'),
        5, 1, 4, 1, false);
        grid.addWidget($('<div><img id="dark-bomber-img-v" class="grid-stack-item-content" src="css/images/icons/dark-bomber-v.png" alt="bomber"></div>'),
        4, 3, 1, 3, false);
        grid.addWidget($('<div><img id="dark-fighter-img-v" class="grid-stack-item-content" src="css/images/icons/dark-fighter-v.png" alt="fighter"></div>'),
        2, 6, 1, 3, false);
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


//-------------------------------------------------------LOAD SHIPS FROM BACKEND WITH GRIDSTACK FRAMEWORK---------------------------------------------------------
function placeShipsFromBackEnd() {
    $("#place-ships-card").hide();

    var options = {
        width: 10,
        height: 10,
        verticalMargin: 0,
        cellHeight: 35,
        cellWidth: 35,
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
