export type LocalConfig=Readonly<{mode:'development'|'test';host:'127.0.0.1';port:number;liveEnabled:false}>;
/** Production needs separately reviewed identity, persistence and deployment configuration. */
export function readConfig(env:Readonly<Record<string,string|undefined>>):LocalConfig{
 const mode=env.APP_MODE??'development';
 if(mode!=='development'&&mode!=='test')throw Error('Production foundation startup is not enabled.');
 if(env.NODE_ENV==='production')throw Error('Production foundation startup is not enabled.');
 if(env.HOST&&env.HOST!=='127.0.0.1')throw Error('Local foundation requires loopback hosting.');
 const value=env.PORT??'4323';
 if(!/^\d{1,5}$/.test(value))throw Error('Invalid local port.');
 const port=Number(value);if(port<1||port>65535)throw Error('Invalid local port.');
 return Object.freeze({mode,host:'127.0.0.1',port,liveEnabled:false});
}
