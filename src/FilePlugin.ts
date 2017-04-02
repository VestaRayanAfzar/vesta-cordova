import {CordovaPlugin} from "./CordovaPlugin";

/**
 * cordova-plugin-file & cordova-plugin-file-transfer & cordova-plugin-filepath
 */
const requestFileSystem = window.requestFileSystem || window['webkitRequestFileSystem'];
const resolveLocalFileSystemURL = window.resolveLocalFileSystemURI || window['webkitResolveLocalFileSystemURL'];
export enum AppLocationType {Private, Public}

export class FilePlugin extends CordovaPlugin {
    private fileSystem: FileSystem;
    //private publicEntry: DirectoryEntry;
    //private privateEntry: DirectoryEntry;
    private file: any;

    constructor() {
        super();
        if (window.cordova) {
            this.file = cordova.file;
        } else {
            this.mock();
        }
    }

    private getFileSystem(): Promise<FileSystem> {
        return new Promise<FileSystem>((resolve, reject) => {
            if (this.fileSystem) {
                resolve(this.fileSystem);
            } else {
                requestFileSystem(window.PERSISTENT, 0, resolve, reject);
            }
        });
    }

    public getDirectory(type: AppLocationType, relativePath?: string): Promise<DirectoryEntry> {
        let baseDirectory: string = type == AppLocationType.Public ? this.file.externalRootDirectory : this.file.dataDirectory;
        return this.resolveUrl(baseDirectory)
            .then(result => {
                if (relativePath) {
                    return this.mkdirp(<DirectoryEntry>result, relativePath);
                } else {
                    return <DirectoryEntry>result;
                }
            })
            ;
    }

    public resolveUrl(uri: string): Promise<Entry> {
        return new Promise<Entry>((resolve, reject) => {
            resolveLocalFileSystemURL(uri, resolve, reject);
        });
    }

    public resolveNativePath(path: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            window['FilePath'].resolveNativePath(path, resolve, reject);
        });
    }

    public mkdirp(entry: DirectoryEntry, relativePath: string): Promise<DirectoryEntry> {
        let folders = relativePath.split(/[\/\\]/g);
        return new Promise(((resolve, reject) => {
            mkdir(entry, 0);
            function mkdir(entry: DirectoryEntry, index: number) {
                if (index == folders.length) {
                    return resolve(entry);
                }
                entry.getDirectory(folders[index], {create: true, exclusive: false}, (newEntry: DirectoryEntry) => {
                    console.log('Successfully created the `' + newEntry.nativeURL + '` directory');
                    mkdir(newEntry, ++index);
                }, (err) => {
                    console.error('Failed creating the `' + entry.nativeURL + '/' + folders[index] + '` directory because of: ', err);
                    reject(new Error(`Failed creating the '${entry.nativeURL}/${folders[index]}'`));
                });
            }
        }));
    }

    public copy(src: string | FileEntry, dest: string | DirectoryEntry, fileName?: string): Promise<FileEntry> {

        let checkType = (path: string | Entry): Promise<Entry> => {
            if (typeof path === 'string') return this.resolveUrl(path);
            return Promise.resolve(<Entry>path);
        };

        return Promise.all([checkType(src), checkType(dest)])
            .then((result: Array<Entry>) => {
                let srcEntry: Entry = result[0],
                    destEntry: Entry = result[1];
                if (destEntry.isFile) throw new Error('Destination is not of type Directory');
                if (!fileName) {
                    fileName = srcEntry.name;
                }
                return new Promise<FileEntry>((resolve, reject) => {
                    srcEntry.copyTo(<DirectoryEntry>destEntry, fileName, entry => resolve(<FileEntry>entry), reject);
                });
            });
    }

    public download(config: any) {
        let options: FileDownloadOptions = {};
        if (config.headers) {
            options.headers = config.headers;
        }
        this.resolveUrl(config.destination).then((destDirEntry) => {
            let ft = new FileTransfer();
            if (config.progressHandler) {
                ft.onprogress = function (progressEvent) {
                    config.progressHandler(progressEvent);
                };
            }
            ft.download(encodeURI(config.endPoint + '/' + config.fileName), destDirEntry.toURL() + config.fileName, function (entry) {
                config.cb(null, entry);
            }, function (err) {
                try {
                    let realError = JSON.parse(err.body);
                    config.cb(new Error(realError.message));
                } catch (e) {
                    config.cb(new Error('Error downloading file'));
                }
            }, true, options);
        });
    }

    public convertToFile(fileEntry: FileEntry): Promise<File> {
        return new Promise<File>((resolve, reject) => {
            fileEntry.file(resolve, reject);
        });
    }

    protected mock(): void {
        this.mockingMode = true;
        this.file = {
            applicationStorageDirectory: '/',
            dataDirectory: '/',
            externalRootDirectory: '/'
        };
    }
}
