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

        data.enrichedDescription = await TextEditor.enrichHTML(data.system.description);
        data.enrichedTags = await TextEditor.enrichHTML(data.system.tags);
        data.enrichedEffects = await TextEditor.enrichHTML(data.system.effects);

        return data;
    }
}