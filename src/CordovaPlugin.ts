export abstract class CordovaPlugin {
    protected mockingMode: boolean = false;

    protected abstract mock(): void;

    public static Plugins = {
        File: ['cordova-plugin-file', 'cordova-plugin-file-transfer', 'cordova-plugin-filepath'],
        Keyboard: ['cordova-plugin-keyboard'],
        Media: ['cordova-plugin-camera', 'cordova-plugin-media-capture'],
        Network: ['cordova-plugin-network-information'],
        Sharing: ['cordova-plugin-x-socialsharing'],
        Splash: ['cordova-plugin-splashscreen'],
        Statusbar: ['cordova-plugin-statusbar'],
        Toast: ['cordova-plugin-x-toast']
    };

    public static getPluginsFor(plugin) {
        if (plugin in CordovaPlugin.Plugins) return CordovaPlugin.Plugins[plugin];
        return null;
    }
}