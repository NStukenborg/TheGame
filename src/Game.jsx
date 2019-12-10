import gameContext from './context/gameContext';
import React, { useContext } from 'react';

const Game = () => {
	const context = useContext(gameContext);
	var game = { one: 'hello', date: new Date() };
	context.saveGame(game);
	context.loadGame();
	return <p>here is a game</p>;
};

export default Game;
