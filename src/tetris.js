/*
 * tetromino prototypes have 2 fields:
 * pivot is the point about which the shape rotates
 * shape is the array of points in the proper starting position
 */
const TETROMINOS = [
    [
        [1.5, 0.5],
        [
            "####",
            "    "
        ]
    ],
    [
        [1.5, 0.5],
        [
            " ## ",
            " ## "
        ]
    ],
    [
        [1.0, 1.0],
        [
            " #  ",
            "### "
        ]
    ],
    [
        [1.0, 1.0],
        [
            "##  ",
            " ## "
        ]
    ],
    [
        [1.0, 1.0],
        [
            " ## ",
            "##  "
        ]
    ],
    [
        [1.0, 1.0],
        [
            "  # ",
            "### "
        ]
    ],
    [
        [1.0, 1.0],
        [
            "#   ",
            "### "
        ]
    ]
].map(([pivot, mino], index) => {
    // strings to uncentered shape
    const rawShape = [];
    for (const [y, row] of mino.entries()) {
        for (const [x, c] of Array.from(row).entries()) {
            if (c !== ' ') {
                rawShape.push([x, y]);
            }
        }
    }

    // center shape around pivot
    const shape = rawShape.map(([x, y]) => [x - pivot[0], y - pivot[1]]);

    return {
        pivot: pivot,
        shape: shape
    };
});

// clone of a tetromino, with the added properties `index` and `pos`
function newMino(index) {
    const start = [3, 0];
    const mino = TETROMINOS[index];

    return Object.assign({}, mino, {
        shape: mino.shape.map(item => item.slice()),
        index: index,
        pos: start.slice()
    });
}

function copyMino(mino) {
    return Object.assign({}, mino, {
        shape: mino.shape.map(item => item.slice()),
        pos: mino.pos.slice()
    })
}

// flattens a tetromino to a list of points
function flattenMino(mino) {
    const flat = [];

    for (const [sx, sy] of mino.shape) {
        const [px, py] = mino.pos;
        const [cx, cy] = mino.pivot;

        flat.push([sx + px + cx, sy + py + cy]);
    }

    return flat;
}

function inBounds(v, lower, upper) {
    return v >= lower && v < upper;
}

// stores and acts upon the tetris board game state
export class Tetris {
    constructor(rerenderHook) {
        this.mino = null;
        this.minos = [];
        this.board = Array(20).fill(0).map(_ => Array(10).fill(null));
        this.ticker = 0;
        this.gameOver = false;
        this.rerenderHook = rerenderHook;

        this.addMinos();
        this.mino = this.minos[0];
        this.minos = this.minos.slice(1);
    }

    // gets a board position, if it's empty or out of bounds returns `null`
    getPos(pos) {
        const [x, y] = pos;

        return inBounds(x, 0, 10) && inBounds(y, 0, 20)
            ? this.board[y][x] : null;
    }

    // set a board position if it's in bounds
    setPos(pos, value) {
        const [x, y] = pos;

        if (inBounds(x, 0, 10) && inBounds(y, 0, 20)) {
            this.board[y][x] = value;
        }
    }

    addMinos() {
        const newMinos = Array(TETROMINOS.length)
            .fill(0)
            .map((_, i) => newMino(i))
            .sort(() => Math.random() - 0.5);

        this.minos.push(...newMinos);
    }

    requestMino() {
        if (this.minos.length < 2) {
            this.addMinos();
        }

        this.mino = this.minos[0];
        this.minos = this.minos.slice(1);

        if (this.minoCollides(this.mino)) {
            this.gameOver = true;
        }

        this.rerenderHook();
    }

    // returns whether a potential position would collide into the board
    minoCollides(mino) {
        return flattenMino(mino)
            .some(([x, y]) =>
                !inBounds(x, 0, 10) || y >= 20 || this.getPos([x, y]) !== null
            );
    }

    placeMino(mino) {
        // put mino on board
        for (const pos of flattenMino(this.mino)) {
            this.setPos(pos, this.mino.index);
        }

        // check for rows to be removed
        for (let i = this.board.length - 1; i >= 0; ) {
            const row = this.board[i];

            if (row.every(item => item !== null))  {
                // remove full rows
                for (let j = i; j > 0; --j) {
                    this.board[j] = this.board[j - 1];
                }

                this.board[0] = Array(10).fill(null);
            } else {
                --i;
            }
        }
    }

    rotateMino(isClockwise) {
        // multiplier for 90 deg. rotation
        const [mx, my] = isClockwise ? [-1, 1] : [1, -1];
        const rotated = copyMino(this.mino);

        rotated.shape = rotated.shape.map(([x, y]) => [y * mx, x * my]);

        if (!this.minoCollides(rotated)) {
            this.mino = rotated;
        }

        this.rerenderHook();
    }

    moveMino(dir) {
        const moved = copyMino(this.mino);

        moved.pos[0] += dir[0];
        moved.pos[1] += dir[1];

        if (!this.minoCollides(moved)) {
            this.mino = moved;
        }

        this.rerenderHook();
    }

    dropMino() {
        const dropped = copyMino(this.mino);

        dropped.pos[1] += 1;

        if (!this.minoCollides(dropped)) {
            this.mino = dropped;
            this.rerenderHook();
        } else {
            this.placeMino();
            this.requestMino();
        }
    }

    fastDropMino() {
        const dropped = copyMino(this.mino);

        do {
            dropped.pos[1] += 1;
        } while (!this.minoCollides(dropped));

        dropped.pos[1] -= 1;

        this.mino = dropped;
        this.placeMino();
        this.requestMino();
    }

    update(dt) {
        // no updating once game is over
        if (this.gameOver) {
            return;
        }

        const TICK_TIME = 1000 / 5;

        this.ticker += dt;

        if (this.ticker >= TICK_TIME) {
            this.dropMino();
            this.ticker -= TICK_TIME;
        }
    }

    // generates a view of the board for rendering, where `null` represents
    // empty space and a number represents all the colors
    genBoardView() {
        const view = this.board.map(row => row.slice());

        for (const [x, y] of flattenMino(this.mino)) {
            if (inBounds(x, 0, 10) && inBounds(y, 0, 20)) {
                view[y][x] = this.mino.index;
            }
        }

        return view;
    }
}