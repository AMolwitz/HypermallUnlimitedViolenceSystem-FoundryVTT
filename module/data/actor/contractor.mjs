import { resourceField, skillField } from "../index.mjs";
import { SystemSettingsKeys } from "../../settings/settings.mjs";

export class HypermallContractorData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const { SchemaField, NumberField, StringField } = foundry.data.fields;
        //const startingXP = game.settings.get(SystemSettingsKeys.SYSTEM, SystemSettingsKeys.STARTING_XP);

        return {
            meat: resourceField(0, 4), //how to set it when it's 2d6+3+physick?
            debt: resourceField(0, 4), // how to set when it's custom from background?
            stress: resourceField(0, maximumStress),
            background: new StringField(),
            iclTeam: new StringField(),
            handedness: new StringField(),
            pronouns: new StringField(),
            zodiac: new StringField(),
            abilities: new SchemaField({
                physick: new SchemaField({
                    label: new StringField({ initial: "Physick" }),
                    value: new NumberField({ initial: 0 }),
                }),
                craveability: new SchemaField({
                    label: new StringField({ initial: "Craveability" }),
                    value: new NumberField({ initial: 0 }),
                }),
                thinkitude: new SchemaField({
                    label: new StringField({ initial: "Thinkitutde" }),
                    value: new NumberField({ initial: 0 }),
                }),
                savvy: new SchemaField({
                    label: new StringField({ initial: "Savvy" }),
                    value: new NumberField({ initial: 0 }),
                })
            }),
            skills: new SchemaField({
                asskissing: skillField("Alpha Complex", 0),
                awareness: skillField("Bureaucracy", 0),
                axe: skillField("Psychology", 0),
                bash: skillField("Science", 0),
                climbing: skillField("Science", 0),
                charm: skillField("Science", 0),
                checkHumors: skillField("Science", 0),
                cooking: skillField("Science", 0),
                corruption: skillField("Science", 0),
                cyberKarate: skillField("Science", 0),
                dance: skillField("Science", 0),
                dig: skillField("Science", 0),
                disguise: skillField("Science", 0),
                explosives: skillField("Science", 0),
                fashion: skillField("Science", 0),
                fencing: skillField("Science", 0),
                finance: skillField("Science", 0),
                gaming: skillField("Science", 0),
                gambling: skillField("Science", 0),
                hacking: skillField("Science", 0),
                heavyWeapon: skillField("Science", 0),
                intimidation: skillField("Science", 0),
                knife: skillField("Science", 0),
                levitation: skillField("Science", 0),
                medicine: skillField("Science", 0),
                meditation: skillField("Science", 0),
                pilot: skillField("Science", 0),
                pistol: skillField("Science", 0),
                publicSpeaking: skillField("Science", 0),
                rage: skillField("Science", 0),
                rifle: skillField("Science", 0),
                running: skillField("Science", 0),
                shotgun: skillField("Science", 0),
                spear: skillField("Science", 0),
                skulk: skillField("Science", 0),
                sniperRifle: skillField("Science", 0),
                throw: skillField("Science", 0),
                track: skillField("Science", 0),
                traps: skillField("Science", 0),
                tech: skillField("Science", 0),
                worship: skillField("Science", 0),
                zeroGCombat: skillField("Science", 0)
            }),
            allGear: new StringField({ initial: "List any of the gear you're responsible for here. Be sure to keep it in tip-top shape!" }),
            mutations: new StringField({ initial: "Note your mutations." }),
            psionicPowers: new StringField({ initial: "Note your psionic powers." }),
        }
    }

    static migrateData(source) {
        const maximumStress = game.settings.get(SystemSettingsKeys.SYSTEM, 6+Savvy);
        if (source.stress.value > maximumStress) {
            source.stress.max = maximumStress;
        }
        if (source.stress.value > source.stress.max) {
            source.stress.value = source.stress.max;
        }
        return super.migrateData(source);
    }
}
