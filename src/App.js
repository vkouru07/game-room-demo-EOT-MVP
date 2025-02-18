import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import Game from './client/Game';
import { useEffect, useState } from 'react';
import { socket, connectSocket, subscribeToEvent, sendMessage, disconnectSocket } from './client/services/socket';

function App() {
  const [userCount, setUserCount] = useState(0);
  const [myID, setMyID] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState(null);
  const [moves, setMoves] = useState([]);

  useEffect(() => {
    connectSocket();

    socket.on('connect', () => {
      setMyID(socket.id);
    });

    subscribeToEvent('updateUserCount', (data) => {
      setUserCount(data.count);
    });

    subscribeToEvent('gameStarted', (data) => {
      setGameId(data.gameId);
      setOpponentId(data.player1Id === socket.id ? data.player2Id : data.player1Id);
      setIsPlayerTurn(data.player1Id === socket.id);
    });

    subscribeToEvent('canMakeMove', (data) => {
      setIsPlayerTurn(data.playerId === socket.id);
    });

    subscribeToEvent('moveMade', (data) => {
      setMoves((prevMoves) => [...prevMoves, data.move]);
    });

    subscribeToEvent('gameOver', (data) => {
      setGameOver(true);
      setGameOverMessage(data.message);
    });

    subscribeToEvent('playerLeft', (data) => {
      if (data.playerId === opponentId) {
        setGameOver(true);
        setGameOverMessage('Your opponent has left the game.');
      }
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const findUntimedGame = () => {
    sendMessage('findUntimedGame');
  };

  const makeMove = (move) => {
    if (isPlayerTurn) {
      sendMessage('requestMakeMove', { gameId, playerId: myID, move });
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <h3>Hello, this is the EOT MVP. </h3>
              <p>Current users connected to the server: {userCount}</p>
              <Link to="/game" onClick={findUntimedGame}>Play Game</Link>
            </>
          } />
          <Route path="/game" element={
            <Game
              myID={myID}
              gameId={gameId}
              opponentId={opponentId}
              isPlayerTurn={isPlayerTurn}
              gameOver={gameOver}
              gameOverMessage={gameOverMessage}
              moves={moves}
              makeMove={makeMove}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;