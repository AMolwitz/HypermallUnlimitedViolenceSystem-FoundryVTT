
export class HypermallEquipment extends Item {
    prepareData() {
        super.prepareData();
    }

    async _preCreate(data, options, userId) {
        if ((await super._preCreate(data, options, userId)) === false) return false;

        if (this.type === "effect" && !data.img) {
            this.updateSource({ img: "icons/svg/aura.svg" });
        }
    }
}
