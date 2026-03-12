export class HypermallEffectData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const { StringField, ArrayField, ObjectField, NumberField } = foundry.data.fields;

        return {
            description: new StringField(),
            rules: new ArrayField(
                new ObjectField({
                    initial: []
                })
            )
        }
    }
}
