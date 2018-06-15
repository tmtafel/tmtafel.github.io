(function ($) {
    var url = "https://statdata.pgatour.com/r/current/leaderboard-v2mini.json";
    //     https://statdata.pgatour.com/r/current/schedule-v2.json
    //     https://statdata.pgatour.com/r/current/broadcastairtimes.json
    //     https://statdata.pgatour.com/r/026/2018/leaderboard-v2mini.json
    //     https://statdata.pgatour.com/r/026/2018/setup.json
    //     https://statdata.pgatour.com/r/026/2018/player_stats.json
    //     https://statdata.pgatour.com/r/026/2018/message.json
    //     https://statdata.pgatour.com/r/026/2018/leaderboard-v2.json
    //     https://statdata.pgatour.com/players/player.json
    //     https://statdata.pgatour.com/r/026/2018/playoff_info.json
    //     https://statdata.pgatour.com/r/026/2018/featured_groups.json

    $.getJSON(url, function (result) {
        var now = Date.now();
        var lastUpdated = moment(result.last_updated);
        var leaderboard = result.leaderboard;
        var players = new Array();
        $(leaderboard.players).each(function () {
            var p = new Player(this);
            players.push(p);
            $(".leaderboard").append(p.html());
        });

        $(".player").each(function (pIdx, player) {
            var name = $(player).text();
            $(players).each(function (idx, checkPlayer) {
                if (name === checkPlayer.name()) {
                    $(player).append("<span class=\"badge badge-primary badge-pill\">" + checkPlayer.scoreFormatted() + "</span>")
                    $(player).prepend("<span>" + checkPlayer.currentPosition + "</span>")
                }
            });
        });
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
    this.scoreFormatted = function(){
        return this.score === 0 ? "E" : this.score > 0 ? "+" + this.score : this.score;
    }
    this.thru = function () {
        return player.thru === null ? this.TeeTime().format('h:mm a') : player.thru
    };
    this.currentPosition = player.current_position;
    this.html = function () {
        return "<tr><td>" + this.currentPosition + "</td><td>" + this.name() + "</td><td>" + this.score + "</td><td>" + this.thru() + "</td></tr>";
    }
}