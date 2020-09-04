module.exports = {
	apps: [
		{
			name: 'lol-scrapper',
			script: 'dist/index.js',
			// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
			instances: 3,
			log_date_format: 'YYYY-MM-DD HH:mm Z',
			env: {
				NODE_ENV: 'development',
				API_KEY: 'RGAPI-e03411f0-bdda-4f64-b9b1-a1e4c0e69bce',
				MONGO_HOST: 'localhost:23456',
			},
			env_production: {
				NODE_ENV: 'production',
			},
		},
	],
};
