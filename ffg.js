(function ($) {
    var players = new Array();
    $.getJSON("https://statdata.pgatour.com/r/current/leaderboard-v2mini.json", function (result) {
        var leaderboard = result.leaderboard;
        $(leaderboard.players).each(function () {
            var p = new Player(this);
            players.push(p);
        });
        var leaderboardList = new Array();
        $(players).each(function (pIndex, p) {
            leaderboardList.push({
                name: p.name(),
                score: p.scoreFormatted(),
                thru: p.thru(),
                position: p.currentPositionFormatted()
            });
        });
        var leaderboardOptions = {
            valueNames: ['name', 'score', 'thru', 'position'],
            item: '<li class="list-group-item">' +
            '<div class="row">' +
            '<div class="col-2"><span class="position"></span></div>' +
            '<div class="col-5"><span class="name"></span></div>' +
            '<div class="col-3 text-right"><span class="thru"></span></div>' +
            '<div class="col-2 text-right"><span class="score"></span></div>' +
            '</div>' +
            '</li>'
        };
        var leaderboard = new List('leaderboard', leaderboardOptions, leaderboardList);
        var teams = new Array();
        $(draft).each(function (tIndex, t) {
            var team = new Team(t.Captain);
            $(t.Players).each(function (tpIndex, tp) {
                $(players).each(function (pIndex, player) {
                    if (player.name() === tp) {
                        team.addPlayer(player);
                    }
                });
            });
            teams.push(team);
        });
        var teamOptions = {
            valueNames: ['position', 'name', 'score']
        };
        $(teams).each(function (tIndex, team) {
            var teamElement = $("#teams").append(team.html());
            var teamList = new List(teamElement[0], teamOptions);
            teamList.sort('position', {order: "asc"});
        })
    });


    var maxHeight = ($(window).innerHeight() / 2) + "px";
    $("#leaderboardModal").find(".modal-body").css("max-height", maxHeight);

    $(window).on("resize", function () {
        var maxHeight = ($(window).innerHeight() / 2) + "px";
        $("#leaderboardModal").find(".modal-body").css("max-height", maxHeight);
    });
})(jQuery);

function Player(player) {
    this.id = player.player_id;
    this.firstName = player.player_bio.first_name;
    this.lastName = player.player_bio.last_name;
    this.name = function () {
        return this.firstName + " " + this.lastName;
    };

    this.currentRound = player.current_round;
    this.TeeTime = function () {
        return moment(player.rounds[this.currentRound - 1].tee_time)
    };

    this.score = player.total;
    this.scoreFormatted = function () {
        return this.score === 0 ? "E" : this.score > 0 ? "+" + this.score : this.score;
    }

    this.thru = function () {
        return player.thru === null ? this.TeeTime().format('h:mm a') : player.thru
    };

    this.currentPosition = player.current_position;
    this.currentPositionFormatted = function () {
        return this.currentPosition == "" ? "" : this.currentPosition.replace('T', '');
    };
    this.hasStarted = function () {
        return player.current_position != "";
    };

    this.ListItem = function () {
        return {
            position: this.currentPositionFormatted(),
            name: this.name(),
            score: this.scoreFormatted()
        }
    };

    this.html = function () {
        return '<li class="player list-group-item"><div class="row">' +
            '<div class="col-2"><span class="position">' + this.currentPositionFormatted() + '</span></div>' +
            '<div class="col-8"><span class="name">' + this.name() + '</span></div>' +
            '<div class="col-2 text-right"><span class="score">' + this.scoreFormatted() + '</span></div>' +
            '</div></li>';
    };
}


function Team(captain) {
    this.captain = captain;
    this.players = new Array();
    this.playersLive = new Array();
    this.addPlayer = function (player) {
        this.players.push(player);
        if (player.hasStarted()) {
            this.playersLive.push(player);
        }
    };
    this.topThree = function () {
        if (this.playersLive.length <= 2) return 0;
        var scores = new Array();
        $(this.playersLive).each(function (pIndex, player) {
            scores.push(player.score);
        });
        scores.sort();
        return scores[0] + scores[1] + scores[2];
    };
    this.topThreeFormatted = function () {
        return this.topThree() === 0 ? "" : this.topThree() > 0 ? "+" + this.topThree() : this.topThree();
    }
    this.html = function () {
        var html = '<div id="' + this.captain + '" class="col-lg-4 col-md-6 col-12 team">' +
            '<h3 class="pt-4 d-flex justify-content-between"><span class="captain">' + this.captain + '</span><span class="top-three pr-3">' + this.topThreeFormatted() + '</span></h3>' +
            '<ul class="list list-group list-group-flush">';
        $(this.playersLive).each(function (pIndex, player) {
            html += player.html();
        });
        html += '</ul></div>';
        return html;
    }
}
