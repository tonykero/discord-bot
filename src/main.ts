import { Client } from 'discord.js';

import { config } from './config';
import { getIntentsFromModules } from './core/getIntentsFromModules';
import { loadModules } from './core/loadModules';
import { coreLogger } from './core/logger';
import { modules } from './modules/modules';

const { discord } = config;

const client = new Client({
  intents: ['Guilds', ...getIntentsFromModules(modules)],
});

await client.login(discord.token);
await new Promise<void>((resolve) => {
  client.on('ready', () => {
    coreLogger.info(`Client is ready - ${client.user?.tag}!`);
    Object.values(modules).map((module) => module.eventHandlers?.ready?.(client));
    resolve();
  });
});

if (!client.isReady()) {
  throw new Error('Client should be ready at this stage');
}

await loadModules(client, modules);

coreLogger.info('Bot fully started.');
