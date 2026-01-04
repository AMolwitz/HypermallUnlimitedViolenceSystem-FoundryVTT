/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  const templates = {
    // Actor partials.
    "actor-hypermall-competencies": "systems/paranoia/templates/actor/parts/actor-competencies.html",
    "actor-hypermall-thresholds": "systems/paranoia/templates/actor/parts/thresholds.html",
    "actor-dice-roller": "systems/hypermall/templates/actor/parts/actor-dice-roller.html",
    "actor-hypermall-mutations": "systems/paranoia/templates/actor/parts/actor-mutations.html",
    "actor-hypermall-psionics": "systems/paranoia/templates/actor/parts/actor-psionics.html",
    "actor-hypermall-passions": "systems/hypermall/templates/actor/parts/actor-passions.html",
    "actor-foundry-data": "systems/hypermall/templates/actor/parts/actor-foundry-data.html",
    "actor-gear-list": "systems/hypermall/templates/actor/parts/actor-gear-list.html",
//systems/HMUV/templates/actor/parts/actor-foundry-data.html
    // App partials.
  };

  if (foundry.utils.isNewerVersion(game.version, "13")) {
    // If Foundry is version 13 or newer, use the new loadTemplates method
    return foundry.applications.handlebars.loadTemplates(templates);
  }

  return loadTemplates(templates);
};
