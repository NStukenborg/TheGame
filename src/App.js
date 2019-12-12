import 'App.scss';
import Map from 'components/map';
import Game from 'Game';
import React from 'react';

function App() {
	return (
		<div className='App'>
			<Game />
			<Map />
		</div>
	);
}

export default App;
