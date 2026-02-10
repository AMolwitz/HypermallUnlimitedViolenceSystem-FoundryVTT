import { getCompatibleActorSheet } from "../../utils/compatibility.mjs"; 

export class HypermallActor extends getCompatibleActorSheet() {
    static defineSchema() {
        const fields = foundry.data.fields
        const requiredInteger = { required: true, nullable: false, integer: true }
        const schema = {}


        return {            
            };   
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