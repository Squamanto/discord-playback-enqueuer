import { Message } from "discord.js";
import { EventActions, RegisteredEventAction } from "../../commandFramework";
import { getTrackURIFromLink, isSpotifyURL } from "../../services/spotify"

@RegisteredEventAction
export class PartyMessageAction extends EventActions.MessageAction {
    action(message: Message): void {
        this.handlePartyChannelCommand(message);
    }

    async handlePartyChannelCommand(message: Message) {
        try {
            if(await this.dependencies.repository.isChannelPartyChannel(message.channel.id) == false) {
                return;
            }
        } catch(error) {
            return;
        }

        try {
            this.logger.verbose("Handling party channel message: " + message.content);

            let urls = message.content.split(" ").filter((value) => isSpotifyURL(value));
            if (urls.length == 0) {
                this.logger.debug("No URLs found in party channel message");
                return
            }
            let owner = await this.dependencies.repository.getPartyChannelOwner(message.channel.id);

            let trackURI = await getTrackURIFromLink(urls[0]);
            this.logger.debug(`trackURI ${trackURI} extracted`);
            this.logger.debug("Attempting to use token with expiration time " + owner.tokenPair.expirationTime)
            await this.dependencies.spotifyApi.addToQueue(owner.tokenPair, trackURI);
        } catch(err) {
            this.logger.error(err)
            message.channel.send("// Failed to add song. " + err.message);
        }
    }
}