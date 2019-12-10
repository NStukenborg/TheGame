export class CellGroup {
	constructor(i) {
		this.cells = [];
		this.ids = [];
		this.edges = [];
		this.biomes = {};
		this.id = i;
		this.cost = 0;
	}
	setEdges = function() {
		var groupEdges = [];
		var idList = this.ids;
		this.cells.forEach(function(cell, index) {
			cell.halfedges.forEach(function(halfedge, index) {
				var edge = halfedge.edge;
				if (
					edge.lSite == null ||
					edge.rSite == null ||
					idList.indexOf(edge.lSite.voronoiId) === -1 ||
					idList.indexOf(edge.rSite.voronoiId) === -1
				) {
					groupEdges.push(edge);
				}
			});
		});
		this.edges = groupEdges;
	};
	setNeighbors = function(cellIndex) {
		var neighborList = {};
		this.edges.forEach(function(edge, index) {
			var lId = cellIndex[edge.lSite.voronoiId];
			if (lId) {
				neighborList[lId] = lId;
			}
			var rId = cellIndex[edge.rSite.voronoiId];
			if (rId) {
				neighborList[rId] = rId;
			}
		});
		this.neighbors = neighborList;
	};
	setCost = function() {
		var c = 0;
		this.cells.forEach(function(cell, index) {
			c += cell.biome.cost;
			if (cell.river) {
				c--;
			}
		});
		this.cost = c;
	};
}
