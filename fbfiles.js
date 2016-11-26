/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/**
* Flexible Boilerplate - Files
*/
define(function (require, exports, module) {
    'use strict';

    /* Modules */
    var FileSystem  = brackets.getModule("filesystem/FileSystem"),
        FileUtils   = brackets.getModule("file/FileUtils");

    /* Functions */

    /**
     * Create a folder
     * @author pelatx
     * @param   {string} path [full path of the folder to create]
     * @returns {promise} [On fail: full path of not created folder]
     */
    function mkdir(path) {
        var deferred = new $.Deferred();

        brackets.fs.makedir(path, 755,  function (err) {
            if (err === brackets.fs.ERR_FILE_EXISTS) {
                deferred.resolve();
            } else if (err === brackets.fs.NO_ERROR) {
                deferred.resolve();
            } else {
                deferred.reject(path);
            }
        });
        return deferred.promise();
    }

    /**
     * Copy a file
     * @author pelatx
     * @param   {string} scrPath [full path of the file]
     * @param   {string} destDir [full path of the destination folder]
     * @param   {string} name    [name of the new file]
     * @returns {promise} [On fail: full path of the source file]
     */
    function copyFile(scrPath, destDir, name) {
        var scrName, destPath, deferred = new $.Deferred();

        destPath = destDir + name;
        brackets.fs.copyFile(scrPath, destPath, function (err) {
            if (err) {
                deferred.reject(scrPath);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise();
    }

    /**
     * Copy a folder with recursion for inner folders
     * @author pelatx
     * @param   {string} scrPath  [full path of the folder]
     * @param   {string} destPath [full path of the destination folder]
     * @param   {string} name     [name of the new folder]
     * @returns {promise} [failed to copy files (not implemented yet)]
     */
    function copyFolder(scrPath, destPath, name) {
        var i, scrName, scrDir, newDir, unsavedFiles = [],
            deferred = new $.Deferred();
        var pushUnsaved = function (path) {
                unsavedFiles.push(path);
            };

        newDir = destPath + name + "/";

        mkdir(newDir)
            .fail(function () {
                deferred.reject();
            })
            .done(function () {
                scrDir = FileSystem.getDirectoryForPath(scrPath);
                scrDir.getContents(function (err, entries) {
                    var fullPath, baseName;
                    for (i = 0; i < entries.length; i++) {
                        fullPath = entries[i].fullPath;
                        baseName = FileUtils.getBaseName(fullPath);
                        if (entries[i].isDirectory) {
                            copyFolder(fullPath, newDir, baseName);
                        } else {
                            copyFile(fullPath, newDir, baseName)
                                .fail(pushUnsaved(fullPath));
                        }
                    }
                });
            });
        return deferred.promise(unsavedFiles);
    }

    /**
     * Copy an item (file or folder)
     * @author pelatx
     * @param   {string} scrPath  [full path of the file or folder]
     * @param   {string} destPath [full path of the destination folder]
     * @param   {string} name     [name of the new file or folder]
     * @returns {promise}
     */
    function copy(scrPath, destPath, name) {
        var deferred = new $.Deferred();

        if (scrPath.substr(-1) === "/") {
            copyFolder(scrPath, destPath, name).then(
                function () {
                    deferred.resolve();
                },
                function () {
                    deferred.reject();
                }
            );
        } else {
            copyFile(scrPath, destPath, name).then(
                function () {
                    deferred.resolve();
                },
                function () {
                    deferred.reject();
                }
            );
        }
        return deferred.promise();
    }

    /* Exports */
    exports.mkdir = mkdir;
    exports.copy = copy;
});
