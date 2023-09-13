import {
  Client,
  Guild,
  REST,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';

import { config } from '../config';
import type { BotCommand } from '../types/bot';
import { deleteExistingCommands } from './deleteExistingCommands';
import { coreLogger } from './logger';

const { discord } = config;

export const pushCommands = async (
  commands: RESTPostAPIChatInputApplicationCommandsJSONBody[],
  clientId: string,
  guild?: Guild,
) => {
  const rest = new REST({ version: '10' }).setToken(discord.token);
  coreLogger.info(`Deleting existing slashcommands on:  ${guild?.name ?? 'all guilds'}.`);
  await deleteExistingCommands(rest, clientId, guild?.id);
  coreLogger.info(`Pushing new slashcommands on: ${guild?.name ?? 'all guilds'}.`);

  const putCommandRoute = guild
    ? Routes.applicationGuildCommands(clientId, guild.id)
    : Routes.applicationCommands(clientId);

  await rest.put(putCommandRoute, {
    body: commands,
  });
  coreLogger.info('All commands are pushed.');
};

export const routeCommands = (client: Client<true>, botCommands: BotCommand[]) =>
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.inGuild() || !interaction.isChatInputCommand()) {
      return;
    }
    coreLogger.debug(
      `${interaction.commandName} command received by ${interaction.user.tag} - routing...`,
    );
    const command = botCommands.find((command) => command.schema.name === interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: `Command not found ${interaction.commandName}`,
        ephemeral: true,
      });
      throw new Error(`Command not found ${interaction.commandName}`);
    }

    if (typeof command.handler === 'function') {
      coreLogger.debug(`${interaction.commandName} command found - running handler.`);
      await command.handler(interaction);
      return;
    }

    const subCommand = command.handler[interaction.options.getSubcommand()];

    if (!subCommand) {
      await interaction.reply({
        content: `Subcommand not found ${
          interaction.commandName
        } ${interaction.options.getSubcommand()}`,
        ephemeral: true,
      });
      throw new Error(
        `Subcommand not found ${interaction.commandName} ${interaction.options.getSubcommand()}`,
      );
    }

    coreLogger.debug(
      `${
        interaction.commandName
      } ${interaction.options.getSubcommand()} subcommand found - running handler.`,
    );
    await subCommand(interaction);
  });
