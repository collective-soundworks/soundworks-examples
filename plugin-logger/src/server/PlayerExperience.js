import { AbstractExperience } from '@soundworks/core/server';
import fs from 'fs';

class PlayerExperience extends AbstractExperience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.logger = this.require('logger');
  }

  async start() {
    super.start();

    // 1. create a writer
    // the filename will be automatically prefix with the date and time,
    // following the format: `yyyymmdd-hhmmss-${filename}
    const filename = 'server-log-file.csv';
    const writer = await this.logger.create(filename);
    // 2. writing data into file,
    // create arbitrary data, the formatting of the data is left to the user
    for (let i = 0; i < 10; i++) {
      let line = '';
      for (let j = 0; j < 5; j++) {
        line += `${i + j};`
      }

      writer.write(line); // be aware that these operations are asynchronous
    }
    // 3. close the writer when done
    // writer.close(); // be aware that these operations are asynchronous
    // we use the async here (only available server-side) to log it right after
    await writer.close();

    // read back data
    console.log(`> writer file:`);
    console.log(writer.path);
    console.log(`> writer content`);
    console.log(fs.readFileSync(writer.path).toString());

    console.log('> create shared writer');
    const sharedWriter = await this.logger.create('shared-writer');
  }

  enter(client) {
    super.enter(client);
  }

  exit(client) {
    super.exit(client);
  }
}

export default PlayerExperience;
