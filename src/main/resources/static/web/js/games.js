//--------------------------------VUE TEMPLATE----------------------------------
var app = new Vue({
  el: "#app",
  data: {
    games: [],
    playersLeaderBoard: [],
    lightLeaders:[],
    darkLeaders:[]
  }
});

//--------------------------------GET INIT DATA----------------------------------
$(document).ready(function() {
    getData();
});

function getData(){
    $.get("/api/games").done(function(result) {
            app.games = result.games;
            dateTransform(app.games);
            getLeaderBoard(result.games);
            registerForm(result.current_player);
    });
}

//--------------------------------REGISTRATION FORM----------------------------------
$("#login-btn").click(function() {
    if (!$("#inputUserName").val() || !$("#inputPassword").val()) {
        $("#login-alert").html("Please enter email and password.");
    } else if (!correctEmailFormat($("#inputUserName").val())) {
        $("#login-alert").html("Please enter valid email format.");
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

$("#logout-btn").click(function() {
    $.post("/api/logout").done(function() {
        getData();
        console.log("logged out");
    })
});

$("#sign-up-btn").click(function() {
    if (!$("#inputEmail").val() || !$("#signPassword").val() || !$("input[name=side]:checked").val()) {
        $("#signUp-alert").html("Please complete form to Sign Up.");
    } else if (!correctEmailFormat($("#inputEmail").val())) {
        $("#signUp-alert").html("Please enter valid email format.");
    } else {
        $.post("/api/players", { username: $("#inputEmail").val(), password: $("#signPassword").val(), side: $("input[name=side]:checked").val() })
            .done(function() {
                $.post("/api/login", { username: $("#inputEmail").val(), password: $("#signPassword").val() })
                    .done(function() {
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
});

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
        $("#profile-title").html("Registration");
        $("#login-form").show();
        $("#logout-form").hide();
    } else {
        if (player.side === "DARK") { $("#logged-in-name").html("Welcome, Sith! "+player.email).removeClass("text-LIGHT").addClass("text-DARK"); }
        else if (player.side === "LIGHT") { $("#logged-in-name").html("Welcome, Jedi! "+player.email).removeClass("text-DARK").addClass("text-LIGHT"); }
        else { $("#logged-in-name").html("Welcome, "+player.email); }
        $("#profile-title").html("My Profile");
        $("#login-form").hide();
        $("#logout-form").show();
    }
}

//---------------------------------------DATE FORMAT---------------------------------------
function dateTransform(array){
    for (var i=0;i<app.games.length;i++) {
        var newDate = new Date(app.games[i].created).toLocaleString();
        app.games[i].created = newDate;
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
                var pEmail = game.gamePlayers[i].player.email;
                var pSide = game.gamePlayers[i].player.side;
                var playerJson = JSON.parse('{ "pId": "'+thisPlayerId+'", "pEmail": "'+pEmail+'", "side": "'+pSide+'", "totalScore": 0, "wins": 0, "losses": 0, "ties": 0}');
                playersList.push(playerJson);
            }
            for (var e=0; e<playersList.length; e++) {

                if (playersList[e].pId == thisPlayerId) {
                    playersList[e].totalScore += game.gamePlayers[i].score;
                    if (game.gamePlayers[i].score == 1) {playersList[e].wins += 1;} else if (game.gamePlayers[i].score == 0.5) {playersList[e].ties += 1;} else if (game.gamePlayers[i].score == 0) {playersList[e].losses += 1;}
                }
            }
        }
    });

    var sortByKey = function (key) {
        return function (x, y) {
            return ((x[key] === y[key]) ? 0 : ((x[key] < y[key]) ? 1 : -1));
        };
    };

    playersList.sort(sortByKey("totalScore"));

    playersList.map(function (player) {
        if (player.side === "DARK") { return darkPlayersList.push(player); } else if (player.side === "LIGHT") { return lightPlayersList.push(player); }
    });

    app.playersLeaderBoard = playersList;
    app.lightLeaders = lightPlayersList;
    app.darkLeaders = darkPlayersList;

    return;
}