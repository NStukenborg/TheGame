import React from 'react';
import logo from './logo.svg';
import './App.scss';
import Game from './Game';
import Map from './components/map';

function App() {
	return (
		<div className='App'>
			<Game />
			<Map />
		</div>
	);
}

export default App;
