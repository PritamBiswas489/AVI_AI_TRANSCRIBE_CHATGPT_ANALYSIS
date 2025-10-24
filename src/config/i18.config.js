import { I18n } from 'i18n';
import { resolve as pathResolve, dirname, join as pathJoin, sep } from 'path';

const i18n = new I18n({
	locales: ['en', 'he'],
	defaultLocale: 'en',
	directory: pathResolve(pathJoin(dirname('./'), 'src', 'locales')),
});

export default i18n;
