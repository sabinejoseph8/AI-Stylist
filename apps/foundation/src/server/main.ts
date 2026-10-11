import {readConfig} from './config.ts';
import {createFoundationServer} from './http.ts';
const config=readConfig(process.env);
createFoundationServer(config).listen(config.port,config.host,()=>console.log(`Local foundation service: http://${config.host}:${config.port}/healthz`));
