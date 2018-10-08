//--------------------------------VUE TEMPLATE----------------------------------
var app = new Vue({
  el: "#app",
  data: {
    liveGames: [],
    endedGames: [],
    current_player: [],
    playersLeaderBoard: [],
    lightLeaders:[],
    darkLeaders:[]
  }
});

//--------------------------------GET INIT DATA----------------------------------
$(document).ready(function() {
    getData();
    refreshAjax();
});

function getRefreshedData(){
    $.get("/api/games").done(function(result) {
        getLeaderBoard(result.games);
        getGames(result.games);
        dateTransform(app.liveGames);
        dateTransformEnded(app.endedGames);
    });
}

function getData(){
    $.get("/api/games").done(function(result) {

        app.current_player = result.current_player;
        getLeaderBoard(result.games);
        registerForm(result.current_player);
        getGames(result.games);
        dateTransform(app.liveGames);
        dateTransformEnded(app.endedGames);
    });
}

function getGames(gameList) {
    var openGames = [];
    var endedGames = [];
    gameList.map(function (game) {
        if (game.gamePlayers[0].score != null) {
            endedGames.push(game);
        } else {
            openGames.push(game);
        }
    });
    app.liveGames = openGames;
    app.endedGames = endedGames;
}


//--------------------------------REFRESH GAME DATA ON BTN CLICK----------------------------------
$("#refresh-btn").click(function(){
    getRefreshedData();
    $("#refresh-btn").addClass("spin10sec").attr("disabled", true);
    setTimeout(function(){ $("#refresh-btn").removeClass("spin10sec").attr("disabled", false); }, 10000);
})

//-----------------------------------------------REFRESH TIMER---------------------------------------------------------
var refreshTimer;
function refreshAjax() {
  refreshTimer = setInterval(function() { getRefreshedData(); }, 10000);
}

//--------------------------------REGISTRATION FORM----------------------------------
//----------------------------------------------LOG IN FORM-----------------------------------------
$("#login-btn").click(function() {
    if (!$("#inputUserName").val() || !$("#inputPassword").val()) {
        $("#login-alert").html("Please enter Username and Password.");
    } else {
        $.post("/api/login", { username: $("#inputUserName").val(), password: $("#inputPassword").val() })
            .done(function() {
                $("#login-alert").html("");
                getData();
            })
            .fail(function() {
                $("#login-alert").html("Invalid User or Password. Please try again.");
            });
    }
});

//----------------------------------------------LOG OUT-------------------------------------------
$("#logout-btn").click(function() {
    $.post("/api/logout").done(function() {
        getData();
        console.log("logged out");
    }).fail(function() {
        console.log("failed to log out...");
    });
});


//-----------------------------------------------SIGN UP AJAX-----------------------------------------
function signUpAjaxPost() {
    $.post("/api/players", { username: $("#inputUser").val(), email: $("#inputEmail").val(), password: $("#signPassword").val(), side: $("input[name=side]:checked").val() })
        .done(function() {
            $.post("/api/login", { username: $("#inputUser").val(), password: $("#signPassword").val() })
                .done(function() {
                    // Open Modal and Play Opening
                    $('#intro-modal').modal("show");
                    starWarsOpening();

                    $("#signUp-alert").html("");
                    getData();
                    $("#signUp-form").hide();
                })
                .fail(function() {
                    $("#signUp-alert").html("Login error. Please try again");
                })
        })
        .fail(function() {
            $("#signUp-alert").html("This user already exist");
        })
}

//----------------------------------------------- INTRO OPENING FUNCTION-----------------------------------------
function starWarsOpening() {
    // Audio to play the opening crawl
    var openingAudio = document.getElementById("opening-audio");
    openingAudio.play();
    // When intro finishes, close Modal
    $(openingAudio).bind('ended', $.proxy(function() {
        openingAudio.currentTime = 0;
        $('#intro-modal').modal("hide");
    }));
}
$("#close-modal-btn").click(function(){
    var openingAudio = document.getElementById("opening-audio");
    openingAudio.pause();
    openingAudio.currentTime = 0;
    $('#intro-modal').modal("hide");
})
//-----------------------------------------------SIGN UP BUTTON-----------------------------------------
$("#sign-up-btn").click(function() {
    if (!$("#inputUser").val() || !$("#inputEmail").val() || !$("#signPassword").val() || !$("input[name=side]:checked").val()) {
        $("#signUp-alert").html("Please complete form to Sign Up.");
    } else if ( !isStringMaxCharAllowed($("#inputUser").val(), 14)) {
        $("#signUp-alert").html("Please enter no more than 14 characters on Username.");
    } else if (!correctEmailFormat($("#inputEmail").val())) {
        $("#signUp-alert").html("Please enter valid email format.");
    } else {
        signUpAjaxPost();
    }
});

function isStringMaxCharAllowed(string, max) {
    var n = string.length;
    if (n <= max) {return true;}
    return false;
}

//-----------------------------------------------CHECK EMAIL-----------------------------------------
function correctEmailFormat(email){
   var RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

   return RegExp.test(email);
}


$("#go-to-sign-up-btn").click(function() {
    $("#login-alert").html("");
    $("#signUp-alert").html("");
    $("#login-form").hide();
    $("#signUp-form").show();
});

$("#back-to-login-btn").click(function() {
    $("#login-alert").html("");
    $("#signUp-alert").html("");
    $("#signUp-form").hide();
    $("#login-form").show();
});


function registerForm(player) {
    if (player === "guest") {
        $("#profile-title").html("<img class='mb-1' src='css/images/registration-h1.png'>");
        $("#login-form").show();
        $("#logout-form").hide();
    } else {
        if (player.side === "DARK") { $("#logged-in-name").html("Welcome Sith! "+player.userName).removeClass("text-LIGHT").addClass("text-DARK"); }
        else if (player.side === "LIGHT") { $("#logged-in-name").html("Welcome Jedi! "+player.userName).removeClass("text-DARK").addClass("text-LIGHT"); }
        else { $("#logged-in-name").html("Welcome, "+player.userName); }
        $("#profile-title").html("<img class='mb-1' src='css/images/profile-h1.png'>");
        $("#login-form").hide();
        $("#logout-form").show();
    }
}

$("input[type=radio]").change(function() {
    if ( $("input[type=radio]:checked").val() === "DARK" ) {
        $("#light-side-description").removeClass("display-block").addClass("display-none");
        $("#dark-side-description").removeClass("display-none").addClass("display-block");
    } else if ( $("input[type=radio]:checked").val() === "LIGHT" ) {
        $("#dark-side-description").removeClass("display-block").addClass("display-none");
        $("#light-side-description").removeClass("display-none").addClass("display-block");
    }
})




//---------------------------------------CREATED DATE FORMAT---------------------------------------
function dateTransform(array){
    for (var i=0;i<array.length;i++) {
        var newDate = new Date(array[i].created).toLocaleString();
        array[i].created = newDate;
    }
}
//---------------------------------------ENDED DATE FORMAT---------------------------------------
function dateTransformEnded(array){
    for (var i=0;i<array.length;i++) {
        var newDate = new Date(array[i].ended).toLocaleString();
        array[i].ended = newDate;
    }
}

//--------------------------------LEADER BOARD STATISTICS----------------------------------
function getLeaderBoard(gameList) {

    var playersIds = [];
    var playersList = [];
    var lightPlayersList = [];
    var darkPlayersList = [];

    gameList.map(function (game) {
        for (var i=0; i<game.gamePlayers.length; i++) {
            var thisPlayerId = game.gamePlayers[i].player.id;

            if (playersIds.indexOf(thisPlayerId) == -1) {
                playersIds.push(thisPlayerId);
                var pUserName = game.gamePlayers[i].player.userName;
                var pSide = game.gamePlayers[i].player.side;
                var playerJson = JSON.parse('{ "pId": "'+thisPlayerId+'", "pUserName": "'+pUserName+'", "side": "'+pSide+'", "totalScore": 0, "wins": 0, "losses": 0, "ties": 0}');
                playersList.push(playerJson);
            }
            for (var e=0; e<playersList.length; e++) {

                if (playersList[e].pId == thisPlayerId) {
                    playersList[e].totalScore += game.gamePlayers[i].score;
                    if (game.gamePlayers[i].score == 3) {playersList[e].wins += 1;} else if (game.gamePlayers[i].score == 1) {playersList[e].ties += 1;} else if (game.gamePlayers[i].score == 0) {playersList[e].losses += 1;}
                }
            }
        }
    });

    var sortByKey = function (key) {
        return function (x, y) {
            return ((x[key] === y[key]) ? 0 : ((x[key] < y[key]) ? 1 : -1));
        };
    };

    var sortByKeyBackwards = function (key) {
        return function (x, y) {
            return ((x[key] === y[key]) ? 0 : ((x[key] > y[key]) ? 1 : -1));
        };
    };


    playersList.sort(sortByKeyBackwards("pUserName"));
    playersList.sort(sortByKeyBackwards("side"));
    playersList.sort(sortByKeyBackwards("losses"));
    playersList.sort(sortByKey("ties"));
    playersList.sort(sortByKey("wins"));
    playersList.sort(sortByKey("totalScore"));


    playersList.map(function (player) {
        if (player.side === "DARK") { return darkPlayersList.push(player); } else if (player.side === "LIGHT") { return lightPlayersList.push(player); }
    });

    app.playersLeaderBoard = playersList;
    app.lightLeaders = lightPlayersList;
    app.darkLeaders = darkPlayersList;

    return;
}


$("#leaderBoardDiv").on("click", "#toggle-leaders-btn", function() {
    if( $("#lightLeaders").hasClass("display-block") ) {
        $("#lightLeaders").removeClass("display-block").addClass("display-none")
        $("#darkLeaders").removeClass("display-none").addClass("display-block")
        $("#toggle-leaders-btn").removeClass("btn-success").addClass("btn-danger").html("<img class='side-logo' src='css/images/empire.png'>")
    } else if ( $("#darkLeaders").hasClass("display-block") ) {
        $("#darkLeaders").removeClass("display-block").addClass("display-none")
        $("#lightLeaders").removeClass("display-none").addClass("display-block")
        $("#toggle-leaders-btn").removeClass("btn-danger").addClass("btn-success").html("<img class='side-logo' src='css/images/rebellion.png'>")
    }
})

//--------------------------------CREATE AND JOIN GAMES----------------------------------

$("#app").on("click", "#new-game-btn", function() {
    $.post("/api/games").done(function(response) {
        $("#fail-creation-game-alert").html("");
        location.assign("/web/game.html?gp="+response.gpid);
    }).fail(function() {
        $("#fail-creation-game-alert").html("Something went wrong. Please try again later");
    })
});


$("#app").on("click", ".join-game-btn", function() {
    var gameId = $(this).data("game");
    $.post("/api/game/"+gameId+"/players").done(function(response) {
        $(".fail-joining-game-alert").html("");
        location.assign("/web/game.html?gp="+response.gpid);
    }).fail(function() {
        $(".fail-joining-game-alert").html("");
        $(".fail-joining-game-alert").filter("[data-game="+gameId+"]").html("Game is full");
    })
});

//--------------------------------SCORE POPOVER----------------------------------
$(function () {
  $('.score-popover').popover()
})
