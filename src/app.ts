import { setConfigOnStart, getConfig, printConfig } from './lib/config.js';
import bodyParser from "body-parser";
import swaggerUi from 'swagger-ui-express';
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { connect } from './lib/data/mongodb_connection.js'
import { configRoutes } from './routes/config/configRoutes.js'
import { commitRoutes } from './routes/commit/commitRoutes.js'
import { createRequire } from 'node:module';
const r = createRequire(import.meta.url);
// - assertions are experimental.. import swaggerDocument from '../public/swagger.json' assert { type: "json" };;
const swaggerDocument = r('./swagger.json');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve); 
app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(cors()); 
setConfigOnStart();
printConfig()

app.get('/api-docs', swaggerUi.setup(swaggerDocument));

app.use('/revealer-api/v1/config', configRoutes);
app.use('/revealer-api/v1/commitment', commitRoutes);
console.log(`Express is listening at http://localhost:${getConfig().port}`);
console.log('\n\nStartup Environment: ', process.env.TARGET_ENV);
console.log(`\n\nMongo connection at ${getConfig().mongoDbUrl}`);
async function connectToMongoCloud() {
  await connect();
  const server = app.listen(getConfig().port, () => {
    return;
  });
}

connectToMongoCloud();

 