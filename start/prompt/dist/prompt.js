/******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {};

    /******/ // The require function
    /******/
    function __webpack_require__(moduleId) {

        /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId])
        /******/
            return installedModules[moduleId].exports;

        /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = {
            /******/
            exports: {},
            /******/
            id: moduleId,
            /******/
            loaded: false
                /******/
        };

        /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        /******/ // Flag the module as loaded
        /******/
        module.loaded = true;

        /******/ // Return the exports of the module
        /******/
        return module.exports;
        /******/
    }


    /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules;

    /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules;

    /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = "";

    /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(0);
    /******/
})
/************************************************************************/
/******/
([
    /* 0 */
    /***/
    function(module, exports, __webpack_require__) {

        var tmpl = __webpack_require__(1),
            css = __webpack_require__(2);

        var defaultOption = {
            negative: 'cancel',
            positive: 'ok'
        };

        /* @param: option{object}:
         *            title{string}
         *            placeholder{string}
         *            negative{string}
         *            positive{string}
         *            callback{function}
         */
        function prompt(option) {
            option = $.extend(defaultOption, option);
            if ($('.js-prompt').length === 0) {
                $('body').append(tmpl);
                $('.js-prompt .js-positive').on('click', function() {
                    if (inputDiv.val() != '') {
                        $('.js-prompt').hide();
                        option.callback(inputDiv.val());
                    }
                });
                $('.js-prompt .js-negative').on('click', function() {
                    $('.js-prompt').hide();
                    option.callback(null);
                });
            }
            var promptDiv = $('.js-prompt'),
                titleDiv = promptDiv.find('.js-title'),
                inputDiv = promptDiv.find('.js-input'),
                negDiv = promptDiv.find('.js-negative'),
                posDiv = promptDiv.find('.js-positive');
            titleDiv.html(option.title);
            inputDiv.attr('placeholder', option.placeholder);
            inputDiv.val('');
            posDiv.html(option.positive);
            negDiv.html(option.negative);
            promptDiv.show();
        }

        window.prompt = prompt;



        /***/
    },
    /* 1 */
    /***/
    function(module, exports) {

        module.exports = "<div class=\"prompt js-prompt\" style=\"display:none\">\n    <div class=\"box\">\n        <div class=\"title js-title\">自定义位置</div>\n        <div class=\"input-box\">\n            <input type=\"text\" class=\"input js-input\" placeholder=\"位置名称\" maxlength=\"50\"/>\n        </div>\n        <div class=\"btn-box\">\n            <div class=\"btn is-left-btn js-negative\">取消</div><div class=\"btn is-right-btn js-positive\">添加</div>\n        </div>\n    </div>\n</div>\n";

        /***/
    },
    /* 2 */
    /***/
    function(module, exports, __webpack_require__) {

        // style-loader: Adds some css to the DOM by adding a <style> tag

        // load the styles
        var content = __webpack_require__(3);
        if (typeof content === 'string') content = [
            [module.id, content, '']
        ];
        // add the styles to the DOM
        var update = __webpack_require__(5)(content, {});
        if (content.locals) module.exports = content.locals;
        // Hot Module Replacement
        if (false) {
            // When the styles change, update the <style> tags
            if (!content.locals) {
                module.hot.accept("!!./../node_modules/css-loader/index.js!./../node_modules/less-loader/index.js!./prompt.less", function() {
                    var newContent = require("!!./../node_modules/css-loader/index.js!./../node_modules/less-loader/index.js!./prompt.less");
                    if (typeof newContent === 'string') newContent = [
                        [module.id, newContent, '']
                    ];
                    update(newContent);
                });
            }
            // When the module is disposed, remove the <style> tags
            module.hot.dispose(function() { update(); });
        }

        /***/
    },
    /* 3 */
    /***/
    function(module, exports, __webpack_require__) {

        exports = module.exports = __webpack_require__(4)();
        // imports


        // module
        exports.push([module.id, "@keyframes fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@-webkit-keyframes fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n.prompt {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  width: 100%;\n  background-color: rgba(0, 0, 0, 0.4);\n  font-size: 16px;\n  -webkit-animation: fadeIn .2s both;\n  animation: fadeIn .2s both;\n}\n.prompt .box {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 270px;\n  height: 150px;\n  margin-left: -135px;\n  margin-top: -60px;\n  background-color: white;\n  border-radius: 10.5px;\n}\n.prompt .box .title {\n  height: 60;\n  line-height: 60px;\n  text-align: center;\n  font-weight: 700;\n}\n.prompt .box .input-box {\n  height: 40px;\n  padding: 5px 0;\n}\n.prompt .box .input-box .input {\n  display: block;\n  width: 86%;\n  height: 20px;\n  margin: 0 auto;\n  border: 0px solid #ccc;\n  outline: medium;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 12px rgba(102, 175, 233, .6);\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 12px rgba(0, 0, 0, .2);\n  padding: 5px 4px;\n}\n.prompt .box .btn-box {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n  height: 45px;\n  line-height: 45px;\n  color: #007aff;\n  font-weight: 700;\n  cursor: pointer;\n}\n .prompt .box .btn-box .btn:hover{\n background-color:rgb(114, 201, 247);  \n  transition: all 0.5s ease 0s;\n -moz-transition: all 0.5s ease 0s;\n -webkit-transition: all 0.5s ease 0s;\n} \n.prompt .box .btn-box .btn {\n  display: inline-block;\n  width: 50%;\n  height: 100%;\n  box-sizing: border-box;\n  text-align: center;\n  border: 1px solid rgba(0, 0, 0, 0.1);\n  transition: all 0.5s ease 0s;\n -moz-transition: all 0.5s ease 0s;\n -webkit-transition: all 0.5s ease 0s;\n}\n.prompt .box .btn-box .btn.is-left-btn {\n  border-right: 0;\n}\n", ""]);

        // exports


        /***/
    },
    /* 4 */
    /***/
    function(module, exports) {

        /*
        	MIT License http://www.opensource.org/licenses/mit-license.php
        	Author Tobias Koppers @sokra
        */
        // css base code, injected by the css-loader
        module.exports = function() {
            var list = [];

            // return the list of modules as css string
            list.toString = function toString() {
                var result = [];
                for (var i = 0; i < this.length; i++) {
                    var item = this[i];
                    if (item[2]) {
                        result.push("@media " + item[2] + "{" + item[1] + "}");
                    } else {
                        result.push(item[1]);
                    }
                }
                return result.join("");
            };

            // import a list of modules into the list
            list.i = function(modules, mediaQuery) {
                if (typeof modules === "string")
                    modules = [
                        [null, modules, ""]
                    ];
                var alreadyImportedModules = {};
                for (var i = 0; i < this.length; i++) {
                    var id = this[i][0];
                    if (typeof id === "number")
                        alreadyImportedModules[id] = true;
                }
                for (i = 0; i < modules.length; i++) {
                    var item = modules[i];
                    // skip already imported module
                    // this implementation is not 100% perfect for weird media query combinations
                    //  when a module is imported multiple times with different media queries.
                    //  I hope this will never occur (Hey this way we have smaller bundles)
                    if (typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
                        if (mediaQuery && !item[2]) {
                            item[2] = mediaQuery;
                        } else if (mediaQuery) {
                            item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
                        }
                        list.push(item);
                    }
                }
            };
            return list;
        };


        /***/
    },
    /* 5 */
    /***/
    function(module, exports, __webpack_require__) {

        /*
        	MIT License http://www.opensource.org/licenses/mit-license.php
        	Author Tobias Koppers @sokra
        */
        var stylesInDom = {},
            memoize = function(fn) {
                var memo;
                return function() {
                    if (typeof memo === "undefined") memo = fn.apply(this, arguments);
                    return memo;
                };
            },
            isOldIE = memoize(function() {
                return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
            }),
            getHeadElement = memoize(function() {
                return document.head || document.getElementsByTagName("head")[0];
            }),
            singletonElement = null,
            singletonCounter = 0,
            styleElementsInsertedAtTop = [];

        module.exports = function(list, options) {
            if (false) {
                if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
            }

            options = options || {};
            // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
            // tags it will allow on a page
            if (typeof options.singleton === "undefined") options.singleton = isOldIE();

            // By default, add <style> tags to the bottom of <head>.
            if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

            var styles = listToStyles(list);
            addStylesToDom(styles, options);

            return function update(newList) {
                var mayRemove = [];
                for (var i = 0; i < styles.length; i++) {
                    var item = styles[i];
                    var domStyle = stylesInDom[item.id];
                    domStyle.refs--;
                    mayRemove.push(domStyle);
                }
                if (newList) {
                    var newStyles = listToStyles(newList);
                    addStylesToDom(newStyles, options);
                }
                for (var i = 0; i < mayRemove.length; i++) {
                    var domStyle = mayRemove[i];
                    if (domStyle.refs === 0) {
                        for (var j = 0; j < domStyle.parts.length; j++)
                            domStyle.parts[j]();
                        delete stylesInDom[domStyle.id];
                    }
                }
            };
        }

        function addStylesToDom(styles, options) {
            for (var i = 0; i < styles.length; i++) {
                var item = styles[i];
                var domStyle = stylesInDom[item.id];
                if (domStyle) {
                    domStyle.refs++;
                    for (var j = 0; j < domStyle.parts.length; j++) {
                        domStyle.parts[j](item.parts[j]);
                    }
                    for (; j < item.parts.length; j++) {
                        domStyle.parts.push(addStyle(item.parts[j], options));
                    }
                } else {
                    var parts = [];
                    for (var j = 0; j < item.parts.length; j++) {
                        parts.push(addStyle(item.parts[j], options));
                    }
                    stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts };
                }
            }
        }

        function listToStyles(list) {
            var styles = [];
            var newStyles = {};
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                var id = item[0];
                var css = item[1];
                var media = item[2];
                var sourceMap = item[3];
                var part = { css: css, media: media, sourceMap: sourceMap };
                if (!newStyles[id])
                    styles.push(newStyles[id] = { id: id, parts: [part] });
                else
                    newStyles[id].parts.push(part);
            }
            return styles;
        }

        function insertStyleElement(options, styleElement) {
            var head = getHeadElement();
            var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
            if (options.insertAt === "top") {
                if (!lastStyleElementInsertedAtTop) {
                    head.insertBefore(styleElement, head.firstChild);
                } else if (lastStyleElementInsertedAtTop.nextSibling) {
                    head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
                } else {
                    head.appendChild(styleElement);
                }
                styleElementsInsertedAtTop.push(styleElement);
            } else if (options.insertAt === "bottom") {
                head.appendChild(styleElement);
            } else {
                throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
            }
        }

        function removeStyleElement(styleElement) {
            styleElement.parentNode.removeChild(styleElement);
            var idx = styleElementsInsertedAtTop.indexOf(styleElement);
            if (idx >= 0) {
                styleElementsInsertedAtTop.splice(idx, 1);
            }
        }

        function createStyleElement(options) {
            var styleElement = document.createElement("style");
            styleElement.type = "text/css";
            insertStyleElement(options, styleElement);
            return styleElement;
        }

        function createLinkElement(options) {
            var linkElement = document.createElement("link");
            linkElement.rel = "stylesheet";
            insertStyleElement(options, linkElement);
            return linkElement;
        }

        function addStyle(obj, options) {
            var styleElement, update, remove;

            if (options.singleton) {
                var styleIndex = singletonCounter++;
                styleElement = singletonElement || (singletonElement = createStyleElement(options));
                update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
                remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
            } else if (obj.sourceMap &&
                typeof URL === "function" &&
                typeof URL.createObjectURL === "function" &&
                typeof URL.revokeObjectURL === "function" &&
                typeof Blob === "function" &&
                typeof btoa === "function") {
                styleElement = createLinkElement(options);
                update = updateLink.bind(null, styleElement);
                remove = function() {
                    removeStyleElement(styleElement);
                    if (styleElement.href)
                        URL.revokeObjectURL(styleElement.href);
                };
            } else {
                styleElement = createStyleElement(options);
                update = applyToTag.bind(null, styleElement);
                remove = function() {
                    removeStyleElement(styleElement);
                };
            }

            update(obj);

            return function updateStyle(newObj) {
                if (newObj) {
                    if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
                        return;
                    update(obj = newObj);
                } else {
                    remove();
                }
            };
        }

        var replaceText = (function() {
            var textStore = [];

            return function(index, replacement) {
                textStore[index] = replacement;
                return textStore.filter(Boolean).join('\n');
            };
        })();

        function applyToSingletonTag(styleElement, index, remove, obj) {
            var css = remove ? "" : obj.css;

            if (styleElement.styleSheet) {
                styleElement.styleSheet.cssText = replaceText(index, css);
            } else {
                var cssNode = document.createTextNode(css);
                var childNodes = styleElement.childNodes;
                if (childNodes[index]) styleElement.removeChild(childNodes[index]);
                if (childNodes.length) {
                    styleElement.insertBefore(cssNode, childNodes[index]);
                } else {
                    styleElement.appendChild(cssNode);
                }
            }
        }

        function applyToTag(styleElement, obj) {
            var css = obj.css;
            var media = obj.media;

            if (media) {
                styleElement.setAttribute("media", media)
            }

            if (styleElement.styleSheet) {
                styleElement.styleSheet.cssText = css;
            } else {
                while (styleElement.firstChild) {
                    styleElement.removeChild(styleElement.firstChild);
                }
                styleElement.appendChild(document.createTextNode(css));
            }
        }

        function updateLink(linkElement, obj) {
            var css = obj.css;
            var sourceMap = obj.sourceMap;

            if (sourceMap) {
                css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
            }

            var blob = new Blob([css], { type: "text/css" });

            var oldSrc = linkElement.href;

            linkElement.href = URL.createObjectURL(blob);

            if (oldSrc)
                URL.revokeObjectURL(oldSrc);
        }


        /***/
    }
    /******/
]);