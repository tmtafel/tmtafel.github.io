"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $ = require("jquery");
var moment = require("../javascript/moment.js");
var List = require("../javascript/list.js");
(function ($) {
    var url = "https://statdata.pgatour.com/r/current/leaderboard-v2mini.json";
    $.getJSON(url, function (result) {
        var now = Date.now();
        var lastUpdated = moment(result.last_updated);
        var leaderboard = result.leaderboard;
        var players = [];
        var leaderboardList = [];
        console.log(leaderboard);
        $(leaderboard.players).each(function () {
            var p = new Player(this);
            players.push(p);
            leaderboardList.push({
                name: p.name(),
                score: p.scoreFormatted(),
                position: p.currentPositionFormatted()
            });
        });
        var options = {
            valueNames: ['name', 'score', 'position'],
            item: '<li class="list-group-item">' +
                '<div class="row">' +
                '<div class="col-2"><span class="position"></span></div>' +
                '<div class="col-8"><span class="name"></span></div>' +
                '<div class="col-2 text-right"><span class="score"></span></div>' +
                '</div>' +
                '</li>'
        };
        var userList = List('leaderboard', options, leaderboardList);
        var teams = new Array();
        $.getJSON("slappys.json", function (result) {
            $(result).each(function (tIndex, team) {
                var team = new Team(team);
                $(team["Team"]).each(function (pIndex, p) {
                });
                team.addPlayer();
                teams.push(team);
            });
        });
    });
    var maxHeight = ($(window).innerHeight() / 2) + "px";
    $("#leaderboardModal").find(".modal-body").css("max-height", maxHeight);
    $(window).on("resize", function () {
        var maxHeight = ($(window).innerHeight() / 2) + "px";
        $("#leaderboardModal").find(".modal-body").css("max-height", maxHeight);
    });
})($);
function Player(player) {
    this.id = player.player_id;
    this.firstName = player.player_bio.first_name;
    this.lastName = player.player_bio.last_name;
    this.name = function () {
        return this.firstName + " " + this.lastName;
    };
    this.currentRound = player.current_round;
    this.TeeTime = function () {
        return moment(player.rounds[this.currentRound - 1].tee_time);
    };
    this.score = player.total;
    this.scoreFormatted = function () {
        return this.score === 0 ? "E" : this.score > 0 ? "+" + this.score : this.score;
    };
    this.thru = function () {
        return player.thru === null ? this.TeeTime().format('h:mm a') : player.thru;
    };
    this.currentPosition = player.current_position;
    this.currentPositionFormatted = function () {
        return this.currentPosition.replace('T', '');
    };
    this.html = function () {
        return "<tr><td>" + this.currentPosition + "</td><td>" + this.name() + "</td><td>" + this.score + "</td><td>" + this.thru() + "</td></tr>";
    };
}
function Team(team) {
    this.name = team["Player"];
    this.players = new Array();
}
