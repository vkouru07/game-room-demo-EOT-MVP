import React from 'react';

function Game({ myID, gameId, opponentId, isPlayerTurn, gameOver, gameOverMessage, moves, makeMove }) {
  return (
    <div>
      {gameOver && <h3>{gameOverMessage}</h3>}

      <h3>GameID: {gameId}</h3>
      <h3>Your id: {myID}</h3>
      <h3>Playing against: {opponentId}</h3>

      {isPlayerTurn && <>
        <h5>It is your turn.</h5>
        <button onClick={() => makeMove('move1')}>Button 1</button>
        <button onClick={() => makeMove('move2')}>Button 2</button>
        <button onClick={() => makeMove('move3')}>Button 3</button>
        <button onClick={() => makeMove('win')}>winning move</button>
      </>}

      {!isPlayerTurn && <h5>It is your opponent's turn.</h5>}
    </div>
  );
}

export default Game;