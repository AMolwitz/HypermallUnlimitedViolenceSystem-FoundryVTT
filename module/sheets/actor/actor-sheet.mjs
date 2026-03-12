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

    async _findRollTableByName(tableName) {
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

        return table;
    }

    async _onResurrection(event) {
        event.preventDefault();

        await this.actor.update({ "system.meat.value": 0 });

        const tableNames = [
            "Resurrection Quirks"
        ];

        let table = null;
        for (const tableName of tableNames) {
            table = await this._findRollTableByName(tableName);
            if (table) break;
        }

        if (!table) {
            ui.notifications.warn('Roll table "Resurrection Quirks" not found. Meat was reset to 0.');
            return;
        }

        await table.draw({ displayChat: true });
    }

    async _onStressBreak(event) {
        event.preventDefault();

        await this.actor.update({ "system.stress.value": 0 });

        const tableName = "Break Table";
        const table = await this._findRollTableByName(tableName);

        if (!table) {
            ui.notifications.warn('Roll table "Break Table" not found. Stress was reset to 0.');
            return;
        }

        await table.draw({ displayChat: true });
    }

    async _onLoanDefault(event) {
        event.preventDefault();

        const tableName = "Break Table";
        const table = await this._findRollTableByName(tableName);

        if (!table) {
            ui.notifications.warn('Roll table "Loan Default" not found.');
            return;
        }

        await table.draw({ displayChat: true });
    }

    async _onNewDay(event) {
        event.preventDefault();

        const updates = {};
        const powerUsesMax = this.actor.system?.powerUses?.max;
        const gorgesMax = this.actor.system?.derived?.gorge?.max;

        if (Number.isFinite(powerUsesMax)) {
            updates["system.powerUses.value"] = powerUsesMax;
        }

        if (Number.isFinite(gorgesMax)) {
            updates["system.derived.gorge.value"] = gorgesMax;
        }

        if (Object.keys(updates).length > 0) {
            await this.actor.update(updates);
        }
    }
}