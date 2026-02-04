import { getCompatibleActorSheet } from "../../utils/compatibility.mjs"; 

export class HypermallActor extends getCompatibleActorSheet() {
    static defineSchema() {
        const fields = foundry.data.fields
        const requiredInteger = { required: true, nullable: false, integer: true }
        const schema = {}

        schema.mt = new fields.SchemaField({
            current: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            }) 
        schema.st = new fields.SchemaField({
            current: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            }) 
        schema.dt = new fields.SchemaField({
            current: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            }) 
        return schema;   
    }
    /** @override */
    get template() {
        return `systems/hypermalluv/templates/actor/${this.actor.type}-sheet.html`;
    }

    /** @override */
    getData() {
        const data = super.getData();

        const actorData = this.actor.toObject(false);
        data.system = actorData.system;

        return data;
    }
}