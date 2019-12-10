import { constants } from './../constants/constants';

export const getRandomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
export const calcDistance = function(a, b, mult) {
	var dx = mult * (a.x - b.x),
		dy = mult * (a.y - b.y);
	return Math.sqrt(dx * dx + dy * dy);
};
export const getCharOrder = function() {
	var maxRand = 4;
	var last = '_';
	var charList = [];
	// Put the chars for the border tiles into a list in a random order.
	//    Chars must be grouped by kind.
	//    Chars can only be put in once.
	//    Chars must be in groups of 2-4 to fill the 8 position array.
	//      If one char has 4 positions, the others must have 2.
	//      If one char has 3 positions, the others can have 3 or 2
	while (charList.length < 8) {
		if (constants.CHARS.length !== 0) {
			var index = 0 + getRandomInt(0, constants.CHARS.length - 1);
			var numberToAdd = getRandomInt(2, maxRand);

			if (numberToAdd === 4) {
				maxRand = 2;
			} else {
				maxRand = 3;
			}
			for (var i = 0; i < numberToAdd && charList.length < 8; i++) {
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
export const computeMCenter = function(mLocs) {
	var center = -1;
	var prev = mLocs[0] - 1;
	var count = 0;
	for (var i = 0; i < mLocs.length && prev + 1 == mLocs[i]; i++) {
		if (center == -1) {
			center = mLocs[i] * 2;
			prev = mLocs[i];
			count++;
		} else {
			prev = mLocs[i];
			center++;
			count++;
		}
	}
	if (count < mLocs.length) {
		prev = 8;
		for (let i = mLocs.length - 1; i >= 0 && prev - 1 == mLocs[i]; i--) {
			center--;
			if (center < 0) {
				center += 16;
			}
			prev = mLocs[i];
		}
	}
	var mPoint;
	switch (center) {
		case 0:
			mPoint = { x: 0, y: constants.DIM / 4 };
			break;
		case 1:
			mPoint = { x: 0, y: 0 };
			break;
		case 2:
			mPoint = { x: constants.DIM / 4, y: 0 };
			break;
		case 3:
			mPoint = { x: constants.DIM / 2, y: 0 };
			break;
		case 4:
			mPoint = { x: (3 * constants.DIM) / 4, y: 0 };
			break;
		case 5:
			mPoint = { x: constants.DIM, y: 0 };
			break;
		case 6:
			mPoint = { x: constants.DIM, y: constants.DIM / 4 };
			break;
		case 7:
			mPoint = { x: constants.DIM, y: constants.DIM / 2 };
			break;
		case 8:
			mPoint = { x: constants.DIM, y: (3 * constants.DIM) / 4 };
			break;
		case 9:
			mPoint = { x: constants.DIM, y: constants.DIM };
			break;
		case 10:
			mPoint = { x: (3 * constants.DIM) / 4, y: constants.DIM };
			break;
		case 11:
			mPoint = { x: constants.DIM / 2, y: constants.DIM };
			break;
		case 12:
			mPoint = { x: constants.DIM / 4, y: constants.DIM };
			break;
		case 13:
			mPoint = { x: 0, y: constants.DIM };
			break;
		case 14:
			mPoint = { x: 0, y: (3 * constants.DIM) / 4 };
			break;
		case 15:
			mPoint = { x: 0, y: constants.DIM / 2 };
			break;
		default:
			break;
	}
	return mPoint;
};
export const getRealElevation = function(cell) {
	if (cell.water && cell.lakeElevation != null) {
		return cell.lakeElevation;
	} else if (cell.water && cell.elevation < 0) {
		return 0;
	} else {
		return cell.elevation;
	}
};
// The Perlin-based island combines perlin noise with the radius and the distance away from the mountain center
export const getElevation = function(point, mPoint, perlin) {
	var p1 = { x: point.x / constants.DIM, y: point.y / constants.DIM }; //convert this point from the actual dimension to a % of the width/height
	var p2 = { x: mPoint.x / constants.DIM, y: mPoint.y / constants.DIM }; //convert the center Mountain point from actual dimension the a * of the width/height

	var distance2 = calcDistance(p1, p2, 0.3); //%distance from this point to the center Mountain point decreased to 60%
	var distance = calcDistance(p1, { x: 0.5, y: 0.5 }, 2); //%distance from this point to the center increased to 150%
	var c = getPerlinValue(point, perlin);

	return c - (distance + distance2) / 2;
	// return c - (0.3 + 0.3 * distance * distance);
};
export const getPerlinValue = function(point, perlin) {
	var x = ((point.x / constants.DIM) * perlin.width) | 0;
	var y = ((point.y / constants.DIM) * (perlin.height - 5)) | 0;
	var pos = (x + y * perlin.width) * 4;
	var data = perlin.data;
	var val = (data[pos + 0] << 16) | (data[pos + 1] << 8) | data[pos + 2]; // rgb to hex

	return (val & 0xff) / 255.0;
};
