var CLIENT_ID = "182275868192-nk4ln76b8ph6mq77gfts09scvib0sd39.apps.googleusercontent.com";
var API_KEY = "AIzaSyBzWzDSeyo8_JKUah7qoXhyxuBRnZYwQrM";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SHEET_ID = "11KSg59tZ8ogpJ0W2olMN-c-GJDLB8433GeSOOdgtjA0";
var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var teamDiv = document.getElementById('teams');

var playerOptions = {
    valueNames: ['name', 'score', 'thru', 'position'],
    item: '<li class="list-group-item px-2">' +
        '<div class="row">' +
        '<div class="col-2 text-left"><span class="position"></span></div>' +
        '<div class="col-5 text-left"><span class="name"></span></div>' +
        '<div class="col-3 text-right"><span class="thru"></span></div>' +
        '<div class="col-2 text-right"><span class="score"></span></div>' +
        '</div>' +
        '</li>'
};

var teamOptions = {
    valueNames: ['captain', 'score'],
    item: '<li class="list-group-item px-2 team">' +
    '<h3 class="d-flex justify-content-between align-items-center mb-0"><span class="captain"></span><span class="score badge badge-secondary badge-pill"></span></h3>' +
    '<ul class="list list-group"></ul>' +
    '</li>'
};

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, function (error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        getSpreadsheetJson();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

function getSpreadsheetJson() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'A2:G8',
    }).then(function (response) {
        teamDiv.dataset.draft = response.result.values;
    }, function (response) {
        alert("Error check logs for response");
        console.log(response);
    });
}

function Team(captain) {
    this.captain = captain;
    this.players = [];
    this.playersLive = [];
    this.addPlayer = function (player) {
        this.players.push(player);
        if (player.hasStarted()) {
            this.playersLive.push(player);
        }
    };
    this.score = function () {
        var scores = new Array();
        $(this.playersLive).each(function (pIndex, player) {
            scores.push(player.score);
        });
        scores.sort(function (a, b) {
            return a - b
        });
        var score = 0;
        if (scores.length > 0) {
            score += scores[0];
        }
        if (scores.length > 1) {
            score += scores[1];
        }
        if (scores.length > 2) {
            score += scores[2];
        }
        return score;
    };
    this.scoreFormatted = function () {
        return this.score() === 0 ? "E" : this.score() > 0 ? "+" + this.score() : this.score();
    };
    this.listItem = function () {
        return {
            captain: this.captain,
            score: this.scoreFormatted(),
            players: this.playersLive
        }
    };
}

function Player(player) {
    this.id = player.player_id;
    this.firstName = player.player_bio.first_name;
    this.lastName = player.player_bio.last_name;
    this.currentRound = player.current_round;
    this.score = player.total;
    this.currentPosition = player.current_position;
    this.rounds = player.rounds;
    this.cut = player.status === "cut" || player.status === "wd";
    this.name = function () {
        return this.firstName + " " + this.lastName;
    };
    this.teeTime = function () {
        if (this.cut) return null;
        return moment(player.rounds[this.currentRound - 1].tee_time)
    };
    this.scoreFormatted = function () {
        if (this.cut) return "MC";
        return this.score === 0 ? "E" : this.score > 0 ? "+" + this.score : this.score;
    };
    this.thru = function () {
        if (this.cut) return null;
        if (player.thru === null) {
            return this.teeTime().format('h:mm a');
        }
        if (player.thru === 18) {
            return this.rounds[this.currentRound - 1].strokes + ' (F)';
        }
        var score = this.rounds[this.currentRound - 1];
        return player.thru + " (" + this.today() + ")";
    };
    this.today = function () {
        if (this.cut) return "";
        if (player.thru === null || player.thru === 18) {
            return "";
        }
        return player.today === 0 ? "E" : player.today > 0 ? "+" + player.today : player.today;
    };
    this.currentPositionFormatted = function () {
        if (this.cut) return "MC";
        return this.currentPosition == "" ? "" : this.currentPosition.replace('T', '');
    };
    this.hasStarted = function () {
        return player.current_position != "";
    };
    this.listItem = function () {
        return {
            position: this.currentPositionFormatted(),
            name: this.name(),
            score: this.scoreFormatted(),
            thru: this.thru()
        };
    };
}

$(document).ready(function () {
    var $teams = $("#teams");
    var draft = $teams.data("draft");
    if (typeof draft === "undefined" || draft === null) {
        $teams.on('DOMSubtreeModified', function () {
            draft = $teams.data("draft");
            if (typeof draft !== "undefined" && draft !== null) {
                $.getJSON("https://statdata.pgatour.com/r/current/leaderboard-v2mini.json", function (result) {
                    var leaderboard = [];
                    var players = [];
                    $(result.leaderboard.players).each(function () {
                        var p = new Player(this);
                        leaderboard.push(p.listItem());
                        players.push(p);
                    });
                    var leaderboardList = new List('leaderboard', playerOptions, leaderboard);

                    var teams = [];
                    $(draft).each(function (tIndex, t) {
                        var team = new Team(t[0]);
                        for (var i = 1; i < t.length; i++) {
                            var playerName = t[i];
                            $(players).each(function (pIndex, player) {
                                if (player.name() === playerName) {
                                    team.addPlayer(player);
                                }
                            });
                        }
                        teams.push(team.listItem());
                    });

                    var teamList = new List("teams", teamOptions, teams);
                    // teamList.sort('score', {order: "desc"});
                    // $(teamList.items).each(function (tIndex, teamItem) {
                    //     var $team = $(teamItem.elm);
                    //     var $name = $team.find("h3");
                    //     var $players = $team.find(".list");

                    //     $players.collapse();
                    //     $name.on("click", function () {
                    //         $players.collapse('toggle');
                    //     });
                    //     var teamPlayers = teamItem.values().players;
                    //     var playerList = new Array();
                    //     $(teamPlayers).each(function (pIndex, teamPlayer) {
                    //         playerList.push(teamPlayer.listItem());
                    //     });
                    //     var teamPlayerList = new List(teamItem.elm, playerOptions, playerList);
                    //     teamPlayerList.sort('position', {order: "asc"});

                    // });

                });
            }
        });
    }

    var maxHeight = ($(window).innerHeight() / 1.2) + "px";
    $("#leaderboardModal").find(".modal-body").css("height", maxHeight);

    $(window).on("resize", function () {
        var maxHeight = ($(window).innerHeight() / 1.2) + "px";
        $("#leaderboardModal").find(".modal-body").css("height", maxHeight);
    });
});