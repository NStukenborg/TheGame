export class PRNG {
	constructor() {
		this.seed = 1;
	}
	next = function() {
		return this.gen() / 2147483647;
	};
	nextRange = function(min, max) {
		return min + (max - min) * this.next();
	};
	gen = function() {
		return (this.seed = (this.seed * 16807) % 2147483647);
	};
}
