import { CommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Provides information about the Sui Faucet Bot of First Mover Discord Server."),
  async execute(interaction: CommandInteraction) {
    try {
      await interaction.reply(
        "**Sui Faucet Bot - First Mover**\n\n" +
        "Use `/faucet` to request Sui tokens on the testnet.\n\n" +
        "For help or more information:\n" +
        "• Contact the server admins\n" +
        "• Check the documentation"
      );
    } catch (error) {
      console.error("Error executing info command:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "There was an error providing info!", ephemeral: true });
      }
    }
  },
};
