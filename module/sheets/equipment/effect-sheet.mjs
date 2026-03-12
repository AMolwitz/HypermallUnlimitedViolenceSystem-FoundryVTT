import { getCompatibleItemSheet } from "../../utils/compatibility.mjs";

export class HypermallEffectSheet extends getCompatibleItemSheet() {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['hypermall', 'sheet', 'item'],
            width: 1100,
            height: 550,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {
        return `systems/hypermalluv/templates/equipment/effect-sheet.html`;
    }

    /** @override */
    async getData() {
        const data = super.getData();

        const itemData = this.item.toObject(false);
        data.system = itemData.system;

        data.enrichedDescription = await TextEditor.enrichHTML(data.system.description || "");
        data.rules = data.system.rules || [];
        data.editable = this.isEditable;
        data.operations = {
            set: "Set (Replace)",
            add: "Add",
            subtract: "Subtract",
            multiply: "Multiply",
            divide: "Divide"
        };

        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) return;

        // Add rule button
        html.find('.effect-add-rule').click((event) => {
            event.preventDefault();
            this._onAddRule();
        });

        // Delete rule buttons
        html.on('click', '.effect-delete-rule', (event) => {
            event.preventDefault();
            const index = $(event.currentTarget).data('rule-index');
            this._onDeleteRule(index);
        });

        // Auto-save rule changes
        html.find('.effect-rule-path, .effect-rule-operation, .effect-rule-value').change((event) => {
            const index = $(event.currentTarget).closest('.rule-item').data('rule-index');
            this._onRuleChange(index);
        });
    }

    async _onAddRule() {
        const rules = Array.from(this.item.system.rules || []);
        rules.push({ path: "", operation: "add", value: "" });
        await this.item.update({ "system.rules": rules });
    }

    async _onDeleteRule(index) {
        const rules = Array.from(this.item.system.rules || []);
        rules.splice(index, 1);
        await this.item.update({ "system.rules": rules });
    }

    async _onRuleChange(index) {
        const rules = Array.from(this.item.system.rules || []);
        if (rules[index]) {
            const ruleElement = this.element.find(`.rule-item[data-rule-index="${index}"]`);
            rules[index].path = ruleElement.find('.effect-rule-path').val() || "";
            rules[index].operation = ruleElement.find('.effect-rule-operation').val() || "add";
            // Keep value as string to support numbers, JSON, and formulas
            rules[index].value = ruleElement.find('.effect-rule-value').val() || "";
            await this.item.update({ "system.rules": rules });
        }
    }
}

