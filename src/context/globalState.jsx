import GameContext from 'context/gameContext';
import { reducer } from 'context/reducers';
import React, { useContext, useReducer } from 'react';
import { UPDATE_GAME } from './reducers';
import Cookies from 'universal-cookie';

const GlobalState = (prop) => {
	const context = useContext(GameContext);
	const { game } = context;

	const [gameState, dispatchGame] = useReducer(reducer, game);

	const updateGameState = (gm) => {
		dispatchGame({ type: UPDATE_GAME, game: gm });
	};

	const resetGame = (mode) => {
		updateGameState({
			gameMode: mode,
			score: 0,
			currentPoints: 11350,
			pixelation: 60,
			points: 11350,
			question: 0,
			pixelSize: 0,
			result: '',
			tic: 0,
		});
	};

	const saveGame = (gameJson) => {
		const cookies = new Cookies();

		cookies.set('TheGameCookie', btoa(JSON.stringify(gameJson)), { path: '/' });
		console.log(atob(cookies.get('TheGameCookie')));
	};

	const loadGame = () => {
		const cookies = new Cookies();
		var loadCookie = cookies.get('TheGameCookie');
		if (loadCookie) {
			//no cookie exists
			//initilizeGame();
		} else {
			var save = JSON.parse(atob(loadCookie)); //convert decoded json to the save data
			console.log(save);
			//parseSave(save);
		}
	};

	return (
		<GameContext.Provider
			value={{
				...context,
				game: gameState,
				resetGame,
				loadGame,
				saveGame,
			}}
		>
			{prop.children}
		</GameContext.Provider>
	);
};

export default GlobalState;
