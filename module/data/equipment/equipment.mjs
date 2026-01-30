export class HypermallEquipmentData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const { StringField, BooleanField, NumberField } = foundry.data.fields;

        return {
            description: new StringField(),
            brandLine: new StringField(),
            cost: new NumberField(),
            tags: new StringField(),
            effects: new StringField(),
            type: new StringField()
        }
    }
}
