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

    _extractLinkedEffectNamesFromGear(gearItem) {
        if (!gearItem || gearItem.type !== "gear") return [];

        const rawEffects = gearItem.system?.effects;
        if (typeof rawEffects !== "string" || !rawEffects.trim().length) return [];

        const uuidRegex = /@UUID\[[^\]]+\]\{([^}]+)\}/g;
        const uuidNames = Array.from(rawEffects.matchAll(uuidRegex))
            .map((match) => match[1]?.trim())
            .filter(Boolean);

        const plainText = rawEffects
            .replace(uuidRegex, "$1")
            .replace(/<br\s*\/?\s*>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]+>/g, " ");

        const textNames = plainText
            .split(/[\n,;]+/)
            .map((name) => name.trim().replace(/^[*-]\s*/, ""))
            .filter(Boolean);

        return [...new Set([...uuidNames, ...textNames])];
    }

    _getLinkedEffectIdsForGear(gearId) {
        return this.actor.items
            .filter((item) => item.type === "effect" && item.getFlag("hypermalluv", "linkedGearId") === gearId)
            .map((item) => item.id);
    }

    async _createLinkedEffectsForGear(gearItem) {
        const effectNames = this._extractLinkedEffectNamesFromGear(gearItem);
        if (!effectNames.length) return [];

        const existingLinkedEffects = this.actor.items.filter((item) => (
            item.type === "effect"
            && item.getFlag("hypermalluv", "linkedGearId") === gearItem.id
        ));
        const existingLinkedNames = new Set(existingLinkedEffects.map((item) => (
            item.getFlag("hypermalluv", "sourceEffectName") || item.name
        )));

        const toCreate = [];

        for (const effectName of effectNames) {
            if (existingLinkedNames.has(effectName)) continue;

            const sourceEffect = game.items.find((item) => item.type === "effect" && item.name === effectName);
            if (!sourceEffect) continue;

            const effectData = sourceEffect.toObject();
            delete effectData._id;
            delete effectData.folder;

            effectData.flags = foundry.utils.mergeObject(effectData.flags || {}, {
                hypermalluv: {
                    linkedGearId: gearItem.id,
                    linkedGearName: gearItem.name,
                    sourceEffectName: sourceEffect.name
                }
            }, { inplace: false });

            toCreate.push(effectData);
        }

        if (!toCreate.length) return [];
        return this.actor.createEmbeddedDocuments("Item", toCreate);
    }

    async _deleteItemAndLinkedEffects(item) {
        if (!item) return;

        if (item.type !== "gear") {
            return item.delete();
        }

        const linkedEffectIds = this._getLinkedEffectIdsForGear(item.id);
        const deleteIds = [item.id, ...linkedEffectIds];
        return this.actor.deleteEmbeddedDocuments("Item", deleteIds);
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
}