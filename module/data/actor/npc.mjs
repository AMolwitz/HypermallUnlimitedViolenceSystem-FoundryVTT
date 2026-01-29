import { resourceField } from "../index.mjs";

export class HypermallNPCData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const { StringField } = foundry.data.fields;

        return {
            description: new StringField(),
            mt: resourceField(0, 99),
            st: resourceField(0, 99),
            dt: resourceField(0, 99),
            moves: new StringField(),
            phrenology: new StringField(),
            special: new StringField(),
            mutations: new StringField(),
            psionicPowers: new StringField()

        }
    }
}