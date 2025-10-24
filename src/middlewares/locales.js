import i18n from '../config/i18.config.js';
const locales = (req, res, next) => {
	try {
		const lang = req?.headers?.['x-api-language'] || 'en';
		i18n.setLocale(lang);
		req.headers['i18n'] = i18n;
		return next();
	} catch (e) {
		console.log('e.stack :>> ', e.stack);
		res.status(500).send({ status: 500, data: [], error: { message: 'Something went wrong !', reason: e.message } });
		return;
	}
};
export default locales;
