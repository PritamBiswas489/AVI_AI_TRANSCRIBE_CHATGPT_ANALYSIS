import dbConfig from '../../config/database.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { readdirSync } from 'fs';
import { dirname, join, basename as _basename } from 'path';
import chalk from 'chalk';
import { Sequelize, DataTypes, Op, col, fn } from 'sequelize';
import relation from './relation.js';

const { database, password, username, options } = dbConfig;

// Create a new Sequelize instance with the database configuration
const sequelize = new Sequelize(database, username, password, options);

// Get the base filename of the current module
const baseFilename = _basename(fileURLToPath(import.meta.url));

// Test the database connection
(async () => {
	try {
		await sequelize.authenticate();
		console.log(`${chalk.green('CONNECTED')} : Database Successfully Connected`);
	} catch (error) {
		console.error(`${chalk.red('CONNECTION ERROR')} : `, error.message);
	}
})();

const db = {};
// Dynamically import all model files in the current directory except the current file 
await (async () => {
	const modelDirectoryPath = dirname(fileURLToPath(import.meta.url));
	const allModelFiles = readdirSync(modelDirectoryPath).filter((file) => file.indexOf('.') !== 0 && file !== baseFilename && file.slice(-3) === '.js' && file !== 'relation.js');
	
	// eslint-disable-next-line no-restricted-syntax
	for (const file of allModelFiles) {
		
		const modelFile = join(modelDirectoryPath, file);
		// eslint-disable-next-line no-await-in-loop
		const { default: model } = await import(pathToFileURL(modelFile));

		
		
		db[model.name] = model(sequelize, DataTypes);
		// console.log(db);
	}
})();
relation(db);
//Sequelize sync means it will create the tables in the database if they do not exist, based on the models defined.
// sequelize.sync();
//Op means operators in Sequelize, which are used for building complex queries.
db.Op = Op;
db.col = col;
db.fn = fn;
// Sequelize instance and DataTypes are added to the db object for easy access
db.Sequelize = Sequelize;
// Sequelize instance is added to the db object for easy access
db.sequelize = sequelize;

export default db;
