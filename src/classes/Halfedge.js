export class Halfedge {
	constructor(d, e, a) {
		this.site = e;
		this.edge = d;
		if (a) {
			this.angle = Math.atan2(a.y - e.y, a.x - e.x);
		} else {
			var c = d.va,
				b = d.vb;
			this.angle =
				d.lSite === e
					? Math.atan2(b.x - c.x, c.y - b.y)
					: Math.atan2(c.x - b.x, b.y - c.y);
		}
	}
	getStartpoint = function() {
		return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
	};
	getEndpoint = function() {
		return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
	};
}
