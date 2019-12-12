export class Cell {
	constructor(a) {
		this.site = a;
		this.halfedges = [];
		this.closeMe = false;
	}
	init = function(a) {
		this.site = a;
		this.halfedges = [];
		this.closeMe = false;
		return this;
	};
	createCell = function(b) {
		var a = this.cellJunkyard.pop();
		if (a) {
			return a.init(b);
		}
		return new this.Cell(b);
	};
	prepareHalfedges = function() {
		var a = this.halfedges,
			b = a.length,
			c;
		while (b--) {
			c = a[b].edge;
			if (!c.vb || !c.va) {
				a.splice(b, 1);
			}
		}
		a.sort(function(e, d) {
			return d.angle - e.angle;
		});
		return a.length;
	};
	getNeighborIds = function() {
		var a = [],
			b = this.halfedges.length,
			c;
		while (b--) {
			c = this.halfedges[b].edge;
			if (c.lSite !== null && c.lSite.voronoiId != this.site.voronoiId) {
				a.push(c.lSite.voronoiId);
			} else {
				if (c.rSite !== null && c.rSite.voronoiId != this.site.voronoiId) {
					a.push(c.rSite.voronoiId);
				}
			}
		}
		return a;
	};
	getBbox = function() {
		var i = this.halfedges,
			d = i.length,
			a = Infinity,
			g = Infinity,
			c = -Infinity,
			b = -Infinity,
			h,
			f,
			e;
		while (d--) {
			h = i[d].getStartPoint();
			f = h.x;
			e = h.y;
			if (f < a) {
				a = f;
			}
			if (e < g) {
				g = e;
			}
			if (f > c) {
				c = f;
			}
			if (e > b) {
				b = e;
			}
		}
		return { x: a, y: g, width: c - a, height: b - g };
	};
	pointIntersection = function(a, h) {
		var b = this.halfedges,
			c = b.length,
			f,
			g,
			e,
			d;
		while (c--) {
			f = b[c];
			g = f.getStartPoint();
			e = f.getEndpoint();
			d = (h - g.y) * (e.x - g.x) - (a - g.x) * (e.y - g.y);
			if (!d) {
				return 0;
			}
			if (d > 0) {
				return -1;
			}
		}
		return 1;
	};
}
