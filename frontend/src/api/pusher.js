import Pusher from 'pusher-js';

let pusherInstance = null;

export function getPusher() {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER,
    });
  }
  return pusherInstance;
}

export function getChannel(channelName) {
  return getPusher().subscribe(channelName);
}

export function disconnect() {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}