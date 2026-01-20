export class SystemSettingsKeys {
    static get SYSTEM() {
        return "hypermalluv";
    }
        static get MINIMUM_THRESHOLD() {
        return "minimumThreshold";
    }

}

export function registerGameSettings() {
    game.settings.register(SystemSettingsKeys.SYSTEM, SystemSettingsKeys.MINIMUM_THRESHOLD, {
        name: "Minimum Threshold",
        hint: "The minimum value a threshold can reach.",
        scope: "world",
        config: true,
        default: 0,
        type: Number,
        requiresReload: true
    });
}
