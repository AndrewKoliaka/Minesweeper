'use strict';
var ROWS = 8,
    COLS = 8,
    CELL_SIZE = 30;

var canvas = document.getElementById('myCanvas'),
    ctx = canvas.getContext('2d');

window.addEventListener('load', init, false);

function init() {
    canvas.addEventListener('click', cellClicked, false);
    canvas.addEventListener('contextmenu', cellClicked, false);
    document.getElementById('resBut').addEventListener('click', restart, false);
    var radios = document.getElementsByClassName('level');
    for (var i = 0; i < radios.length; i++) {
        radios[i].addEventListener('change', difficultChanged, false);
    }
    restart();
}

function difficultChanged() {
    switch (this.value) {
        case 'first':
            ROWS = 8;
            COLS = 8;
            battlefield.numMines = 10;
            break;
        case 'second':
            ROWS = 16;
            COLS = 16;
            battlefield.numMines = 40;
            break;
        case 'third':
            ROWS = 30;
            COLS = 16;
            battlefield.numMines = 99;
            break;
    }
    restart();
}

function restart() {
    canvas.width = ROWS * CELL_SIZE;
    canvas.height = COLS * CELL_SIZE;
    battlefield._gameFinished = false;
    document.getElementById('game').style.width = canvas.width + "px";
    document.getElementById('game').style.height = canvas.height + 40 + "px";
    canvas.style.cursor = 'pointer';
    battlefield.fill();
    battlefield.setBombs();
    battlefield.setHints();
    view.clearRect(0, 0, canvas.width, canvas.height);
    view.drawCanvas();
    flags.foundBombs = 0;
    flags._flags = [];
    document.getElementById('numBombs').firstElementChild.textContent = battlefield.numMines.toString();
    document.getElementById('foundBmb').firstElementChild.textContent = flags.foundBombs.toString();
}

var flags = {
    _flags: [],
    foundBombs: 0,
    setFlag: function(i, j) {
        var value = battlefield.getCell(i, j);
        if (value === 'v') {
            return;
        }
        if (value !== 'f') {
            this._flags.push({
                i: i,
                j: j,
                value: value
            });
            battlefield.setCell(i, j, 'f');
            view.drawFlag(i, j);

            document.getElementById('foundBmb').firstElementChild.textContent = (++this.foundBombs).toString();
        } else {
            this.removeFlag(i, j);
        }
    },
    removeFlag: function(i, j) {
        this._flags.forEach(function(el, indx, arr) {
            if (el.i === i && el.j === j) {
                battlefield.setCell(i, j, el.value);
                view.clearRect(j * CELL_SIZE + 1, i * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                arr.splice(indx, 1);
            }
        });
        document.getElementById('foundBmb').firstElementChild.textContent = (--this.foundBombs).toString();
    }
};

var battlefield = {
    _playground: [],
    numMines: 10,
    fill: function() {
        for (var i = 0; i < COLS; i++) {
            this._playground[i] = [];
            for (var j = 0; j < ROWS; j++) {
                this.setCell(i, j, 0);
            }
        }
    },
    getCell: function(i, j) {
        return this._playground[i][j];
    },
    setCell: function(i, j, value) {
        this._playground[i][j] = value;
    },
    setBombs: function() {
        var bombs = 0,
            randI, randJ;
        while (bombs < this.numMines) {
            randI = Math.floor(Math.random() * COLS);
            randJ = Math.floor(Math.random() * ROWS);
            if (!this.getCell(randI, randJ)) {
                this.setCell(randI, randJ, '*');
                bombs++;
            }
        }
    },
    setHints: function() {
        var bombcounter = 0;
        for (var i = 0; i < COLS; i++) {
            for (var j = 0; j < ROWS; j++) {
                if (this.getCell(i, j) === '*') {
                    continue;
                }
                for (var c = 1; c > -2; c--) {
                    for (var r = 1; r > -2; r--) {
                        if (i - c < 0 || j - r < 0 || i - c > COLS - 1 || j - r > ROWS - 1) {
                            continue;
                        }
                        if (this.getCell(i - c, j - r) === '*') {
                            bombcounter++;
                        }
                    }
                }
                this.setCell(i, j, bombcounter);
                bombcounter = 0;
            }
        }
    },
    verify: function(i, j) {
        var i1, j1,
            self = this,
            value = this.getCell(i, j);
        if (!value) {
            view.open(i, j, value);
            this.coordForCheck.forEach(function(el) {
                if (i + el[0] >= 0 && i + el[0] <= COLS - 1 && j + el[1] >= 0 && j + el[1] <= ROWS - 1) {
                    i1 = i + el[0];
                    j1 = j + el[1];

                    if (self.getCell(i1, j1) !== 'v' && self.getCell(i1, j1) !== 'f') {
                        self.verify(i1, j1);
                    }
                }
            });
        } else if (value === "*") {
            view.open(i, j, value);
            this.gameOver();
        } else if (value === "f") {
            flags.removeFlag(i, j);
        } else {
            view.open(i, j, value);
        }
    },
    coordForCheck: [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1]
    ],
    _gameFinished: false,
    gameOver: function() {
        this._playground.forEach(function(el, indx) {
            for (var subIndx = 0; subIndx < ROWS; subIndx++) {
                if (el[subIndx] === '*') {
                    view.open(indx, subIndx, '*');
                }
            }
        });
        flags._flags.forEach(function(el) {
            if (el.value === '*') {
                view.open(el.i, el.j, el.value);
            }
        });
        canvas.style.cursor = 'not-allowed';
        this._gameFinished = true;
    },
    checkWin: function() {
        var viwed = 0,
            flaged = 0;
        for (var i = 0; i < COLS; i++) {
            for (var j = 0; j < ROWS; j++) {
                switch (this.getCell(i, j)) {
                    case 'v':
                        viwed++;
                        break;
                    case 'f':
                        flaged++;
                        break;
                }
            }
        }
        if (viwed + flaged === ROWS * COLS) {
            this._gameFinished = true;
            canvas.style.cursor = 'not-allowed';
            setTimeout(function() { alert('you win!!!') }, 10);
        }
    }
};

var view = {
    open: function(i, j, symbol) {
        if (battlefield.getCell(i, j) === 'v') {
            return;
        }
        switch (symbol) {
            case 0:
                ctx.fillStyle = '#C7DCED';
                ctx.fillRect(j * CELL_SIZE + 1, i * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                break;
            case '*':
                ctx.fillStyle = '#fdafa1';
                ctx.fillRect(j * CELL_SIZE + 1, i * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                ctx.fillStyle = 'black';
                ctx.font = '40px Arial';
                ctx.fillText(symbol, j * CELL_SIZE + CELL_SIZE / 5 - 1, i * CELL_SIZE + CELL_SIZE + CELL_SIZE / 5);
                break;
            default:
                ctx.fillStyle = '#ece3b0';
                ctx.fillRect(j * CELL_SIZE + 1, i * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                ctx.fillStyle = 'black';
                ctx.font = '20px Arial';
                ctx.fillText(symbol, j * CELL_SIZE + CELL_SIZE / 3 - 1, i * CELL_SIZE + CELL_SIZE - CELL_SIZE / 3 + 1);
        }
        battlefield.setCell(i, j, 'v');

    },
    drawCanvas: function() {
        ctx.beginPath();

        for (var i = 0; i < COLS; i++) {
            for (var j = 0; j < ROWS; j++) {
                ctx.strokeRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
        ctx.stroke();

    },
    drawFlag: function(i, j) {
        ctx.fillStyle = 'red';
        ctx.fillRect(j * CELL_SIZE + 7, i * CELL_SIZE + 5, 12, 12);
        ctx.fillStyle = 'black';
        ctx.fillRect(j * CELL_SIZE + 5 + 12, i * CELL_SIZE + 5, 3, 18);
        ctx.fillRect(j * CELL_SIZE + 5 + 5, i * CELL_SIZE + 5 + 18, 16, 3);

    },
    clearRect: function(x, y, width, height) {
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, width, height);
    }
};


function cellClicked(e) {
    if (battlefield._gameFinished) {
        return;
    }
    var i = Math.floor(e.offsetY / CELL_SIZE),
        j = Math.floor(e.offsetX / CELL_SIZE);

    if (i > COLS - 1 || j > ROWS - 1) {
        return;
    }

    if (e.button === 2) {
        flags.setFlag(i, j);
    } else if (e.button === 0) {
        battlefield.verify(i, j);
    }
    battlefield.checkWin();

}
