import { getCompatibleActorSheet } from "../../utils/compatibility.mjs"; 

export class HypermallActor extends getCompatibleActorSheet() {
    static defineSchema() {
        const fields = foundry.data.fields
        const requiredInteger = { required: true, nullable: false, integer: true }
        const schema = {}


        return {            
            };   
    }
    /** @override */
    get template() {
        return `systems/hypermalluv/templates/actor/${this.actor.type}-sheet.html`;
    }

    /** @override */
    getData() {
        const data = super.getData();

        const actorData = this.actor.toObject(false);
        data.system = actorData.system;
        data.actor = this.actor;

        return data;
    }

    async _onRollHitLocation(event) {
        event.preventDefault();

        const tableName = "Hit Locations";
        let table = game.tables?.getName(tableName) ?? null;

        if (!table) {
            const packs = Array.from(game.packs?.values() ?? []).filter((pack) => pack.documentName === "RollTable");
            for (const pack of packs) {
                const index = await pack.getIndex();
                const entry = index.find((doc) => doc.name === tableName);
                if (entry) {
                    table = await pack.getDocument(entry._id);
                    break;
                }
            }
        }

        if (!table) {
            ui.notifications.warn(`Roll table "${tableName}" not found.`);
            return;
        }

        await table.draw({ displayChat: true });
    }
}