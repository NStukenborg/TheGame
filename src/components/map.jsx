import paper, { Tool } from 'paper';
import React, { Component } from 'react';
import { GHIsland } from './../js/GHIsland';

class Map extends Component {
	state = {};

	componentDidMount() {
		paper.setup('island');
		let selectedCell;
		let myIsland = new GHIsland();
		myIsland.init(0.6727562272746579);

		const myTool = new Tool();
		console.log(myIsland);
		myTool.onMouseUp = function(event) {
			let point = event.point;
			selectedCell = myIsland.getSelectedCell(point /*, canvas.outerHeight()*/);
			if (selectedCell) {
				selectedCell.log();
			}
		};
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
