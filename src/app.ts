import { setConfigOnStart, getConfig, printConfig } from './lib/config.js';
import bodyParser from "body-parser";
import swaggerUi from 'swagger-ui-express';
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { connect } from './lib/data/db_models.js'
import { configRoutes } from './routes/configRoutes.js'
import { quoteRoutes } from './routes/quoteRoutes.js'
import { bitcoinRoutes } from './routes/bitcoinRoutes.js'
import { stacksRoutes } from './routes/stacksRoutes.js'
import { dlcLinkRoutes } from './routes/dlcLinkRoutes.js'
import { dlcLoanRoutes } from './routes/dlcLoanRoutes.js'
import { createRequire } from 'node:module';
import { allowlistRoutes } from './routes/allowlistRoutes.js';
import { customerRoutes } from './routes/customerRoutes.js';
import { BASE_URL_NO_WALLET } from './routes/controllers/bitcoin/rpc_wallet.js';
const r = createRequire(import.meta.url);
// - assertions are experimental.. import swaggerDocument from '../public/swagger.json' assert { type: "json" };;
const swaggerDocument = r('./swagger.json');

const app = express();

app.use('/api-docs', swaggerUi.serve); 
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(cors()); 
setConfigOnStart();
printConfig()

app.get('/api-docs', swaggerUi.setup(swaggerDocument));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use('/uasu-api/v1/config', configRoutes);
app.use('/uasu-api/v1/btc', bitcoinRoutes);
app.use('/uasu-api/v1/quotes', quoteRoutes);
app.use('/uasu-api/v1/stacks', stacksRoutes);
app.use('/uasu-api/v1/dlc', dlcLinkRoutes);
app.use('/uasu-api/v1/loans', dlcLoanRoutes);
app.use('/uasu-api/v1/allowlist', allowlistRoutes);
app.use('/uasu-api/v1/customers', customerRoutes);
console.log(`Express is listening at http://localhost:${getConfig().port} \n\nsBTC Wallet: ${getConfig().walletPath}`);
console.log('\n\nStartup Environment: ', process.env.TARGET_ENV);
console.log('\n\nBitcoin connection at: ' + BASE_URL_NO_WALLET)
console.log(`\n\nMongo connection at ${getConfig().mongoDbUrl}`);
async function connectToMongoCloud() {
  await connect();
  const server = app.listen(getConfig().port, () => {
    return;
  });
}

connectToMongoCloud();

 