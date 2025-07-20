import { CommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("health")
    .setDescription("Check the health of the Sui Faucet Bot."),
  async execute(interaction: CommandInteraction) {
    try {
      await interaction.reply("The Sui Faucet Bot is healthy!");
    } catch (error) {
      console.error("Error executing health command:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "There was an error executing the health command!", ephemeral: true });
      }
    }
  },
};
