$(document).ready(function () {
    var $teams = $("#teams");
    var players = [];
    if (typeof $teams.data("draft") === "undefined" || draft === null) {
        $teams.on('DOMSubtreeModified', function () {
            draft = $teams.data("draft");
            if (typeof draft !== "undefined" && draft !== null) {
                $teams.off();
                var statdata = localStorage.statdata;
                if (statdata !== null) {
                    statdata = JSON.parse(localStorage.statdata);
                }
                if (statdata !== null) {
                    var lastUpdated = moment(statdata.last_updated);
                    var now = moment(Date.now());
                    var ms = moment(now, "DD/MM/YYYY HH:mm:ss").diff(moment(lastUpdated, "DD/MM/YYYY HH:mm:ss"));
                    var d = moment.duration(ms);
                    var minuteDifference = Math.floor(d.asMinutes());
                    if (minuteDifference > 4) {
                        statdata = null;
                    }
                }

                if (statdata === null) {
                    $.getJSON("https://statdata.pgatour.com/r/current/leaderboard-v2mini.json", function (result) {
                        statdata = result;
                        localStorage.statdata = JSON.stringify(result);
                        buildLeaderboard(statdata.leaderboard.players);
                        buildScoreboard(draft);
                    });
                } else {
                    buildLeaderboard(statdata.leaderboard.players);
                    buildScoreboard(draft);
                }

            }
        });
    }

    var maxHeight = ($(window).innerHeight() / 1.2) + "px";
    $("#leaderboardModal").find(".modal-body").css("height", maxHeight);

    $(window).on("resize", function () {
        var maxHeight = ($(window).innerHeight() / 1.2) + "px";
        $("#leaderboardModal").find(".modal-body").css("height", maxHeight);
    });

    function buildLeaderboard(playersRetrieved) {
        var leaderboard = [];
        $(playersRetrieved).each(function () {
            var p = new Player(this);
            leaderboard.push(p.listItem());
            players.push(p);
        });
        var leaderboardList = new List('leaderboard', playerOptions, leaderboard);
        return leaderboardList;
    }

    function buildScoreboard(draft) {
        var teams = [];
        $(draft).each(function (tIndex, t) {
            var team = new Team(t.Captain);
            $(t.Players).each(function (tpIndex, tp) {
                var playerFound = false;
                $(players).each(function (pIndex, player) {
                    if (playerFound) return true;
                    if (player.name() === tp) {
                        playerFound = true;
                        team.addPlayer(player);
                    }
                });
                if (!playerFound) {
                    console.log("could not find player '" + tp + "' for Team " + team.captain);
                }
            });
            teams.push(team.listItem());
        });

        var teamList = new List("teams", teamOptions, teams);
        teamList.sort('score', {
            order: "desc"
        });
        $(teamList.items).each(function (tIndex, teamItem) {
            var $team = $(teamItem.elm);
            var $name = $team.find("h3");
            var $players = $team.find(".list");

            $players.collapse();
            $name.on("click", function () {
                $players.collapse('toggle');
            });
            var teamPlayers = teamItem.values().players;
            var playerList = new Array();
            $(teamPlayers).each(function (pIndex, teamPlayer) {
                playerList.push(teamPlayer.listItem());
            });
            var teamPlayerList = new List(teamItem.elm, playerOptions, playerList);
            teamPlayerList.sort('position', {
                order: "asc"
            });

        });
    }
});