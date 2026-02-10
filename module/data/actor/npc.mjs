import { resourceField } from "../index.mjs";

export class HypermallNPCData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const { StringField, SchemaField, ArrayField } = foundry.data.fields;

        return {
            description: new StringField(),
            meat: resourceField(0, 6),
            stress: resourceField(0, 6),
            debt: resourceField(0, 6),
            moves: new ArrayField(new StringField(), { initial: [''] }),
            background: new StringField(),
            quote: new StringField(),
            phrenology: new SchemaField({
                one: new StringField(),
                two: new StringField(),
                three: new StringField(),
                four: new StringField(),
                five: new StringField(),
                six: new StringField(),
                active: new StringField()
            }),
            special: new StringField(),
            mutations: new StringField(),
            psionicPowers: new StringField()

        }
    }

}