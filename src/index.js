import React, { useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css'
import { Tetris } from './tetris.js'

const COLORS = [
  "#007FFF",
  "#FFFF00",
  "#7F7FFF",
  "#FF0000",
  "#00FF00",
  "#FF7F00",
  "#0000FF"
];

function InnerCell(props) {
  const [x, y] = props.pos;
  const style = {
    backgroundColor: COLORS[props.colorIndex]
  };

  return (
    <div
      key={`outer-cell-${x}-${y}`}
      className="tetris-inner-cell"
      style={style}
    />
  );
}

function OuterCell(props) {
  const [x, y] = props.pos;
  const filled = props.colorIndex !== null;

  return (
    <div key={`outer-cell-${x}-${y}`} className="tetris-outer-cell">
      {filled ? InnerCell(props) : ""}
    </div>
  );
}

function Board(props) {
  const board = props.board;

  // keydown listener
  useEffect(() => {
  });

  // generate model of tetris board
  const cells = Array(20).fill(0).map((_, y) => {
    const row = Array(10).fill(0).map((_, x) =>
      <OuterCell
        key={`cell-${x}-${y}`}
        pos={[x, y]}
        colorIndex={board[y][x]}
      />
    );

    return <div key={`row-${y}`} className="tetris-row">{row}</div>;
  });

  return <div id="tetris-board">{cells}</div>;
}

// dom interaction =============================================================

const root = ReactDOM.createRoot(document.getElementById("root"));

const delta = 1000 / 60;
const tetris = new Tetris(() => {
  root.render(<Board board={tetris.genBoardView()} />);
});

window.setInterval(() =>{
  tetris.update(delta);
}, delta);

window.addEventListener("keydown", (e) => {
  switch (e.code) {
  case 'KeyC':
    tetris.rotateMino(true);
    break;
  case 'KeyX':
    tetris.rotateMino(false);
    break;
  case 'Space':
    tetris.fastDropMino();
    break;
  case 'ArrowRight':
    tetris.moveMino([1, 0]);
    break;
  case 'ArrowLeft':
    tetris.moveMino([-1, 0]);
    break;
  default: break;
  }
});
