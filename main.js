/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/**
* Flexible Boilerplate - Main
*/
define(function (require, exports, module) {
    'use strict';

    /* Modules */
    var AppInit             = brackets.getModule("utils/AppInit"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        Menus               = brackets.getModule("command/Menus"),
        Commands            = brackets.getModule("command/Commands"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        FileUtils           = brackets.getModule("file/FileUtils"),

    /* User Modules */
        Dialogs             = require("fbdialogs"),
        Files               = require("fbfiles"),

    /* Constants */
        MODULE_NAME         = "pelatx.flexible-boilerplate",
        MENU_CMD_OPEN       = "fboilerplate.open",
        MENU_CMD_PREFS      = "fboilerplate.prefs",
        MENU_ITEM_OPEN      = "FBoilerplate",
        MENU_ITEM_PREFS     = "FBoilerplate Folder...",

    /* Global Variables */
        menu,
        prefs,
        repoDir  = null;


    /* Functions */


    /**
     * Show open dialog and let choose a boilerplate repository folder.
     * @author pelatx
     */
    function selectRepoFolder() {
        var source;
        // Select source folder
        FileSystem.showOpenDialog(false, true, "Chose FBoilerplate folder", repoDir, null, function (err, entries) {
            if (entries.length > 0) {
                source = FileSystem.getDirectoryForPath(entries[0]);
                prefs.set("repoDir", source.fullPath);
                prefs.save();
            }
        });
    }

    /**
     * Show boilerplate dialogs to add items to current project.
     * @author pelatx
     * @param {string} path [full path of the reporitory folder]
     */
    function initBoilerplate(path) {
        var dest, primaryItem = "", newName = "", selectedItems = [];

        if (path !== null) {
            // Set destination folder
            if (ProjectManager.getSelectedItem()) {
                if (ProjectManager.getSelectedItem().isDirectory) {
                    dest = ProjectManager.getSelectedItem().fullPath;
                } else {
                    dest = ProjectManager.getSelectedItem().parentPath;
                }
            } else {
                dest = ProjectManager.getProjectRoot().fullPath;
            }

            // Set source
            Dialogs.showPrimary(path)
                .done(function (selected) {
                    if ($.isArray(selected) && selected.length > 0) {
                        primaryItem = FileUtils.getParentPath(selected[0]);
                        selectedItems = selected;
                    } else {
                        primaryItem = selected;
                    }
                    // Set name
                    Dialogs.showRenameForm(primaryItem)
                        .done(function (name) {
                            // Do copy
                            newName = name;
                            if (selectedItems.length > 0) {
                                var newDir = dest + newName + "/";
                                Files.mkdir(newDir).done(function () {
                                    selectedItems.forEach(function (item) {
                                        var baseName = FileUtils.getBaseName(item);
                                        Files.copy(item, newDir, baseName).done(function () {
                                            ProjectManager.refreshFileTree();
                                        });
                                    });
                                });
                            } else {
                                Files.copy(primaryItem, dest, newName).done(function () {
                                    ProjectManager.refreshFileTree();
                                });
                            }
                        });
                });
        }
    }

    /* Initialize extension */
    AppInit.appReady(function () {

        CommandManager.register(MENU_ITEM_OPEN, MENU_CMD_OPEN, function () {
            initBoilerplate(repoDir);
        });
        CommandManager.register(MENU_ITEM_PREFS, MENU_CMD_PREFS, selectRepoFolder);

        menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);

        menu.addMenuItem(MENU_CMD_OPEN, undefined, Menus.AFTER, Commands.FILE_NEW_UNTITLED);
        menu.addMenuItem(MENU_CMD_PREFS, undefined, Menus.AFTER, Commands.FILE_EXTENSION_MANAGER);

        prefs = PreferencesManager.getExtensionPrefs(MODULE_NAME);
        prefs.definePreference("repoDir", "string");

        if (prefs.get("repoDir") && repoDir !== prefs.get("repoDir")) {
            repoDir = prefs.get("repoDir");
        }
        prefs.on("change", function () {
            if (repoDir !== prefs.get("repoDir")) {
                repoDir = prefs.get("repoDir");
            }
        });
    });

});
