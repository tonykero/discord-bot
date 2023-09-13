import { type Client } from 'discord.js';

import type { BotModule } from '../types/bot';
import { checkUniqueSlashCommandNames } from './checkUniqueSlashCommandNames';
import { pushCommands, routeCommands } from './loaderCommands';
import { coreLogger } from './logger';
import { routeHandlers } from './routeHandlers';

export const loadModules = async (
  client: Client<true>,
  modulesToLoad: Record<string, BotModule>,
): Promise<void> => {
  const botCommands = Object.values(modulesToLoad).flatMap((module) => module.slashCommands ?? []);
  checkUniqueSlashCommandNames(botCommands);
  coreLogger.info('Routing slashcommands to interactionCreate event.');
  routeCommands(client, botCommands);

  const clientId = client.application?.id;
  if (!clientId) throw new Error('Client id is not defined');

  coreLogger.info(`Pushing slashcommands on all guilds.`);
  await pushCommands(
    botCommands.map((command) => command.schema),
    clientId,
  );
  routeHandlers(client, modulesToLoad);
};
