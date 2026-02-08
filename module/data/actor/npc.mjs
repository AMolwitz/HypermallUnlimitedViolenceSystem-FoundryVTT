import { resourceField } from "../index.mjs";

export class HypermallNPCData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const { StringField } = foundry.data.fields;

        return {
            description: new StringField(),
            // Add Contractor-style thresholds so NPCs also display/save Meat/Stress/Debt
            meat: resourceField(0, 99),
            stress: resourceField(0, 99),
            debt: resourceField(0, 99),
            moves: new StringField(),
            phrenology: new StringField(),
            special: new StringField(),
            mutations: new StringField(),
            psionicPowers: new StringField()

        }
    }

}