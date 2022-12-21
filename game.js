let ws = new WebSocket("ws://localhost:3000/ws");
let moves = 3;
let change = false;
let first_change = true;
let first = false;
let field_size = 10;
let cell_value = new Array(6);

let possible_move = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [1, 1], [-1, -1], [-1, 1]]

ws.onopen = function () {
    CreateField();
}

let field;

ws.onmessage = function (message) {
    let info = JSON.parse(message.data);
    let status = document.getElementById('Status');
    if (!info.start_game) {
        let field_image = document.getElementById('playground');
        field_image.style.visibility = 'visible';
        if (info.change) {
            status.innerText = `Ваш ход. Вирусов осталось: ${moves}`;
        } else {
            status.innerText = `Ход противника.`
        }
        change = info.change;
        first = info.change;
        if (info.change) {
            cell_value[0] = 'red_virus.png';
            cell_value[1] = 'blue_virus.png';
            cell_value[2] = 'red_wall.png';
            cell_value[3] = 'blue_wall.png';

            cell_value[4] = 'red_wall_block.png';
            cell_value[5] = 'blue_wall_block.png';
        } else {
            cell_value[0] = 'blue_virus.png';
            cell_value[1] = 'red_virus.png';
            cell_value[2] = 'blue_wall.png';
            cell_value[3] = 'red_wall.png';

            cell_value[4] = 'blue_wall_block.png';
            cell_value[5] = 'red_wall_block.png';
        }
        field = [];
        moves = 3;
        for (let i = 0; i < field_size; i++) {
            field[i] = new Array(field_size).fill(0);
        }
    } else {
        let info = JSON.parse(message.data);
        if (info.error) {
            alert("Неправильный ход");
        } else {
            for (const cell of info.points) {
                field[cell[0]][cell[1]] = cell[2];
                let cell_pic = document.getElementById(`${cell[0]}_${cell[1]}`)
                cell_pic.src = `/images/` + cell_value[cell[2] - 1];
            }
            moves = info.moves;
            change = info.change;
            if (info.change) {
                status.innerText = `Ваш ход. Вирусов осталось: ${moves}`;
            } else {
                status.innerText = `Ход противника.`
            }
            if (info.end_game) {
                if (info.winner) {
                    alert("Вы победили");
                } else {
                    alert("Вы проиграли");
                }
                window.location.href = "index.html";
            }
        }

    }

}

ws.onerror = function (error) {
    alert("Произошла ошибка" + error.info);
}

function CreateField() {
    let disp = document.getElementById('playground');
    disp.style.gridTemplateColumns = `repeat(${field_size}, 1fr)`;
    disp.style.gridTemplateRows = `repeat(${field_size}, 1fr)`;
    let buffer = ``;
    for (let i = 0; i < field_size; i++) {
        for (let j = 0; j < field_size; j++) {
            buffer +=
                `<div class='cell' onclick='Click(${i}, ${j})'> 
                        <img id='${i}_${j}' src='/images/free_cell.png' style='width: 100%; max-height:100% draggable="false"' alt="free_cell">  
                    </div>\n`;
        }
    }
    disp.innerHTML = buffer;
}


function Click(x, y) {
    if (change && moves) {
        if (first_change) {
            if (first && x !== 0) {
                alert("Начать можно только с верхнего ряда");
                return;
            } else if (!first && x !== field_size - 1) {
                alert("Начать можно только с нижнего ряда");
                return;
            }
        } else {
            let is_allowed = false;
            for (let pmove of possible_move) {
                let new_pos = [x + pmove[0], y + pmove[1]];
                if (new_pos[0] >= 0 && new_pos[0] < field_size && new_pos[1] >= 0 && new_pos[1] < field_size) {
                    if (field[new_pos[0]][new_pos[1]] === 1 || field[new_pos[0]][new_pos[1]] === 3) {
                        is_allowed = true;
                        break;
                    }
                }
            }
            if (!is_allowed) {
                return;
            }
        }


        ws.send(JSON.stringify(
            {
                point: { x, y }
            }
        ));

        first_change = false;
    } else {
        alert("Сейчас не ваш ход");
    }
}


