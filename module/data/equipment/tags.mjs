export class HypermallTagsData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const { StringField } = foundry.data.fields;

        return {
            description: new StringField()
        }
    }
}
