import { constants } from 'constants/constants';
import { getRandomInt } from './IslandFunctions';

export const getCharOrder = function() {
	let maxRand = 4;
	let last = '_';
	let charList = [];
	// Put the chars for the border tiles into a list in a random order.
	//    Chars must be grouped by kind.
	//    Chars can only be put in once.
	//    Chars must be in groups of 2-4 to fill the 8 position array.
	//      If one char has 4 positions, the others must have 2.
	//      If one char has 3 positions, the others can have 3 or 2
	while (charList.length < 8) {
		if (constants.CHARS.length !== 0) {
			const index = 0 + getRandomInt(0, constants.CHARS.length - 1);
			const numberToAdd = getRandomInt(2, maxRand);

			if (numberToAdd === 4) {
				maxRand = 2;
			} else {
				maxRand = 3;
			}
			for (let i = 0; i < numberToAdd && charList.length < 8; i++) {
				last = constants.CHARS[index];
				charList.push(last);
			}
			constants.CHARS.splice(index, 1);
		} else {
			charList.push(last);
		}
	}
	//Decide the order the charList is going to be applied to the grid areas.
	var start = getRandomInt(0, 8);
	var order = [];
	for (let i = 0; i < 8; i++) {
		if (start >= 8) {
			start = 0;
		}
		order.push(charList[start]);
		start++;
	}
	return order;
};

export function decideBorderValue(delta, realX, realY, order, x, y, mLocs) {
	const adjX = realX + 1; // avoid div by 0
	const adjY = realY + 1; // avoid div by 0
	/*
	 * Account for non-square grids.
	 * If the grid is non-square, we must strech the values of the shorter side for when
	 * when we calculate the diagonals to keep half above and half below the angle
	 */
	//let perc;
	// if (constants.DIM > constants.DIM) {
	// 	perc = constants.DIM / constants.DIM;
	// 	adjY = adjY * perc;
	// } else {
	// 	perc = constants.DIM / constants.DIM;
	// 	adjX = adjX * perc;
	// }
	//perc = 1;
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
	let val1 = -5; // default/error value
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
	let val2 = -5; // default/error value
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
	let val3 = 1; // left half and center [a1, a0, a7, a6]
	if (adjX > constants.DIM / 2) {
		val3 = 0; // right half [a2, a3, a4, a5]
	}
	// Horizontal midpoint
	let val4 = 0; // top half and center [a0, a1, a2, a3]
	if (adjY > constants.DIM / 2) {
		val4 = 5; // bottom half [a7, a6, a5, a4]
	}
	let type = '_'; // default value
	// values for each half-division of the grid are picked in such a way that the sum of the 4 numbers will give unique
	// results for each area of the grid
	switch (val1 + val2 + val3 + val4) {
		case 6: // a0
			type = order[0];
			if (type === 'M' && mLocs.indexOf(0) === -1) {
				mLocs.push(0);
			}
			break;
		case 5: // a1
			type = order[1];
			if (type === 'M' && mLocs.indexOf(1) === -1) {
				mLocs.push(1);
			}
			break;
		case 4: // a2
			type = order[2];
			if (type === 'M' && mLocs.indexOf(2) === -1) {
				mLocs.push(2);
			}
			break;
		case 2: // a3
			type = order[3];
			if (type === 'M' && mLocs.indexOf(3) === -1) {
				mLocs.push(3);
			}
			break;
		case 7: // a4
			type = order[4];
			if (type === 'M' && mLocs.indexOf(4) === -1) {
				mLocs.push(4);
			}
			break;
		case 8: // a5
			type = order[5];
			if (type === 'M' && mLocs.indexOf(5) === -1) {
				mLocs.push(5);
			}
			break;
		case 9: // a6
			type = order[6];
			if (type === 'M' && mLocs.indexOf(6) === -1) {
				mLocs.push(6);
			}
			break;
		case 11: // a7
			type = order[7];
			if (type === 'M' && mLocs.indexOf(7) === -1) {
				mLocs.push(7);
			}
			break;
		default:
			// error value
			type = '_';
	}

	return type;
}

export function setM(cell) {
	while (cell.elevation < 1) {
		cell.elevation += 1;
	}
	cell.water = false;
	cell.impassM = true;
}
export function setD(cell) {
	while (cell.elevation < 0) {
		cell.elevation += 0.1;
	}
	while (cell.elevation > 0.01) {
		cell.elevation = cell.elevation / 10;
	}
	cell.water = false;
	cell.impassD = true;
}
export function setO(cell) {
	cell.ocean = true;
	cell.elevation = Math.min(cell.elevation, 0);
}
