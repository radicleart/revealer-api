import { setConfigOnStart, getConfig, printConfig } from './lib/config.js';
import bodyParser from "body-parser";
import swaggerUi from 'swagger-ui-express';
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { connect } from './lib/data/mongodb_connection.js'
import { configRoutes } from './routes/config/configRoutes.js'
import { eventRoutes } from './routes/events/eventRoutes.js'
import { sbtcRoutes } from './routes/sbtc/sbtcRoutes.js'
import { opDropRoutes } from './routes/op_drop/opDropRoutes.js'
import { opReturnRoutes } from './routes/op_return/opReturnRoutes.js'
import { payloadRoutes } from './routes/payload/payloadRoutes.js'
import { transactionRoutes } from './routes/transactions/transactionRoutes.js'
import { createRequire } from 'node:module';
import { getExchangeRates } from './lib/rates_utils.js';
import { exchangeRates, sbtcEventJob, scanForPaymentsJob } from './routes/jobs/JobScheduler.js';
import { WebSocketServer } from 'ws'
import { authorised } from './lib/utils.js';

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

app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    if (authorised(req.headers.authorization)) {
      console.log('app.use: ok ' + req.method)
      next()
    } else {
      console.log('app.use: 401 ' + req.method)
      res.sendStatus(401)
    }
  } else {
    next()
  }
})

app.get('/api-docs', swaggerUi.setup(swaggerDocument));

app.use('/revealer-api/v1/config', configRoutes);
app.use('/revealer-api/v1/events', eventRoutes);
app.use('/revealer-api/v1/sbtc', sbtcRoutes);
app.use('/revealer-api/v1/op_drop', opDropRoutes);
app.use('/revealer-api/v1/op_return', opReturnRoutes);
app.use('/revealer-api/v1/payload', payloadRoutes);
app.use('/revealer-api/v1/transactions', transactionRoutes);
console.log(`\n\nExpress is listening at http://localhost:${getConfig().port}`);
console.log('Startup Environment: ', process.env.TARGET_ENV);
console.log(`Mongo connection at ${getConfig().mongoDbUrl}\n\n`);
async function connectToMongoCloud() {
  await connect();
  const server = app.listen(getConfig().port, () => {
    return;
  });
  const wss = new WebSocketServer({ server })
  sbtcEventJob.start();
  scanForPaymentsJob.start();
  exchangeRates.start();
  let rates = await getExchangeRates()

  wss.on('connection', function connection(ws) {
    //console.log('new client connected');
    ws.send(JSON.stringify(rates))
    setInterval(async function () {
      rates = await getExchangeRates()
      ws.send(JSON.stringify(rates))
    }, (60 * 5 * 1000)) // 5 mins.
    ws.on('message', function incoming(message) { 
      //console.log('received %s', message);
      ws.send('Got your new rates : ' + message)
    })
  })
}

connectToMongoCloud();

 