export const UPDATE_NAV = 'UPDATE_NAV';
export const UPDATE_QUOTE = 'UPDATE_QUOTE';
export const UPDATE_RATE = 'UPDATE_RATE';
export const UPDATE_SERVICE_STATUS = 'UPDATE_SERVICE_STATUS';
export const UPDATE_QUOTE_STATUS = 'UPDATE_QUOTE_STATUS';

const updateNav = (nav, state) => {
	state = nav;
	return { ...state };
};
const updateQuote = (quote, state) => {
	state = quote;
	return { ...state };
};
const updateRate = (rate, state) => {
	state = rate;
	return { ...state };
};
const updateServiceStatus = (action, state) => {
	const { serviceStatus, serviceName, flag } = action;
	serviceStatus[serviceName] = flag;
	state = serviceStatus;
	return { ...state };
};
const updateQuoteStatus = (quoteStatus, state) => {
	state = quoteStatus;
	return { status: state };
};
export const reducer = (state, action) => {
	switch (action.type) {
		case UPDATE_NAV:
			return updateNav(action.nav, state);
		case UPDATE_QUOTE:
			return updateQuote(action.quote, state);
		case UPDATE_RATE:
			return updateRate(action.rate, state);
		case UPDATE_SERVICE_STATUS:
			return updateServiceStatus(action, state);
		case UPDATE_QUOTE_STATUS:
			return updateQuoteStatus(action.status, state);
		default:
			return state;
	}
};
