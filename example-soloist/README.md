# `soloist` example application

> This example shows how to implement an a application composed of regular clients and of a dedicated controller client. This last client can trigger events (here visual, but could easily be replaced with audio) on all clients from a centralized interface that shows all the other clients on a map. The application makes use of the [`@soundworks/plugin-location`](https://github.com/collective-soundworks/soundworks-plugin-location).

## Tutorial

@todo

## Related Plugin repository

[https://github.com/collective-soundworks/soundworks-plugin-location](https://github.com/collective-soundworks/soundworks-plugin-location)

## Launching the application

```sh
git clone https://github.com/collective-soundworks/soundworks-examples.git
cd example-soloist
npm install
npm run dev
```

## Note on performances

In production situation you migth want to have a smarter logic to avoid sending messages to clients that are outside the range of the soloist.

You can do that server side by tracking clients in radius and sending update messages only to these clients:

```js
// src/server/index.js
const activePlayers = new Set();
const playerStates = new Set();

controllerState.subscribe(updates => {
  for (let key in updates) {
    switch (key) {
      case 'pointers': {
        const pointers = updates[key];
        const radius = controllerState.get('radius');

        if (pointers.length === 0) {
          playerStates.forEach(playerState => {
            playerState.set({ distance: 1 });
          });

          activePlayers.clear();
        } else {
          playerStates.forEach(playerState => {
            // console.log(client);
            let normDistance = +Infinity;
            const isActive = activePlayers.has(playerState);

            pointers.forEach(trigger => {
              const playerPosition = playerState.get('position');
              const normDistance = getNormalizedDistance(trigger, playerPosition, radius);
              const inRadius = (normDistance < 1);

              if (isActive && !inRadius) {
                playerState.set({ distance: 1 });
                activePlayers.delete(playerState);
              }

              if (!isActive && inRadius) {
                activePlayers.add(playerState);
              }

              if (inRadius) {
                playerState.set({ distance: normDistance });
              }
            });
          });
        }
        break;
      }
    }
  }
});
```

## License

BSD-3-Clause
