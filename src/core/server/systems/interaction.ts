import * as alt from 'alt-server';
import gridInfo from '../../shared/information/gridData';
import { Player_Status } from '../../shared/enums/player';
import { DurtyDumpInterface } from '../interface/DurtyDump';
import { distance2d, getClosestVectorByPos } from '../../shared/utility/vector';
import { DEFAULT_CONFIG } from '../athena/main';
import { InteractionLocale } from '../../shared/locale/interaction';
import { System_Interaction } from '../../shared/enums/system';
import '../views/atm';

const InteractionTypes: { [key: string]: { eventName: string; isServer: boolean } } = {
    atm: { eventName: System_Interaction.ATM, isServer: false }
};

alt.onClient(Player_Status.Interact, handleInteraction);

/**
 * Handles when a player presses the interact key.
 * This only happens in interaction mode.
 * @param {alt.Player} player
 * @param {string} type
 */
function handleInteraction(player: alt.Player, type: string): void {
    type = type.toLowerCase();
    const categoryObjects: Array<DurtyDumpInterface> = [
        ...gridInfo[player.gridSpace].objects[type]
    ] as Array<DurtyDumpInterface>;

    if (categoryObjects.length <= 0) {
        return;
    }

    const allObjectPositions: Array<{ pos: alt.Vector3 }> = categoryObjects.map((d) => {
        return { pos: new alt.Vector3(d.Position.X, d.Position.Y, d.Position.Z) };
    });
    const closestPosition = getClosestVectorByPos(player.pos, allObjectPositions);

    if (!closestPosition) {
        return;
    }

    if (distance2d(player.pos, closestPosition.pos) > DEFAULT_CONFIG.MAX_INTERACTION_DISTANCE) {
        player.send(InteractionLocale.TOO_FAR_AWAY);
        return;
    }

    const interaction = InteractionTypes[type];
    if (!interaction) {
        player.send(InteractionLocale.DOES_NOT_EXIST);
        return;
    }

    // Goes Server Side
    if (interaction.isServer) {
        alt.emit(interaction.eventName, player, closestPosition);
        return;
    }

    // Goes Client Side
    player.emit(interaction.eventName, closestPosition);
}
