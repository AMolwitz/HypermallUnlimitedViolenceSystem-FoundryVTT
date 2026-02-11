export class HypermallEquipmentData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const { StringField, BooleanField, NumberField } = foundry.data.fields;

        return {
            price: new NumberField({ initial: 1 }),
            quantity: new NumberField({ initial: 1 }),
            description: new StringField(),
            brandLine: new StringField(),
            tags: new StringField(),
            effects: new StringField(),
            type: new StringField()
        }
    }
}