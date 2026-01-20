export class HypermallEquipmentData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const { StringField, BooleanField, NumberField } = foundry.data.fields;

        return {
            description: new StringField(),
            brandLine: new StringField(),
            cost: new NumberField(),
            effect: new StringField(),
            assigned: new BooleanField({ initial: false }),
            type: new StringField()
        }
    }
}
