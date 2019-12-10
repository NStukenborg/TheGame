export class RBTree {
	constructor() {
		this.root = null;
	}
	rbInsertSuccessor = function(e, a) {
		var d;
		if (e) {
			a.rbPrevious = e;
			a.rbNext = e.rbNext;
			if (e.rbNext) {
				e.rbNext.rbPrevious = a;
			}
			e.rbNext = a;
			if (e.rbRight) {
				e = e.rbRight;
				while (e.rbLeft) {
					e = e.rbLeft;
				}
				e.rbLeft = a;
			} else {
				e.rbRight = a;
			}
			d = e;
		} else {
			if (this.root) {
				e = this.getFirst(this.root);
				a.rbPrevious = null;
				a.rbNext = e;
				e.rbPrevious = a;
				e.rbLeft = a;
				d = e;
			} else {
				a.rbPrevious = a.rbNext = null;
				this.root = a;
				d = null;
			}
		}
		a.rbLeft = a.rbRight = null;
		a.rbParent = d;
		a.rbRed = true;
		var c, b;
		e = a;
		while (d && d.rbRed) {
			c = d.rbParent;
			if (d === c.rbLeft) {
				b = c.rbRight;
				if (b && b.rbRed) {
					d.rbRed = b.rbRed = false;
					c.rbRed = true;
					e = c;
				} else {
					if (e === d.rbRight) {
						this.rbRotateLeft(d);
						e = d;
						d = e.rbParent;
					}
					d.rbRed = false;
					c.rbRed = true;
					this.rbRotateRight(c);
				}
			} else {
				b = c.rbLeft;
				if (b && b.rbRed) {
					d.rbRed = b.rbRed = false;
					c.rbRed = true;
					e = c;
				} else {
					if (e === d.rbLeft) {
						this.rbRotateRight(d);
						e = d;
						d = e.rbParent;
					}
					d.rbRed = false;
					c.rbRed = true;
					this.rbRotateLeft(c);
				}
			}
			d = e.rbParent;
		}
		this.root.rbRed = false;
	};
	rbRemoveNode = function(f) {
		if (f.rbNext) {
			f.rbNext.rbPrevious = f.rbPrevious;
		}
		if (f.rbPrevious) {
			f.rbPrevious.rbNext = f.rbNext;
		}
		f.rbNext = f.rbPrevious = null;
		var e = f.rbParent,
			g = f.rbLeft,
			b = f.rbRight,
			d;
		if (!g) {
			d = b;
		} else {
			if (!b) {
				d = g;
			} else {
				d = this.getFirst(b);
			}
		}
		if (e) {
			if (e.rbLeft === f) {
				e.rbLeft = d;
			} else {
				e.rbRight = d;
			}
		} else {
			this.root = d;
		}
		var a;
		if (g && b) {
			a = d.rbRed;
			d.rbRed = f.rbRed;
			d.rbLeft = g;
			g.rbParent = d;
			if (d !== b) {
				e = d.rbParent;
				d.rbParent = f.rbParent;
				f = d.rbRight;
				e.rbLeft = f;
				d.rbRight = b;
				b.rbParent = d;
			} else {
				d.rbParent = e;
				e = d;
				f = d.rbRight;
			}
		} else {
			a = f.rbRed;
			f = d;
		}
		if (f) {
			f.rbParent = e;
		}
		if (a) {
			return;
		}
		if (f && f.rbRed) {
			f.rbRed = false;
			return;
		}
		var c;
		do {
			if (f === this.root) {
				break;
			}
			if (f === e.rbLeft) {
				c = e.rbRight;
				if (c.rbRed) {
					c.rbRed = false;
					e.rbRed = true;
					this.rbRotateLeft(e);
					c = e.rbRight;
				}
				if ((c.rbLeft && c.rbLeft.rbRed) || (c.rbRight && c.rbRight.rbRed)) {
					if (!c.rbRight || !c.rbRight.rbRed) {
						c.rbLeft.rbRed = false;
						c.rbRed = true;
						this.rbRotateRight(c);
						c = e.rbRight;
					}
					c.rbRed = e.rbRed;
					e.rbRed = c.rbRight.rbRed = false;
					this.rbRotateLeft(e);
					f = this.root;
					break;
				}
			} else {
				c = e.rbLeft;
				if (c.rbRed) {
					c.rbRed = false;
					e.rbRed = true;
					this.rbRotateRight(e);
					c = e.rbLeft;
				}
				if ((c.rbLeft && c.rbLeft.rbRed) || (c.rbRight && c.rbRight.rbRed)) {
					if (!c.rbLeft || !c.rbLeft.rbRed) {
						c.rbRight.rbRed = false;
						c.rbRed = true;
						this.rbRotateLeft(c);
						c = e.rbLeft;
					}
					c.rbRed = e.rbRed;
					e.rbRed = c.rbLeft.rbRed = false;
					this.rbRotateRight(e);
					f = this.root;
					break;
				}
			}
			c.rbRed = true;
			f = e;
			e = e.rbParent;
		} while (!f.rbRed);
		if (f) {
			f.rbRed = false;
		}
	};
	rbRotateLeft = function(b) {
		var d = b,
			c = b.rbRight,
			a = d.rbParent;
		if (a) {
			if (a.rbLeft === d) {
				a.rbLeft = c;
			} else {
				a.rbRight = c;
			}
		} else {
			this.root = c;
		}
		c.rbParent = a;
		d.rbParent = c;
		d.rbRight = c.rbLeft;
		if (d.rbRight) {
			d.rbRight.rbParent = d;
		}
		c.rbLeft = d;
	};
	rbRotateRight = function(b) {
		var d = b,
			c = b.rbLeft,
			a = d.rbParent;
		if (a) {
			if (a.rbLeft === d) {
				a.rbLeft = c;
			} else {
				a.rbRight = c;
			}
		} else {
			this.root = c;
		}
		c.rbParent = a;
		d.rbParent = c;
		d.rbLeft = c.rbRight;
		if (d.rbLeft) {
			d.rbLeft.rbParent = d;
		}
		c.rbRight = d;
	};
	getFirst = function(a) {
		while (a.rbLeft) {
			a = a.rbLeft;
		}
		return a;
	};
	getLast = function(a) {
		while (a.rbRight) {
			a = a.rbRight;
		}
		return a;
	};
}
