import Cookies from 'universal-cookie';

export const saveGame = (gameJson) => {
	const cookies = new Cookies();

	cookies.set('TheGameCookie', btoa(JSON.stringify(gameJson)), { path: '/' });
	console.log(atob(cookies.get('TheGameCookie')));
};

export const loadGame = () => {
	const cookies = new Cookies();
	var loadCookie = cookies.get('TheGameCookie');
	if (loadCookie == undefined) {
		//no cookie exists
		//initilizeGame();
	} else {
		var save = JSON.parse(atob(loadCookie)); //convert decoded json to the save data
		console.log(save);
		//parseSave(save);
	}
};
