import { resourceField } from "../index.mjs";

export class HypermallNPCData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const { StringField, SchemaField, ArrayField, NumberField } = foundry.data.fields;

        return {
            description: new StringField(),
            meat: resourceField(0, 6),
            stress: resourceField(0, 6),
            debt: new SchemaField({
              value: new NumberField({ initial: 0 }),
              max: new NumberField({ initial: 6 }),
            }),
            armour: new NumberField({ initial: 0 }),
            damage: new StringField({ initial: '' }),
            damageDice: new NumberField({ initial: 0 }),            damageModifier: new NumberField({ initial: 0 }),            moves: new ArrayField(new StringField(), { initial: [''] }),
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
            psionics: new StringField()

        }
    }

}