/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/**
* Flexible Boilerplate - Dialogs
*/
define(function (require, exports, module) {
    'use strict';

    /* Modules */
    var Dialogs             = brackets.getModule("widgets/Dialogs"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        FileUtils           = brackets.getModule("file/FileUtils");

    /* Functions */

    /**
     * Render the secondary dialog for select folder items to copy
     * @author pelatx
     * @param   {Array} paths [Array of strings with the paths to render]
     * @returns {string} [html rendered string]
     */
    function renderSelectableList(paths) {
        var name, linkColor, result = "";

        if ($('body').hasClass('dark')) {
            linkColor = "#6bbeff";
        } else {
            linkColor = "#0083e8";
        }

        paths.forEach(function (path) {
            name = FileUtils.getBaseName(path);
            result += "<input type='checkbox' name='fb-checkbox' value='" + name + "' data-path='" + path + "' checked> ";
            if (path.substr(-1) === "/") {
                result += "<span style='color:" + linkColor + ";'>" + StringUtils.breakableUrl(name) + "</span>";
            } else {
                result += StringUtils.breakableUrl(name);
            }
            result += "</br>";
        });
        return result;
    }

    /**
     * Render primary dialog for select boilerplate items
     * @author pelatx
     * @param   {Array} paths [Array of strings with the paths to render]
     * @returns {string} [html rendered string]
     */
    function renderPrimaryList(paths) {
        var name,
            result = "<ul>",
            textColor = $('body').css('color');

        var extensionDir = FileUtils.getNativeModuleDirectoryPath(module),
            iconPath = extensionDir + "/ionicons/ionicons-folder-32x32.png";

        paths.forEach(function (path) {
            name = FileUtils.getBaseName(path);
            result += "<li><a class='fb-primary-link' href='#' data-path='" + path + "' style='text-decoration: none;";
            if (path.substr(-1) !== "/") {
                result += "color:" + textColor + ";'";
            } else {
                result += "'";
            }
            result += ">" + StringUtils.breakableUrl(name) + "</a>";
            if (path.substr(-1) === "/") {
                result += "  <a class='fb-selector-link' href='#' data-path='" + path + "'><img src='" + iconPath + "' alt='View contents' style='width:20px;height:20px;'></a>";
            }
            result += "</br>";
        });
        return result;
    }

    /**
     * Render the html form for rename de selected item to copy.
     * @author pelatx
     * @param   {string} path [full path string of the item to rename]
     * @returns {strin} [html rendered string]
     */
    function renderRenameForm(path) {
        var name, suffix = "", type = "folder",
            result = "<form class='fb-rename-form' action=''>Rename ";

        name = FileUtils.getBaseName(path);
        if (path.substr(-1) !== "/") {
            type = "file";
            suffix = name.substr(name.lastIndexOf("."), name.length - 1);
            name = name.substr(0, name.lastIndexOf("."));
        }

        result += type + " <input type='text' name='fb-rename-text'";
        result += " value='" + name + "'>";
        result += suffix + "<br><input type='hidden' name='fb-suffix' value='";
        result += suffix + "'></form>";

        return result;
    }

    /**
     * Show the rename dialog
     * @author pelatx
     * @param   {string} path [full path string of the selected item to copy]
     * @returns {promise} [On succes: with the new name]
     */
    function showRenameForm(path) {
        var dialog, btnOk, newName, suffix,
            deferred = new $.Deferred(),
            rendered = renderRenameForm(path);

        dialog = Dialogs.showModalDialog(
            brackets.DIALOG_ID_SAVE_CLOSE,
            "Rename Item",
            rendered,
            [{
                className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                id: "fb.ok",
                text: "Ok"
            }],
            false
        );

        $('input:text[name=fb-rename-text]').select();

        btnOk = $('.dialog-button').filter('[data-button-id="fb.ok"]');
        btnOk.click(function (event) {
            newName = $('input:text[name=fb-rename-text]').val();
            suffix = $('input:hidden[name=fb-suffix]').val();
            if (newName === "") {
                newName = "untittled" + suffix;
            } else {
                newName = newName + suffix;
            }
            dialog.close();
            event.preventDefault();
            deferred.resolve(newName);
        });
        return deferred.promise();
    }

    /**
     * Show dialog for select items to copy inside the selected folder
     * @author pelatx
     * @param   {string} scrDir [full path of de selected folder]
     * @returns {promise} [On succes: Strings Array of full paths of the selected items]
     */
    function showSelectable(scrDir) {
        var dir, i, name, path, paths = [], rendered, selected = [],
            dialog, btnProceed, btnCancel, btnCheckAll, btnUncheckAll,
            deferred = new $.Deferred();

        dir = FileSystem.getDirectoryForPath(scrDir);
        dir.getContents(function (err, entries) {
            for (i = 0; i < entries.length; i++) {
                path = entries[i].fullPath;
                name = FileUtils.getBaseName(path);

                if (name.substr(0, 1) !== ".") {
                    paths.push(path);
                }
            }

            rendered = renderSelectableList(paths);

            dialog = Dialogs.showModalDialog(
                brackets.DIALOG_ID_SAVE_CLOSE,
                "Contents of " + scrDir,
                rendered,
                [{
                    className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                    id: "fb.checkall",
                    text: "Check All"
                }, {
                    className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                    id: "fb.uncheckall",
                    text: "Uncheck All"
                }, {
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: "fb.cancel",
                    text: "Cancel"
                }, {
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: "fb.proceed",
                    text: "Proceed"
                }],
                false
            );

            btnProceed = $('.dialog-button').filter('[data-button-id="fb.proceed"]');
            btnProceed.click(function () {
                $("input:checkbox[name=fb-checkbox]:checked").each(function () {
                    selected.push($(this).data('path'));
                });
                dialog.close();
                if (selected.length > 0) {
                    deferred.resolve(selected);
                } else {
                    deferred.reject();
                }
            });

            btnCancel = $('.dialog-button').filter('[data-button-id="fb.cancel"]');
            btnCancel.click(function () {
                dialog.close();
                deferred.reject();
            });

            btnCheckAll = $('.dialog-button').filter('[data-button-id="fb.checkall"]');
            btnCheckAll.click(function () {
                $("input:checkbox[name=fb-checkbox]").prop('checked', true);
            });

            btnUncheckAll = $('.dialog-button').filter('[data-button-id="fb.uncheckall"]');
            btnUncheckAll.click(function () {
                $("input:checkbox[name=fb-checkbox]").prop('checked', false);
            });
        });
        return deferred.promise();
    }

    /**
     * Show the primary dialog for copy items to project
     * @author pelatx
     * @param   {string}  scrDir [full path of the folder to show]
     * @returns {promise} [On succes: full path of the item to copy or Strings Array
     *     of full paths of the selected items inside a selected folder]
     */
    function showPrimary(scrDir) {
        var dir, i, name, path, paths = [], rendered, primaryItem,
            dialog, btnCancel, deferred = new $.Deferred();

        dir = FileSystem.getDirectoryForPath(scrDir);
        dir.getContents(function (err, entries) {
            for (i = 0; i < entries.length; i++) {
                path = entries[i].fullPath;
                name = FileUtils.getBaseName(path);

                if (name.substr(0, 1) !== ".") {
                    paths.push(path);
                }
            }

            rendered = renderPrimaryList(paths);

            dialog = Dialogs.showModalDialog(
                brackets.DIALOG_ID_SAVE_CLOSE,
                "Boilerplate",
                rendered,
                [{
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: "fb.cancel",
                    text: "Cancel"
                }],
                false
            );

            $(".fb-primary-link").click(function () {
                dialog.close();
                primaryItem = $(this).data('path');
                deferred.resolve(primaryItem);
            });

            $(".fb-selector-link").click(function () {
                dialog.close();
                primaryItem = $(this).data('path');
                showSelectable(primaryItem).then(
                    function (selected) {
                        deferred.resolve(selected);
                    },
                    function () {
                        deferred.reject();
                    }
                );
            });

            btnCancel = $('.dialog-button').filter('[data-button-id="fb.cancel"]');
            btnCancel.click(function () {
                dialog.close();
                deferred.reject();
            });
        });
        return deferred.promise();
    }

    /* Exports */
    exports.showPrimary = showPrimary;
    exports.showRenameForm = showRenameForm;
});
