let express = require('express');
let http = require('http');
let WS = require('ws');
const fs = require("fs");
let fw = express();
let server = http.createServer(fw);

let ws = new WS.Server({ server });

let moves;
let field_size = 10;
let players = [];
let change;
let first_move;
let field;
let possible_move = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [1, 1], [-1, -1], [-1, 1]];

fw.use(express.static(__dirname +'/'));

fw.get("/", function (req, res) {
    let html = fs.readFileSync('./view/index.html');
    res.end(html);
});

server.listen(3000, () =>
    console.log("Server has been started"));

ws.on('connection', function connection(ws) {

    players.push(ws);

    ws.on('message', function incoming(message) {

        let id = players.findIndex(function (item) {
            return item === ws });
        if (change !== id) {
            return;
        }

        let info = JSON.parse(message);

        if (first_move[id]) {
            first_move[id] = 0;
        }

        if (field[info.point.x][info.point.y] === 2 - id) {
            field[info.point.x][info.point.y] = 3 + id;
        } else {
            field[info.point.x][info.point.y] = 1 + id;
        }

        let [first_info_ins, second_info_ins] = UpdateIns([info.point.x, info.point.y], field, id);

        if (field[info.point.x][info.point.y] === 1 + id) {
            first_info_ins.push([info.point.x, info.point.y, 1]);
            second_info_ins.push([info.point.x, info.point.y, 2]);
        } else if (field[info.point.x][info.point.y] === 3 + id) {
            first_info_ins.push([info.point.x, info.point.y, 3]);
            second_info_ins.push([info.point.x, info.point.y, 4]);
        }
        moves[id] -= 1;
        let change_c = 1;

        if (moves[id] === 0) {
            moves[1 - id] = 3;
            change_c = 0;
            change = 1 - id;
            let [first_info_rem, second_info_rem] = UpdateRem(field, id);

            first_info_ins = first_info_ins.concat(first_info_rem);
            second_info_ins = second_info_ins.concat(second_info_rem);
        }

        let end_game = 0;
        let winner;

        if (!first_move[1 - id]) {
            if (moves[id] > 0) {
                end_game = finish(field, id);
                winner = 1 - id;
            }
            else {
                end_game = finish(field, 1 - id);
                winner = id;
            }
        }


        ws.send(JSON.stringify({
            start_game: 1,
            points: first_info_ins,
            change: change_c,
            moves: moves[id],
            end_game: end_game,
            winner: (id === winner)
        }));

        players[1 - id].send(JSON.stringify({
            start_game: 1,
            points: second_info_ins,
            change: !change_c,
            moves: moves[1 - id],
            end_game: end_game,
            winner: (1 - id === winner)
        }));

        if (end_game) {
            players[0].close();
            players[1].close();
            players = [];
        }

    });

    if (players.length === 2) {
        field = [];
        for (let i = 0; i < field_size; i++) {
            field[i] = new Array(field_size).fill(0);
        }

        players[0].send(JSON.stringify({
            start_game: 0,
            change: 1,
            id: 0
        }));
        players[1].send(JSON.stringify({
            start_game: 0,
            change: 0,
            id: 1
        }));
        moves = new Array(2).fill(3);
        first_move = new Array(2).fill(1);
        change = 0;
    }
    else if (players.length === 1) { }

});

function UpdateIns(pos, array, index) {
    let res_first = [],
        res_second = [];
    let located = [];

    for (let i = 0; i < field_size; i++) {
        located[i] = new Array(field_size).fill(0);
    }
    located[pos[0]][pos[1]] = 1;
    let queue = []
    queue.push(pos);
    while (queue.length > 0) {
        let current_pos = queue.shift();
        for (const pmove of possible_move) {
            let new_pos = [pmove[0] + current_pos[0], pmove[1] + current_pos[1]];
            if (new_pos[0] >= 0 && new_pos[0] < field_size && new_pos[1] >= 0 && new_pos[1] < field_size) {
                if (!located[new_pos[0]][new_pos[1]] && array[new_pos[0]][new_pos[1]] === 5 + index) {
                    located[new_pos[0]][new_pos[1]] = 1;
                    array[new_pos[0]][new_pos[1]] = 3 + index;
                    queue.push(new_pos);
                    res_first.push([new_pos[0], new_pos[1], 3]);
                    res_second.push([new_pos[0], new_pos[1], 4]);
                }
            }
        }
    }
    return [res_first, res_second];
}

function UpdateRem(array, index) {
    let res_first = [],
        res_second = [];
    let located = [];

    for (let i = 0; i < field_size; i++) {
        located[i] = new Array(field_size).fill(0);
    }

    for (let i = 0; i < field_size; i++) {
        for (let j = 0; j < field_size; j++) {
            if (!located[i][j] && array[i][j] === 2 - index) {
                let queue = [];
                queue.push([i, j]);
                located[i][j] = 1;
                while (queue.length) {
                    let current_pos = queue.shift();
                    for (const pmove of possible_move) {
                        let new_pos = [current_pos[0] + pmove[0], current_pos[1] + pmove[1]];
                        if (new_pos[0] >= 0 && new_pos[0] < field_size && new_pos[1] >= 0 && new_pos[1] < field_size) {
                            if (!located[new_pos[0]][new_pos[1]]) {
                                if (array[new_pos[0]][new_pos[1]] === 2 - index
                                    || array[new_pos[0]][new_pos[1]] === 4 - index
                                    || array[new_pos[0]][new_pos[1]] === 6 - index) {
                                    located[new_pos[0]][new_pos[1]] = 1;
                                    queue.push(new_pos);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    for (let i = 0; i < field_size; i++) {
        for (let j = 0; j < field_size; j++) {
            if (!located[i][j] && array[i][j] === 4 - index) {
                array[i][j] = 6 - index;
                res_first.push([i, j, 6]);
                res_second.push([i, j, 5]);
            }
        }
    }

    return [res_first, res_second];

}

function finish(array, id) {
    for (let i = 0; i < field_size; i++) {
        for (let j = 0; j < field_size; j++) {
            if (array[i][j] === 1 + id || array[i][j] === 3 + id) {
                for (const pmove of possible_move) {
                    let new_pos = [i + pmove[0], j + pmove[1]];
                    if (new_pos[0] >= 0 && new_pos[0] < field_size && new_pos[1] >= 0 && new_pos[1] < field_size) {
                        if (array[new_pos[0]][new_pos[1]] === 0 || array[new_pos[0]][new_pos[1]] === 2 - id) {
                            return 0;
                        }
                    }
                }
            }
        }
    }
    return 1;
}
