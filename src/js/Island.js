//Version History
/* * * * * * * *
 *  Version 1.0.0
 *    -2016-2-6   -Island map generator as pulled from https://github.com/lebesnec/island.js
 *  Version 1.0.1
 *    -2016-2-?   -allowed init with specified seed
 *  Version 1.1.0
 *    -2016-2-?   -added impassible borders (Ocean, Mountian, and Desert) to convert island to section of landmass
 *  Version 1.1.1
 *    -2016-2-19  -added click-to highlight cell functionality
 *  Version 1.2.0
 *    -2016-2-20  -converted to dojo style file for use in other dojo files
 *  Version 1.2.1
 *    -2016-2-22  -skew island elevation toward impass mountains
 *  Version 1.2.2
 *    -2016-2-23  -group impass areas
 *                -highlight outer edges of group if a group is clicked
 *  Version 1.3.0
 *    -2016-2-23  -converted map config from number of sites based to number of cells across based
 *    -2016-2-24  -always a square map (only needs 1 dimension)
 *                -always hexagon cells with 0 randomness
 *  Version 1.3.1
 *    -2016-2-24  -put shaded cells in separate layer and allow it to be shown/hidden
 *  Version 1.3.2
 *    -2006-2-24  -update highlightCell to account for possible zoom changes
 *  Version 1.4.0
 *    -2016-2-24  -moved constants (including config) to external file
 *  Version 1.4.1
 *    -2016-2-25  -prevented moisture from spreading across cliff and allowed rivers to spawn in ImpassM
 *  Version 1.4.2
 *    -2016-2-25  -converted to using dojo version of perlin.js (which uses dojo version of Simplex.js)
 *  Version 1.4.3
 *    -2016-2-25  -group all regular land cells into territories
 *  Version 1.4.4
 *    -2016-2-26  -pulled most of the math and object manipulation functions out and put them in islandFunctions.js
 *  Version 1.5.0
 *    -2016-2-27  -picks random city start point from territories
 *                -finds groups adjacent to city for conquest and increases city by that group, removing it from the master group list
 *  Version 1.5.1
 *    -2016-2-29  -smoothed edges of group border
 *                -groups defined as an object, and biomes are objects biomes.js
 *      needs cellGroup_1.0.0
 *  Version 2.0.0
 * 		-2019-12-09 -Converted to ES6
 * * * * * * * */
//TODO: attempt to relax the border between impassable mountains and the rest
//TODO: make impass borders less straight
//TODO: compute "bonuses" of conquest groups
//FIXME: what to do about islands in ocean or other impassable areas
//FIXME: remove cost from impass highlight

import { constants } from './../constants/constants';
import { VoronoiES6 } from './../classes/VoronoiES6';
import { biomes } from './../constants/biomes';
import paper, { Point, PointText, Path } from 'paper';
import { CellGroup } from './../classes/cellGroup';
import { getCharOrder, computeMCenter, getElevation } from './IslandFunctions';
import { getRealElevation } from './IslandFunctions';
import { getRandomInt } from './IslandFunctions';
import { perlin } from './perlin';

export class Island {
	constructor() {
		this.subscriptions = {};
		this.diagram = null;
		this.voronoi = new VoronoiES6();
		this.sites = [];
		this.seed = -1; //map generator seed, gets set in Init() to random or user defined value

		this.cellsLayer = null;
		this.shadeLayer = null;
		this.riversLayer = null;
		this.cliffLayer = null;
		this.edgeLayer = null;
		this.cityLayer = null;
		this.highlightLayer = null;
		this.myPerlin = null;

		this.nbSites = -1;
		this.mPoint = {};
		this.delta = -1;
		this.territories = { total: 0, size: 0 };
		this.city = new CellGroup('C');
		this.cellIndex = {};
	}

	init = (sd) => {
		this.myPerlin = new perlin();
		this.seed = sd || Math.random();
		// console.log(this.seed);

		//create them in the order they will be displayed, first on the bottom
		this.cellsLayer = new paper.Layer({ name: 'cell' });
		this.shadeLayer = new paper.Layer({
			name: 'shade',
			visible: constants.SHOW_SHADE,
		});
		this.riversLayer = new paper.Layer({ name: 'rivers' });
		this.cliffLayer = new paper.Layer({ name: 'cliff' });
		this.edgeLayer = new paper.Layer({
			name: 'edge',
			visible: constants.SHOW_GROUPS,
		});
		this.cityLayer = new paper.Layer({ name: 'city' });
		this.highlightLayer = new paper.Layer({ name: 'highlight' });

		let perlinCanvas = document.getElementById('perlin');
		perlinCanvas.width = constants.PERLIN_DIM;
		perlinCanvas.height = constants.PERLIN_DIM + 5;
		this.myPerlin.perlinNoise(perlinCanvas, 64, 64, this.seed);
		this.delta = this.randomSites(); // build the diagram

		this.diagram.cellGroups = {
			impassD: new CellGroup(),
			impassM: new CellGroup(),
			ocean: new CellGroup(),
			lakes: new CellGroup(),
			other: new CellGroup(),
		};
		this.assignOceanCoastAndLand();
		this.assignRivers();
		this.assignMoisture();
		this.assignBiomes();
		this.assignGroups();
		this.splitLakes();
		this.splitOther();
		this.pickCityStart();

		this.render();
	};
	getSelectedCell = function(point, realDim) {
		const scale = constants.DIM / realDim; //adjust for possible zoom changes
		point.x = point.x * scale;
		point.y = point.y * scale;

		if (point.x < constants.DIM && point.y < constants.DIM) {
			let closest;
			this.diagram.cells.forEach((cell) => {
				const x = cell.site.x;
				const y = cell.site.y;
				if (
					Math.abs(x - point.x) < this.delta / 2 &&
					Math.abs(y - point.y) < this.delta / 2
				) {
					closest = cell;
					return; //break
				}
			});

			if (closest) {
				return closest;
			} else {
				return null;
			}
		} else {
			return null;
		}
	};
	highlightGroup = function(cell, context) {
		const id = cell.site.voronoiId;
		let array;
		if (context === 'all') {
			this.diagram.cellGroups.forEach((group) => {
				if (group.ids.indexOf(id) !== -1) {
					array = group;
				}
			});
			this.territories.forEach((group) => {
				if (group.ids.indexOf(id) !== -1) {
					array = group;
				}
			});
		} else if (context === 'adj') {
			this.city.neighbors.forEach((groupId) => {
				let group = this.territories[groupId];
				if (group.ids.indexOf(id) !== -1) {
					array = group;
				}
			});
		}
		if (!array) {
			this.highlightLayer.activate();
			this.highlightLayer.removeChildren();
			renderBorder(array, constants.HIGHLIGHT, 2, true);
			renderCell(cell, constants.HIGHLIGHT, 2, false); //uncomment to highlight clicked cell in the group
			return array;
		} else {
			return false;
		}
	};
	clearHightlight = function() {
		this.highlightLayer.removeChildren();
	};
	hideShades = function() {
		this.shadeLayer.visible = false;
		paper.view.draw();
	};
	showShades = function() {
		this.shadeLayer.visible = true;
		paper.view.draw();
	};
	hideAdjoiningTerritories = function() {
		this.highlightLayer.removeChildren();
		this.edgeLayer.visible = false;
		paper.view.draw();
	};
	showAdjoiningTerritories = function() {
		this.highlightLayer.removeChildren();
		this.edgeLayer.visible = true;
		paper.view.draw();
	};
	addGroupToCity = function(cell) {
		console.info('AddGroupToCity');
		const groupId = this.cellIndex[cell.site.voronoiId];
		const group = this.territories[groupId];
		console.info(group);
		console.info(this.city);

		this.updateCity(group);
		paper.view.draw();
	};
	randomSites = () => {
		const order = getCharOrder();
		let sites = [];

		let mLocs = [];
		// create vertices
		this.delta = constants.DIM / (constants.CELL_WIDTH - 1);
		this.nbSites =
			(constants.CELL_WIDTH + constants.CELL_WIDTH - 1) *
			Math.floor(constants.CELL_WIDTH / 2);
		console.log('nbsites', this.nbSites);
		if (constants.CELL_WIDTH % 2 === 1) {
			this.nbSites += constants.CELL_WIDTH;
		}
		let x = 0;
		let y = 0;
		for (let i = 0; i < this.nbSites; i++) {
			const curX = Math.max(
				Math.min(Math.round(x * this.delta), constants.DIM),
				0,
			);
			const curY = Math.max(
				Math.min(Math.round(y * this.delta), constants.DIM),
				0,
			);
			const type = decideBorderValue(
				this.delta,
				curX,
				curY,
				order,
				x,
				y,
				mLocs,
			);
			sites.push({
				x: curX,
				y: curY,
				v: type,
			});
			x = x + 1;
			if (x * this.delta > constants.DIM) {
				x = !(y % 2) ? 0.5 : 0;
				y = y + 1;
			}
		}
		mLocs.sort();
		this.mPoint = computeMCenter(mLocs);

		this.compute(sites);
		/****output grid**** uncomment to print grid of impass characters
	var disY = 0;
	var output = '';
	for(var i = 0; i < nbSites; i++){
	var cell = diagram.cells[i].site;
	if(cell.y != disY){
	console.log(output);
	disY = cell.y;
	output = '';
	}else{
	output += cell.v + ' ';
	}
	}
	console.log(output);
	/**end output grid**/
		return this.delta;
	};

	assignOceanCoastAndLand = () => {
		let queue = [];
		// find border cells and add them to the queue to deal with neighbors
		this.diagram.cells.forEach((cell) => {
			cell.elevation = getElevation(cell.site, this.mPoint, this.myPerlin);
			cell.water = cell.elevation <= 0;

			cell.halfedges.forEach((hedge) => {
				// border
				if (hedge.edge.rSite == null) {
					cell.border = true; // if one of this cell's adjoining cells is null, it is a border cell and this sets it to ocean, impassM, or impassD
					cell.outside = true;
					if (cell.site.v === 'M') {
						setM(cell);
					} else if (cell.site.v === 'D') {
						setD(cell);
					} else {
						setO(cell);
					}
					queue.push(cell);
				}
			});
		});

		// impass
		while (queue.length > 0) {
			let cell = queue.shift(); // aka pop();
			let neighbors = cell.getNeighborIds();
			for (let i = 0; i < neighbors.length; i++) {
				const nId = neighbors[i];
				const neighbor = this.diagram.cells[nId];
				if (cell.border) {
					neighbor.outside = true;
				}
				const processed =
					neighbor.ocean || neighbor.impassM || neighbor.impassD;
				if (!processed) {
					if (neighbor.water || neighbor.outside) {
						if (neighbor.site.v === 'M') {
							setM(neighbor);
						} else if (neighbor.site.v === 'D') {
							setD(neighbor);
						} else {
							setO(neighbor);
						}
						queue.push(neighbor);
					}
				}
			}
		}

		// coast
		this.diagram.cells.forEach((cell) => {
			let numOcean = 0;
			let numImpass = 0;
			let neighbors = cell.getNeighborIds();
			console.log(neighbors);
			neighbors.forEach((neighbor) => {
				if (neighbor.ocean) {
					numOcean++;
				}
				if (neighbor.impassD || neighbor.impassM) {
					numImpass++;
				}
			});
			cell.numOcean = numOcean;
			cell.coast = numOcean > 0 && !cell.water;
			cell.beach =
				cell.coast &&
				cell.elevation < constants.CLIFF_THRESHOLD &&
				!cell.impassD &&
				!cell.impassM;
		});

		// cliff
		this.diagram.edges.forEach((edge) => {
			if (edge.lSite != null && edge.rSite != null) {
				const lCell = this.diagram.cells[edge.lSite.voronoiId];
				const rCell = this.diagram.cells[edge.rSite.voronoiId];
				edge.cliff =
					!(lCell.water && rCell.water) &&
					Math.abs(getRealElevation(lCell) - getRealElevation(rCell)) >=
						constants.CLIFF_THRESHOLD;
			}
		});
	};
	render = () => {
		if (!this.diagram) {
			return;
		}
		this.renderCells();
		this.renderRivers();
		this.renderCliffs();
		paper.view.draw();
	};
	renderCells = () => {
		for (const cellid in this.diagram.cells) {
			const cell = this.diagram.cells[cellid];
			this.cellsLayer.activate();
			renderCell(cell, biomes[cell.biome.name].color, 1, true);
			this.shadeLayer.activate();
			renderCell(cell, this.getShadedCellColor(cell), 1, true);
		}
	};
	getShadedCellColor = (cell) => {
		const c = new paper.Color(biomes[cell.biome.name].color);
		const shade = this.getShade(cell);
		c.brightness = c.brightness - shade;
		return c;
	};

	getShade = (cell) => {
		if (constants.SHADING == 0) {
			return 0;
		} else if (cell.ocean) {
			return constants.SHADE_OCEAN ? -cell.elevation : 0;
		} else if (cell.water) {
			return 0;
		} else {
			let lowerCell = null;
			let upperCell = null;
			let neighbors = cell.getNeighborIds();
			neighbors.forEach((neighbor) => {
				const dElev = Math.abs(cell.elevation - neighbor.elevation);
				if (dElev < constants.CLIFF_THRESHOLD) {
					if (lowerCell == null || neighbor.elevation < lowerCell.elevation) {
						lowerCell = neighbor;
					}
					if (upperCell == null || neighbor.elevation > upperCell.elevation) {
						upperCell = neighbor;
					}
				}
			});
			if (lowerCell != null && upperCell != null) {
				const angleRadian = Math.atan2(
					upperCell.site.x - lowerCell.site.x,
					upperCell.site.y - lowerCell.site.y,
				);
				const angleDegree = angleRadian * (180 / Math.PI);
				let diffElevation =
					getRealElevation(upperCell) - getRealElevation(lowerCell);

				if (diffElevation + constants.SHADING < 1) {
					diffElevation = diffElevation + constants.SHADING;
				}
				let mult = 1;
				if (cell.impassD) {
					mult = 0.5;
				}
				return (Math.abs(angleDegree) / 180) * diffElevation * mult;
			} else {
				return 0;
			}
		}
	};

	updateCity = (group) => {
		this.city.cells = this.city.cells.concat(group.cells);
		this.city.ids = this.city.ids.concat(group.ids);
		delete this.city.edgePath;
		this.city.setEdges();
		for (const name in group.biomes) {
			if (!this.city.biomes[name]) {
				this.city.biomes[name] = group.biomes[name];
			} else {
				this.city.biomes[name] += group.biomes[name];
			}
		}
		delete this.territories[group.id];
		group.ids.forEach((id) => {
			delete this.cellIndex[id];
		});
		this.cityLayer.activate();
		this.highlightLayer.removeChildren();
		this.cityLayer.removeChildren();
		renderBorder(this.city, constants.CITY_BORDER, 5);
		this.city.setNeighbors(this.cellIndex);
		this.edgeLayer.activate();
		this.edgeLayer.removeChildren();
		for (const groupId in this.city.neighbors) {
			renderBorder(this.territories[groupId], constants.EDGE_COLOR, 1, true);
		}
	};

	compute = (s) => {
		this.sites = s;
		this.voronoi.recycle(this.diagram);
		const bbox = {
			xl: 0,
			xr: constants.DIM,
			yt: 0,
			yb: constants.DIM,
		};
		this.diagram = this.voronoi.compute(s, bbox);
	};

	assignBiomes = () => {
		this.diagram.cells.forEach((cell) => {
			cell.biome = getBiome(cell);
		});
	};

	assignRivers = () => {
		for (let i = 0; i < this.nbSites / 50; ) {
			const cell = this.diagram.cells[
				getRandomInt(0, this.diagram.cells.length - 1)
			];
			if (!cell.coast && !cell.impassD) {
				//}&& !cell.impassM){
				if (this.setAsRiver(cell, 1)) {
					cell.source = true;
					i++;
				}
			}
		}
	};
	setAsRiver = (cell, size) => {
		//console.log(cell.site);
		if (!cell.water && !cell.river) {
			cell.river = true;
			cell.riverSize = size;
			if (!cell.impassD) {
				//don't let the river carry on into the desert
				let lowerCell = null;
				const neighbors = cell.getNeighborIds();
				// we choose the lowest neighbour cell :
				for (let j = 0; j < neighbors.length; j++) {
					const neighbor = this.diagram.cells[neighbors[j]];
					if (lowerCell == null || neighbor.elevation < lowerCell.elevation) {
						lowerCell = neighbor;
					}
				}
				if (lowerCell.elevation < cell.elevation) {
					// we continue the river to the next lowest cell :
					this.setAsRiver(lowerCell, size);
					cell.nextRiver = lowerCell;
				} else {
					// we are in a hole, so we create a lake :
					cell.water = true;
				}
			}
		} else if (cell.water && !cell.ocean) {
			// we ended in a lake, the water level rise :
			cell.lakeElevation =
				getRealElevation(cell) + constants.LAKE_THRESHOLD * size;
			this.fillLake(cell);
		} else if (cell.river) {
			// we ended in another river, the river size increase :
			cell.riverSize++;
			let nextRiver = cell.nextRiver;
			while (nextRiver) {
				nextRiver.riverSize++;
				nextRiver = nextRiver.nextRiver;
			}
		}
		return cell.river;
	};
	fillLake = (cell) => {
		// if the lake has an exit river he can not longer be filled
		if (cell.exitRiver == null) {
			var exitRiver = null;
			var exitSource = null;
			var lake = [];
			var queue = [];
			queue.push(cell);

			while (queue.length > 0) {
				var c = queue.shift();
				lake.push(c);
				var neighbors = c.getNeighborIds();
				for (var i = 0; i < neighbors.length; i++) {
					var nId = neighbors[i];
					var neighbor = this.diagram.cells[nId];

					if (neighbor.water && !neighbor.ocean) {
						// water cell from the same lake
						if (
							neighbor.lakeElevation == null ||
							neighbor.lakeElevation < c.lakeElevation
						) {
							neighbor.lakeElevation = c.lakeElevation;
							queue.push(neighbor);
						}
					} else if (!neighbor.impassD) {
						// ground cell adjacent to the lake that's not an impassible desert
						if (c.elevation < neighbor.elevation) {
							if (neighbor.elevation - c.lakeElevation < 0) {
								// neighbor is heigher than the current cell, but lower than
								// the level of the water
								// we fill the ground with water
								neighbor.water = true;
								neighbor.lakeElevation = c.lakeElevation;
								queue.push(neighbor);
							}
						} else {
							// neighbor is lower than the current cell
							// neighbor.source = true;
							// we found an new exit for the lake :
							if (
								exitRiver == null ||
								exitRiver.elevation > neighbor.elevation
							) {
								exitSource = c;
								exitRiver = neighbor;
							}
						}
					}
				}
			}

			if (exitRiver != null) {
				// we start the exit river :
				exitSource.river = true;
				exitSource.nextRiver = exitRiver;
				this.setAsRiver(exitRiver, 2);
				// we mark all the lake as having an exit river :
				while (lake.length > 0) {
					var c = lake.shift();
					c.exitRiver = exitRiver;
				}
			}
		}
	};
	assignMoisture = () => {
		var queue = [];
		// lake and river
		for (var i = 0; i < this.diagram.cells.length; i++) {
			var cell = this.diagram.cells[i];
			if ((cell.water || cell.river) && !cell.ocean && !cell.impassD) {
				cell.moisture = cell.water ? 1 : 0.9;
				queue.push(cell);
			} else if (cell.ocean) {
				cell.moisture = 1;
			} else if (cell.impassD) {
				cell.moisture = 0;
			}
		}

		while (queue.length > 0) {
			let cell = queue.shift(); // pop
			var neighbors = getNeighborIdsCliff(cell);
			for (var i = 0; i < neighbors.length; i++) {
				var nId = neighbors[i];
				var neighbor = this.diagram.cells[nId];
				var newMoisture = cell.moisture * 0.9;
				if (
					(neighbor.moisture == null || newMoisture > neighbor.moisture) &&
					!neighbor.ocean &&
					!neighbor.impassD
				) {
					neighbor.moisture = newMoisture;
					queue.push(neighbor);
				}
			}
		}
	};
	assignGroups = () => {
		this.diagram.cells.forEach((cell, index) => {
			if (cell.impassM) {
				this.diagram.cellGroups.impassM.ids.push(cell.site.voronoiId);
				this.diagram.cellGroups.impassM.cells.push(cell);
			} else if (cell.impassD) {
				this.diagram.cellGroups.impassD.ids.push(cell.site.voronoiId);
				this.diagram.cellGroups.impassD.cells.push(cell);
			} else if (cell.ocean) {
				this.diagram.cellGroups.ocean.ids.push(cell.site.voronoiId);
				this.diagram.cellGroups.ocean.cells.push(cell);
			} else if (cell.biome.name == 'LAKE') {
				this.diagram.cellGroups.lakes.ids.push(cell.site.voronoiId);
				this.diagram.cellGroups.lakes.cells.push(cell);
			} else {
				this.diagram.cellGroups.other.ids.push(cell.site.voronoiId);
				this.diagram.cellGroups.other.cells.push(cell);
			}
		});
		for (const group in this.diagram.cellGroups) {
			this.diagram.cellGroups[group].setEdges(); //gets the outer edges of the group
		}
	};
	splitLakes = () => {
		var count = 1;
		var lake = new CellGroup(count);
		var lakeIds = this.diagram.cellGroups.lakes.ids;
		var lakeCells = this.diagram.cellGroups.lakes.cells;
		while (lakeCells.length > 0) {
			var id = lakeIds.shift();
			var cell = lakeCells.shift();
			lake.cells.push(cell);
			lake.ids.push(id);
			var queue = [];
			queue.push(cell);
			while (queue.length > 0) {
				var c = queue.shift();
				var neighbors = getNeighborIdsIn(c, lakeIds);
				for (var i = 0; i < neighbors.length; i++) {
					var nId = neighbors[i];
					var nLoc = lakeIds.indexOf(nId);
					let neighbor = lakeCells.splice(nLoc, 1)[0];
					let neighborId = lakeIds.splice(nLoc, 1)[0];
					lake.cells.push(neighbor);
					lake.ids.push(neighborId);
					queue.push(neighbor);
				}
			}
			lake.setEdges();
			this.diagram.cellGroups['lake' + count] = lake;
			lake = new CellGroup(count);
			count++;
		}
		delete this.diagram.cellGroups.lakes;
	};
	splitOther = () => {
		var count = 1;
		var allCells = this.diagram.cellGroups.other.cells;
		var allIds = this.diagram.cellGroups.other.ids;
		while (allCells.length > 0) {
			var group = new CellGroup(count);
			var id = allIds.pop();
			var cell = allCells.pop();
			group.ids.push(id);
			group.cells.push(cell);
			if (group.biomes[cell.biome.name] == undefined) {
				group.biomes[cell.biome.name] = 1;
			} else {
				group.biomes[cell.biome.name]++;
			}
			this.cellIndex[id] = count;
			var queue = [];
			while (
				group.cells.length < constants.MAX_GROUP_SIZE &&
				allCells.length > 0
			) {
				var neighbors = this.getNeighborIdsInOut(cell, allIds, queue);
				queue = queue.concat(neighbors);
				if (queue.length == 0) {
					break;
				}
				var loc = allIds.indexOf(queue.shift());
				id = allIds.splice(loc, 1)[0];
				cell = allCells.splice(loc, 1)[0];
				group.ids.push(id);
				group.cells.push(cell);
				if (group.biomes[cell.biome.name] == undefined) {
					group.biomes[cell.biome.name] = 1;
				} else {
					group.biomes[cell.biome.name]++;
				}
				this.cellIndex[id] = count;
			}
			queue = [];
			group.setEdges();
			group.setCost();

			this.territories[count] = group;
			this.territories.total++;
			this.territories.size++;
			count++;
			var group = new CellGroup(count);
		}
		delete this.diagram.cellGroups.other;
	};
	getNeighborIdsInOut = (cell, inArray, outArray) => {
		var a = [],
			b = cell.halfedges.length,
			c;
		while (b--) {
			c = cell.halfedges[b].edge;
			if (c.lSite !== null && c.lSite.voronoiId != cell.site.voronoiId) {
				if (
					inArray.indexOf(c.lSite.voronoiId) != -1 &&
					outArray.indexOf(c.lSite.voronoiId) == -1
				) {
					a.push(c.lSite.voronoiId);
				}
			} else {
				if (c.rSite !== null && c.rSite.voronoiId != cell.site.voronoiId) {
					if (
						inArray.indexOf(c.rSite.voronoiId) != -1 &&
						outArray.indexOf(c.rSite.voronoiId) == -1
					) {
						a.push(c.rSite.voronoiId);
					}
				}
			}
		}
		return a;
	};
	pickCityStart = () => {
		var loc = getRandomInt(1, this.territories.size);
		var group = this.territories[loc];
		while (
			group.cells.length < constants.MAX_GROUP_SIZE ||
			(group.biomes.GRASSLAND == undefined &&
				group.biomes.TEMPERATE_DECIDUOUS_FOREST == undefined &&
				group.biomes.TEMPERATE_RAIN_FOREST == undefined &&
				group.biomes.TROPICAL_SEASONAL_FOREST == undefined &&
				group.biomes.TROPICAL_RAIN_FOREST == undefined)
		) {
			loc = (loc + 1) % this.territories.size;
			group = this.territories[loc];
		}
		this.updateCity(group);
		if (Object.keys(this.city.neighbors) < 3) {
			this.city = new CellGroup();
			this.pickCityStart();
		}
		paper.view.draw();
	};
	renderRivers = () => {
		for (var cellid in this.diagram.cells) {
			var cell = this.diagram.cells[cellid];
			if (cell.nextRiver) {
				this.riversLayer.activate();
				var riverPath = new Path();
				riverPath.strokeWidth = Math.min(
					cell.riverSize,
					constants.MAX_RIVER_SIZE,
				);
				var riverColor = new paper.Color(constants.RIVER);
				riverColor.brightness = riverColor.brightness - this.getShade(cell);
				riverPath.strokeColor = riverColor;
				riverPath.strokeCap = 'round';
				if (cell.water) {
					riverPath.add(
						new Point(
							cell.site.x + (cell.nextRiver.site.x - cell.site.x) / 2,
							cell.site.y + (cell.nextRiver.site.y - cell.site.y) / 2,
						),
					);
				} else {
					riverPath.add(new Point(cell.site.x, cell.site.y));
				}
				if (cell.nextRiver && !cell.nextRiver.water) {
					riverPath.add(
						new Point(cell.nextRiver.site.x, cell.nextRiver.site.y),
					);
				} else {
					riverPath.add(
						new Point(
							cell.site.x + (cell.nextRiver.site.x - cell.site.x) / 2,
							cell.site.y + (cell.nextRiver.site.y - cell.site.y) / 2,
						),
					);
				}
			}
		}
	};
	renderCliffs = () => {
		this.cliffLayer.activate();
		var edges = this.diagram.edges,
			iEdge = edges.length,
			edge,
			v;
		while (iEdge--) {
			edge = edges[iEdge];
			var edgePath = new Path();
			edgePath.strokeWidth = 1;
			if (edge.cliff) {
				edgePath.strokeWidth = 1;
				edgePath.strokeCap = 'round';
				edgePath.strokeColor = constants.ROCK;
				v = edge.va;
				edgePath.add(new Point(v.x, v.y));
				v = edge.vb;
				edgePath.add(new Point(v.x, v.y));
			} else {
			}
		}
	};
}

function decideBorderValue(delta, realX, realY, order, x, y, mLocs) {
	var adjX = realX + 1; // avoid div by 0
	var adjY = realY + 1; // avoid div by 0
	/*
	 * Account for non-square grids.
	 * If the grid is non-square, we must strech the values of the shorter side for when
	 * when we calculate the diagonals to keep half above and half below the angle
	 */
	let perc;
	if (constants.DIM > constants.DIM) {
		perc = constants.DIM / constants.DIM;
		adjY = adjY * perc;
	} else {
		perc = constants.DIM / constants.DIM;
		adjX = adjX * perc;
	}
	/*
	 * Decide to which area (one eighth of the grid) this point belongs
	 * Areas are divided up radially around the midpoint (a0-a7).
	 * If the grid were a clock face, the areas would be 1 1/2 hours long
	 *     10:30  12:00   1:30
	 *        \     |     /
	 *         \ a1 | a2 /
	 *          \   |   /
	 *       a0  \  |  / a3
	 *            \ | /
	 * 9:00---------+---------3:00
	 *            / | \
	 *       a7  /  |  \  a4
	 *          /   |   \
	 *         / a6 | a5 \
	 *        /     |     \
	 *      7:30   6:00   4:30
	 */
	// Top-Left to Bottom-Right diagonal
	var val1 = -5; // default/error value
	if (adjX / adjY < 1) {
		val1 = 1; // bottom-left half [a0, a7, a6, a5]
	} else if (adjX / adjY > 1) {
		val1 = 0; // top-right half [a1, a2, a3, a4]
	} else {
		if (y < constants.DIM / 2) {
			val1 = 0; // top half of the axis belongs to the top-right
		} else {
			val1 = 1; // bottom half of the axis belongs to the bottom-left
		}
	}
	// Top-Right to Bottom-Left diagonal
	var val2 = -5; // default/error value
	if (adjX + adjY < Math.max(constants.DIM, constants.DIM) + 1) {
		val2 = 4; // bottom-left half [a7, a0, a1, a2]
	} else if (adjX + adjY > Math.max(constants.DIM, constants.DIM) + 1) {
		val2 = 2; // top-right half [a6, a5, a4, a3]
	} else {
		if (y < constants.DIM / 2) {
			val2 = 4; // top half of the axis belongs to the bottom-left
		} else {
			val2 = 2; // bottom half of the axis belongs to the top right
		}
	}
	// Vertical midpoint
	var val3 = 1; // left half and center [a1, a0, a7, a6]
	if (adjX > constants.DIM / 2) {
		val3 = 0; // right half [a2, a3, a4, a5]
	}
	// Horizontal midpoint
	var val4 = 0; // top half and center [a0, a1, a2, a3]
	if (adjY > constants.DIM / 2) {
		val4 = 5; // bottom half [a7, a6, a5, a4]
	}
	var type = '_'; // default value
	// values for each half-division of the grid are picked in such a way that the sum of the 4 numbers will give unique
	// results for each area of the grid
	switch (val1 + val2 + val3 + val4) {
		case 6: // a0
			type = order[0];
			if (type == 'M' && mLocs.indexOf(0) == -1) {
				mLocs.push(0);
			}
			break;
		case 5: // a1
			type = order[1];
			if (type == 'M' && mLocs.indexOf(1) == -1) {
				mLocs.push(1);
			}
			break;
		case 4: // a2
			type = order[2];
			if (type == 'M' && mLocs.indexOf(2) == -1) {
				mLocs.push(2);
			}
			break;
		case 2: // a3
			type = order[3];
			if (type == 'M' && mLocs.indexOf(3) == -1) {
				mLocs.push(3);
			}
			break;
		case 7: // a4
			type = order[4];
			if (type == 'M' && mLocs.indexOf(4) == -1) {
				mLocs.push(4);
			}
			break;
		case 8: // a5
			type = order[5];
			if (type == 'M' && mLocs.indexOf(5) == -1) {
				mLocs.push(5);
			}
			break;
		case 9: // a6
			type = order[6];
			if (type == 'M' && mLocs.indexOf(6) == -1) {
				mLocs.push(6);
			}
			break;
		case 11: // a7
			type = order[7];
			if (type == 'M' && mLocs.indexOf(7) == -1) {
				mLocs.push(7);
			}
			break;
		default:
			// error value
			type = '_';
	}

	return type;
}

function setM(cell) {
	while (cell.elevation < 1) {
		cell.elevation += 1;
	}
	cell.water = false;
	cell.impassM = true;
}
function setD(cell) {
	while (cell.elevation < 0) {
		cell.elevation += 0.1;
	}
	while (cell.elevation > 0.01) {
		cell.elevation = cell.elevation / 10;
	}
	cell.water = false;
	cell.impassD = true;
}
function setO(cell) {
	cell.ocean = true;
	cell.elevation = Math.min(cell.elevation, 0);
}

function getNeighborIdsCliff(cell) {
	var a = [],
		b = cell.halfedges.length,
		c;
	while (b--) {
		c = cell.halfedges[b].edge;
		if (!c.cliff) {
			if (c.lSite !== null && c.lSite.voronoiId != cell.site.voronoiId) {
				a.push(c.lSite.voronoiId);
			} else {
				if (c.rSite !== null && c.rSite.voronoiId != cell.site.voronoiId) {
					a.push(c.rSite.voronoiId);
				}
			}
		}
	}
	return a;
}
function getNeighborIdsIn(cell, array) {
	var a = [],
		b = cell.halfedges.length,
		c;
	while (b--) {
		c = cell.halfedges[b].edge;
		if (c.lSite !== null && c.lSite.voronoiId != cell.site.voronoiId) {
			if (array.indexOf(c.lSite.voronoiId) != -1) {
				a.push(c.lSite.voronoiId);
			}
		} else {
			if (c.rSite !== null && c.rSite.voronoiId != cell.site.voronoiId) {
				if (array.indexOf(c.rSite.voronoiId) != -1) {
					a.push(c.rSite.voronoiId);
				}
			}
		}
	}
	return a;
}
// Calculate moisture. Freshwater sources spread moisture: rivers and lakes (not ocean).

function getBiome(cell) {
	if (cell.ocean) {
		return biomes.OCEAN;
	} else if (cell.water) {
		if (getRealElevation(cell) < 0.05) return biomes.MARSH;
		if (getRealElevation(cell) > 0.4) return biomes.ICE;
		return biomes.LAKE;
	} else if (cell.beach) {
		return biomes.BEACH;
	} else if (cell.impassD) {
		return biomes.IMPASSIBLE_DESERT;
	} else if (cell.elevation > 0.4) {
		//Mountainous
		if (cell.moisture > 0.5) return biomes.SNOW;
		else if (cell.moisture > 0.33) return biomes.TUNDRA;
		else if (cell.moisture > 0.16) return biomes.BARE;
		else return biomes.SCORCHED;
	} else if (cell.elevation > 0.3) {
		//Foothills
		if (cell.moisture > 0.66) return biomes.TAIGA;
		else if (cell.moisture > 0.33) return biomes.SHRUBLAND;
		else return biomes.TEMPERATE_DESERT;
	} else if (cell.elevation > 0.15) {
		//Normal Elevation
		if (cell.moisture > 0.83) return biomes.TEMPERATE_RAIN_FOREST;
		else if (cell.moisture > 0.5) return biomes.TEMPERATE_DECIDUOUS_FOREST;
		else if (cell.moisture > 0.16) return biomes.GRASSLAND;
		else return biomes.TEMPERATE_DESERT;
	} else {
		//Lowlands
		if (cell.moisture > 0.66) return biomes.TROPICAL_RAIN_FOREST;
		else if (cell.moisture > 0.33) return biomes.TROPICAL_SEASONAL_FOREST;
		else if (cell.moisture > 0.16) return biomes.GRASSLAND;
		else return biomes.SUBTROPICAL_DESERT;
	}
}

function renderCell(cell, color, stroke, fill) {
	var cellPath = new Path();
	cellPath.strokeWidth = stroke;
	cellPath.strokeColor = color;
	if (fill) {
		cellPath.fillColor = color;
	}
	var start = cell.halfedges[0].getStartPoint();
	cellPath.add(new Point(start.x, start.y));
	for (var iHalfedge = 0; iHalfedge < cell.halfedges.length; iHalfedge++) {
		var halfEdge = cell.halfedges[iHalfedge];
		var end = halfEdge.getEndpoint();
		cellPath.add(new Point(end.x, end.y));
	}
	cellPath.closed = true;
}

function renderBorder(array, color, stroke, cost) {
	//FIXME: doesn't take into account multiple split areas in impass areas, or islands within them
	var edges = array.edges.slice(); //get a copy of the array, so we don't clear it out
	var path = new Path();
	path.strokeWidth = stroke;
	path.strokeColor = color;
	path.strokeJoin = 'round';
	if (array.id == 'C') {
		//the city gets a transparent fill
		path.fillColor = color;
		path.fillColor.alpha = 0.25;
	}
	if (array.edgePath == undefined) {
		var edgePath = [];
		var edge = edges.shift();
		var end = edge.vb;
		path.add(edge.va);
		edgePath.push(edge.va);
		path.add(end);
		edgePath.push(end);
		for (var i = 0; i < edges.length; i++) {
			edge = edges[i];
			if (end.x == edge.va.x && end.y == edge.va.y) {
				//vertexA matches our current path end
				edges.splice(i, 1);
				end = edge.vb;
				path.add(end);
				edgePath.push(end);
				i = -1; //next iteration of the loop  will start by looking at the first element of it
			} else if (end.x == edge.vb.x && end.y == edge.vb.y) {
				//vertexB matches out current path end
				edges.splice(i, 1);
				end = edge.va;
				path.add(end);
				edgePath.push(end);
				i = -1; //next iteration of the loop  will start by looking at the first element of it
			}
		}
		array.edgePath = edgePath;
	} else {
		array.edgePath.forEach(function(index, point) {
			path.add(point);
		});
	}
	path.closed = true;
	if (cost) {
		//FIXME: ensure that outer bounds of text are inside the path probable with each corner checked for path.contains(point)
		var text = new PointText(path.bounds.center);
		text.content = array.cost;
		text.fillColor = color;
		text.justification = 'center';
		var costHeight = text.bounds.height;
		text.position.y += costHeight / 4;
	}
}
