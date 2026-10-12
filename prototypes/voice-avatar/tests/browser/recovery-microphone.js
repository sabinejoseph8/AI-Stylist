export class StreamingMicrophone {
 async start(consume){window.recoveryFixture.consume=consume;return true;}
 stop(){window.recoveryFixture.consume=null;}
}
