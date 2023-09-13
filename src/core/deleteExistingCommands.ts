import { REST, Routes } from 'discord.js';

export const deleteExistingCommands = async (
  rest: REST,
  clientId: string,
  guildId?: string,
): Promise<void> => {
  const getCommandRoute = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  const guildCommands = (await rest.get(getCommandRoute)) as {
    id: string;
  }[];

  await guildCommands.reduce<Promise<void>>(async (promise, guildCommand) => {
    await promise;

    const deleteCommandRoute = guildId
      ? Routes.applicationGuildCommand(clientId, guildId, guildCommand.id)
      : Routes.applicationCommand(clientId, guildCommand.id);

    await rest.delete(deleteCommandRoute);
  }, Promise.resolve());
};
