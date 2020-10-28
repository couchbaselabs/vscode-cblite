const pkg = require('../../package.json');

export namespace Constants {
    /* extension */
    export const extensionName = pkg.name;
    export const extentionDisplayName = pkg.displayName;
    export const extensionVersion = pkg.version;

    /* output channel */
    export const outputChannelName = `${extentionDisplayName}`;

    /* explorer */
    export const cbliteExplorerViewId = pkg.contributes.views.explorer[0].id;
}