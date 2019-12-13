import paper from 'paper';
import React, { Component } from 'react';
import { constants } from './../constants/constants';
import { GHIsland } from './../js/GHIsland';
import seedrandom from 'seedrandom';

class Map extends Component {
	state = {};

	componentDidMount() {
		paper.setup('island');
		var myIsland = new GHIsland();
		myIsland.init(0.6727562272746579);
		let rng = seedrandom('hello.');
		console.log('1', rng());
		console.log('2', rng());
		console.log('3', rng());
		console.log('4', rng());
	}
	render() {
		paper.install(window);
		return (
			<React.Fragment>
				<div id='mapViewContainer'>
					<div id='scrollup'></div>
					<div id='scrollleft'></div>
					<div id='scrollright'></div>
					<div id='mapView'>
						<canvas id='island' width={500} height={500}></canvas>
					</div>
					<div id='scrolldown'></div>
				</div>
				<canvas id='perlin' hidden></canvas>
				<div id='mapTools'>
					<button type='button' id='addTerritory'>
						addTerritory
					</button>
					<button type='button' id='showHideShade'>
						show
					</button>
					<button type='button' id='zoomIn'>
						zoomIn
					</button>
					<button type='button' id='zoomP'>
						zoom +
					</button>
					<button type='button' id='zoomM'>
						zoom -
					</button>
					<button type='button' id='zoomOut'>
						zoomOut
					</button>
				</div>
				<div id='areaDetails'></div>
			</React.Fragment>
		);
	}
}

export default Map;
