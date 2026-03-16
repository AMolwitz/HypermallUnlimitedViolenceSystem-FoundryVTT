import { getCompatibleItemSheet } from "../../utils/compatibility.mjs";

export class HypermallEquipmentSheet extends getCompatibleItemSheet() {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['hypermall', 'sheet', 'item'],
            width: 1100,
            height: 450,
        });
    }

    /** @override */
    get template() {
        return `systems/hypermalluv/templates/equipment/gear-sheet.html`;
    }

    /** @override */
    async getData() {
        const data = super.getData();

        const itemData = this.item.toObject(false);
        data.system = itemData.system;

        data.enrichedDescription = await TextEditor.enrichHTML(data.system.description || "");
        data.enrichedBrandLine = await TextEditor.enrichHTML(data.system.brandLine || "");
        data.enrichedTags = await TextEditor.enrichHTML(data.system.tags || "");
        data.enrichedEffects = await TextEditor.enrichHTML(data.system.effects || "");
        data.editable = this.isEditable;

        return data;
    }

    /** @override */
    async _updateObject(event, formData) {
        await super._updateObject(event, formData);

        if (this.item.type !== "gear") return;
        const actorSheet = this.item.actor?.sheet;
        if (typeof actorSheet?._syncLinkedEffectsForGear !== "function") return;

        await actorSheet._syncLinkedEffectsForGear(this.item);
    }
}