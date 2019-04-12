(function ($) {
    var $refresh = $("#refresh");
    var $timestamp = $("#timestamp");
    var $leaderboard = $("#leaderboard");
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
            '<ul class="list list-group collapse"></ul>' +
            '</li>'
    };

    $(document).ready(function () {
        UpdateScores();
        $("#leaderboardModal").find(".modal-body").css("height", ($(window).innerHeight() / 1.2) + "px");
        $(window).on("resize", function () {
            $("#leaderboardModal").find(".modal-body").css("height", ($(window).innerHeight() / 1.2) + "px");
        });
    });

    function UpdateScores() {
        $.when($.getJSON("draft.json"), $.getJSON("https://statdata.pgatour.com/r/current/leaderboard-v2mini.json")).done(function (draftRet, statdataRet) {

            var statdata = statdataRet[0];
            var draft = draftRet[0];
            var players = [];
            var leaderboard = [];
            $(statdata.leaderboard.players).each(function () {
                var p = new Player(this);
                players.push(p);
                leaderboard.push(p.listItem());
            });
            var leaderboardList = new List('leaderboard', playerOptions, leaderboard);
            var lastUpdated = moment(statdata.last_updated);
            $timestamp.text(lastUpdated.format("ddd, h:mma"));
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
                $name.on("click", function () {
                    $players.collapse('toggle');
                });
                var teamPlayers = teamItem.values().players;
                var playerList = [];
                $(teamPlayers).each(function (pIndex, teamPlayer) {
                    playerList.push(teamPlayer.listItem());
                });
                var teamPlayerList = new List(teamItem.elm, playerOptions, playerList);
                teamPlayerList.sort('position', {
                    order: "asc"
                });
            });
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
})(jQuery);