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
				API_KEY: 'RGAPI-809d3ad4-e55e-4ff1-9905-ea0c0bf4f841',
				MONGO_HOST: 'localhost'
			},
			env_production: {
				NODE_ENV: 'production',
			},
		},
	],
};
