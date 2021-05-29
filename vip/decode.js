;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory();
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define([], factory);
	}
	else {
		// Global (browser)
		root.CryptoJS = factory();
	}
}(this, function () {

	/*globals window, global, require*/

	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = CryptoJS || (function (Math, undefined) {

	    var crypto;

	    // Native crypto from window (Browser)
	    if (typeof window !== 'undefined' && window.crypto) {
	        crypto = window.crypto;
	    }

	    // Native (experimental IE 11) crypto from window (Browser)
	    if (!crypto && typeof window !== 'undefined' && window.msCrypto) {
	        crypto = window.msCrypto;
	    }

	    // Native crypto from global (NodeJS)
	    if (!crypto && typeof global !== 'undefined' && global.crypto) {
	        crypto = global.crypto;
	    }

	    // Native crypto import via require (NodeJS)
	    if (!crypto && typeof require === 'function') {
	        try {
	            crypto = require('crypto');
	        } catch (err) {}
	    }

	    /*
	     * Cryptographically secure pseudorandom number generator
	     *
	     * As Math.random() is cryptographically not safe to use
	     */
	    var cryptoSecureRandomInt = function () {
	        if (crypto) {
	            // Use getRandomValues method (Browser)
	            if (typeof crypto.getRandomValues === 'function') {
	                try {
	                    return crypto.getRandomValues(new Uint32Array(1))[0];
	                } catch (err) {}
	            }

	            // Use randomBytes method (NodeJS)
	            if (typeof crypto.randomBytes === 'function') {
	                try {
	                    return crypto.randomBytes(4).readInt32LE();
	                } catch (err) {}
	            }
	        }

	        throw new Error('Native crypto module could not be used to get secure random number.');
	    };

	    /*
	     * Local polyfill of Object.create

	     */
	    var create = Object.create || (function () {
	        function F() {}

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }())

	    /**
	     * CryptoJS namespace.
	     */
	    var C = {};

	    /**
	     * Library namespace.
	     */
	    var C_lib = C.lib = {};

	    /**
	     * Base object for prototypal inheritance.
	     */
	    var Base = C_lib.Base = (function () {


	        return {
	            /**
	             * Creates a new object that inherits from this object.
	             *
	             * @param {Object} overrides Properties to copy into the new object.
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         field: 'value',
	             *
	             *         method: function () {
	             *         }
	             *     });
	             */
	            extend: function (overrides) {
	                // Spawn
	                var subtype = create(this);

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                // Initializer's prototype is the subtype object
	                subtype.init.prototype = subtype;

	                // Reference supertype
	                subtype.$super = this;

	                return subtype;
	            },

	            /**
	             * Extends this object and runs the init method.
	             * Arguments to create() will be passed to init().
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var instance = MyType.create();
	             */
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            /**
	             * Initializes a newly created object.
	             * Override this method to add some logic when your objects are created.
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         init: function () {
	             *             // ...
	             *         }
	             *     });
	             */
	            init: function () {
	            },

	            /**
	             * Copies properties into this object.
	             *
	             * @param {Object} properties The properties to mix in.
	             *
	             * @example
	             *
	             *     MyType.mixIn({
	             *         field: 'value'
	             *     });
	             */
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                // IE won't copy toString using the loop above
	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            /**
	             * Creates a copy of this object.
	             *
	             * @return {Object} The clone.
	             *
	             * @example
	             *
	             *     var clone = instance.clone();
	             */
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    /**
	     * An array of 32-bit words.
	     *
	     * @property {Array} words The array of 32-bit words.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var WordArray = C_lib.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of 32-bit words.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.create();
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        /**
	         * Converts this word array to a string.
	         *
	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
	         *
	         * @return {string} The stringified word array.
	         *
	         * @example
	         *
	         *     var string = wordArray + '';
	         *     var string = wordArray.toString();
	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
	         */
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        /**
	         * Concatenates a word array to this word array.
	         *
	         * @param {WordArray} wordArray The word array to append.
	         *
	         * @return {WordArray} This word array.
	         *
	         * @example
	         *
	         *     wordArray1.concat(wordArray2);
	         */
	        concat: function (wordArray) {
	            // Shortcuts
	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            // Clamp excess bits
	            this.clamp();

	            // Concat
	            if (thisSigBytes % 4) {
	                // Copy one byte at a time
	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {
	                // Copy one word at a time
	                for (var i = 0; i < thatSigBytes; i += 4) {
	                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            // Chainable
	            return this;
	        },

	        /**
	         * Removes insignificant bits.
	         *
	         * @example
	         *
	         *     wordArray.clamp();
	         */
	        clamp: function () {
	            // Shortcuts
	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            // Clamp
	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = wordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        /**
	         * Creates a word array filled with random bytes.
	         *
	         * @param {number} nBytes The number of random bytes to generate.
	         *
	         * @return {WordArray} The random word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
	         */
	        random: function (nBytes) {
	            var words = [];

	            for (var i = 0; i < nBytes; i += 4) {
	                words.push(cryptoSecureRandomInt());
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    /**
	     * Encoder namespace.
	     */
	    var C_enc = C.enc = {};

	    /**
	     * Hex encoding strategy.
	     */
	    var Hex = C_enc.Hex = {
	        /**
	         * Converts a word array to a hex string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The hex string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        /**
	         * Converts a hex string to a word array.
	         *
	         * @param {string} hexStr The hex string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
	         */
	        parse: function (hexStr) {
	            // Shortcut
	            var hexStrLength = hexStr.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    /**
	     * Latin1 encoding strategy.
	     */
	    var Latin1 = C_enc.Latin1 = {
	        /**
	         * Converts a word array to a Latin1 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Latin1 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        /**
	         * Converts a Latin1 string to a word array.
	         *
	         * @param {string} latin1Str The Latin1 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
	         */
	        parse: function (latin1Str) {
	            // Shortcut
	            var latin1StrLength = latin1Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    /**
	     * UTF-8 encoding strategy.
	     */
	    var Utf8 = C_enc.Utf8 = {
	        /**
	         * Converts a word array to a UTF-8 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-8 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        /**
	         * Converts a UTF-8 string to a word array.
	         *
	         * @param {string} utf8Str The UTF-8 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
	         */
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    /**
	     * Abstract buffered block algorithm template.
	     *
	     * The property blockSize must be implemented in a concrete subtype.
	     *
	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
	     */
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        /**
	         * Resets this block algorithm's data buffer to its initial state.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm.reset();
	         */
	        reset: function () {
	            // Initial values
	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        /**
	         * Adds new data to this block algorithm's buffer.
	         *
	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm._append('data');
	         *     bufferedBlockAlgorithm._append(wordArray);
	         */
	        _append: function (data) {
	            // Convert string to WordArray, else assume WordArray already
	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            // Append
	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        /**
	         * Processes available data blocks.
	         *
	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
	         *
	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
	         *
	         * @return {WordArray} The processed data.
	         *
	         * @example
	         *
	         *     var processedData = bufferedBlockAlgorithm._process();
	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
	         */
	        _process: function (doFlush) {
	            var processedWords;

	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            // Count blocks ready
	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {
	                // Round up to include partial blocks
	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {
	                // Round down to include only full blocks,
	                // less the number of blocks that must remain in the buffer
	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            // Count words ready
	            var nWordsReady = nBlocksReady * blockSize;

	            // Count bytes ready
	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            // Process blocks
	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
	                    // Perform concrete-algorithm logic
	                    this._doProcessBlock(dataWords, offset);
	                }

	                // Remove processed words
	                processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            // Return processed words
	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        /**
	         * Creates a copy of this object.
	         *
	         * @return {Object} The clone.
	         *
	         * @example
	         *
	         *     var clone = bufferedBlockAlgorithm.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    /**
	     * Abstract hasher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
	     */
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         */
	        cfg: Base.extend(),

	        /**
	         * Initializes a newly created hasher.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
	         *
	         * @example
	         *
	         *     var hasher = CryptoJS.algo.SHA256.create();
	         */
	        init: function (cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this hasher to its initial state.
	         *
	         * @example
	         *
	         *     hasher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-hasher logic
	            this._doReset();
	        },

	        /**
	         * Updates this hasher with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {Hasher} This hasher.
	         *
	         * @example
	         *
	         *     hasher.update('message');
	         *     hasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            // Append
	            this._append(messageUpdate);

	            // Update the hash
	            this._process();

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the hash computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The hash.
	         *
	         * @example
	         *
	         *     var hash = hasher.finalize();
	         *     var hash = hasher.finalize('message');
	         *     var hash = hasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Final message update
	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            // Perform concrete-hasher logic
	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        /**
	         * Creates a shortcut function to a hasher's object interface.
	         *
	         * @param {Hasher} hasher The hasher to create a helper for.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
	         */
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        /**
	         * Creates a shortcut function to the HMAC's object interface.
	         *
	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
	         */
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    /**
	     * Algorithm namespace.
	     */
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    /**
	     * Base64 encoding strategy.
	     */
	    var Base64 = C_enc.Base64 = {
	        /**
	         * Converts a word array to a Base64 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Base64 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;
	            var map = this._map;

	            // Clamp excess bits
	            wordArray.clamp();

	            // Convert
	            var base64Chars = [];
	            for (var i = 0; i < sigBytes; i += 3) {
	                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
	                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
	                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

	                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

	                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
	                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
	                }
	            }

	            // Add padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                while (base64Chars.length % 4) {
	                    base64Chars.push(paddingChar);
	                }
	            }

	            return base64Chars.join('');
	        },

	        /**
	         * Converts a Base64 string to a word array.
	         *
	         * @param {string} base64Str The Base64 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
	         */
	        parse: function (base64Str) {
	            // Shortcuts
	            var base64StrLength = base64Str.length;
	            var map = this._map;
	            var reverseMap = this._reverseMap;

	            if (!reverseMap) {
	                    reverseMap = this._reverseMap = [];
	                    for (var j = 0; j < map.length; j++) {
	                        reverseMap[map.charCodeAt(j)] = j;
	                    }
	            }

	            // Ignore padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                var paddingIndex = base64Str.indexOf(paddingChar);
	                if (paddingIndex !== -1) {
	                    base64StrLength = paddingIndex;
	                }
	            }

	            // Convert
	            return parseLoop(base64Str, base64StrLength, reverseMap);

	        },

	        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	    };

	    function parseLoop(base64Str, base64StrLength, reverseMap) {
	      var words = [];
	      var nBytes = 0;
	      for (var i = 0; i < base64StrLength; i++) {
	          if (i % 4) {
	              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
	              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
	              var bitsCombined = bits1 | bits2;
	              words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
	              nBytes++;
	          }
	      }
	      return WordArray.create(words, nBytes);
	    }
	}());


	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Constants table
	    var T = [];

	    // Compute constants
	    (function () {
	        for (var i = 0; i < 64; i++) {
	            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
	        }
	    }());

	    /**
	     * MD5 hash algorithm.
	     */
	    var MD5 = C_algo.MD5 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Swap endian
	            for (var i = 0; i < 16; i++) {
	                // Shortcuts
	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }

	            // Shortcuts
	            var H = this._hash.words;

	            var M_offset_0  = M[offset + 0];
	            var M_offset_1  = M[offset + 1];
	            var M_offset_2  = M[offset + 2];
	            var M_offset_3  = M[offset + 3];
	            var M_offset_4  = M[offset + 4];
	            var M_offset_5  = M[offset + 5];
	            var M_offset_6  = M[offset + 6];
	            var M_offset_7  = M[offset + 7];
	            var M_offset_8  = M[offset + 8];
	            var M_offset_9  = M[offset + 9];
	            var M_offset_10 = M[offset + 10];
	            var M_offset_11 = M[offset + 11];
	            var M_offset_12 = M[offset + 12];
	            var M_offset_13 = M[offset + 13];
	            var M_offset_14 = M[offset + 14];
	            var M_offset_15 = M[offset + 15];

	            // Working varialbes
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];

	            // Computation
	            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
	            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
	            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
	            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
	            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
	            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
	            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
	            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
	            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
	            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
	            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
	            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
	            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
	            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
	            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
	            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

	            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
	            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
	            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
	            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
	            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
	            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
	            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
	            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
	            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
	            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
	            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
	            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
	            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
	            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
	            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
	            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

	            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
	            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
	            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
	            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
	            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
	            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
	            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
	            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
	            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
	            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
	            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
	            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
	            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
	            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
	            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
	            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

	            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
	            d = II(d, a, b, c, M_offset_7,  10, T[49]);
	            c = II(c, d, a, b, M_offset_14, 15, T[50]);
	            b = II(b, c, d, a, M_offset_5,  21, T[51]);
	            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
	            d = II(d, a, b, c, M_offset_3,  10, T[53]);
	            c = II(c, d, a, b, M_offset_10, 15, T[54]);
	            b = II(b, c, d, a, M_offset_1,  21, T[55]);
	            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
	            d = II(d, a, b, c, M_offset_15, 10, T[57]);
	            c = II(c, d, a, b, M_offset_6,  15, T[58]);
	            b = II(b, c, d, a, M_offset_13, 21, T[59]);
	            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
	            d = II(d, a, b, c, M_offset_11, 10, T[61]);
	            c = II(c, d, a, b, M_offset_2,  15, T[62]);
	            b = II(b, c, d, a, M_offset_9,  21, T[63]);

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

	            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
	            var nBitsTotalL = nBitsTotal;
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
	                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
	            );
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
	            );

	            data.sigBytes = (dataWords.length + 1) * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var hash = this._hash;
	            var H = hash.words;

	            // Swap endian
	            for (var i = 0; i < 4; i++) {
	                // Shortcut
	                var H_i = H[i];

	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    function FF(a, b, c, d, x, s, t) {
	        var n = a + ((b & c) | (~b & d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function GG(a, b, c, d, x, s, t) {
	        var n = a + ((b & d) | (c & ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function HH(a, b, c, d, x, s, t) {
	        var n = a + (b ^ c ^ d) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function II(a, b, c, d, x, s, t) {
	        var n = a + (c ^ (b | ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.MD5('message');
	     *     var hash = CryptoJS.MD5(wordArray);
	     */
	    C.MD5 = Hasher._createHelper(MD5);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacMD5(message, key);
	     */
	    C.HmacMD5 = Hasher._createHmacHelper(MD5);
	}(Math));


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Reusable object
	    var W = [];

	    /**
	     * SHA-1 hash algorithm.
	     */
	    var SHA1 = C_algo.SHA1 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476,
	                0xc3d2e1f0
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var H = this._hash.words;

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];

	            // Computation
	            for (var i = 0; i < 80; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
	                    W[i] = (n << 1) | (n >>> 31);
	                }

	                var t = ((a << 5) | (a >>> 27)) + e + W[i];
	                if (i < 20) {
	                    t += ((b & c) | (~b & d)) + 0x5a827999;
	                } else if (i < 40) {
	                    t += (b ^ c ^ d) + 0x6ed9eba1;
	                } else if (i < 60) {
	                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
	                } else /* if (i < 80) */ {
	                    t += (b ^ c ^ d) - 0x359d3e2a;
	                }

	                e = d;
	                d = c;
	                c = (b << 30) | (b >>> 2);
	                b = a;
	                a = t;
	            }

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Return final computed hash
	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA1('message');
	     *     var hash = CryptoJS.SHA1(wordArray);
	     */
	    C.SHA1 = Hasher._createHelper(SHA1);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA1(message, key);
	     */
	    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
	}());


	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Initialization and round constants tables
	    var H = [];
	    var K = [];

	    // Compute constants
	    (function () {
	        function isPrime(n) {
	            var sqrtN = Math.sqrt(n);
	            for (var factor = 2; factor <= sqrtN; factor++) {
	                if (!(n % factor)) {
	                    return false;
	                }
	            }

	            return true;
	        }

	        function getFractionalBits(n) {
	            return ((n - (n | 0)) * 0x100000000) | 0;
	        }

	        var n = 2;
	        var nPrime = 0;
	        while (nPrime < 64) {
	            if (isPrime(n)) {
	                if (nPrime < 8) {
	                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
	                }
	                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

	                nPrime++;
	            }

	            n++;
	        }
	    }());

	    // Reusable object
	    var W = [];

	    /**
	     * SHA-256 hash algorithm.
	     */
	    var SHA256 = C_algo.SHA256 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init(H.slice(0));
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var H = this._hash.words;

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];
	            var f = H[5];
	            var g = H[6];
	            var h = H[7];

	            // Computation
	            for (var i = 0; i < 64; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var gamma0x = W[i - 15];
	                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
	                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
	                                   (gamma0x >>> 3);

	                    var gamma1x = W[i - 2];
	                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
	                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
	                                   (gamma1x >>> 10);

	                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
	                }

	                var ch  = (e & f) ^ (~e & g);
	                var maj = (a & b) ^ (a & c) ^ (b & c);

	                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
	                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

	                var t1 = h + sigma1 + ch + K[i] + W[i];
	                var t2 = sigma0 + maj;

	                h = g;
	                g = f;
	                f = e;
	                e = (d + t1) | 0;
	                d = c;
	                c = b;
	                b = a;
	                a = (t1 + t2) | 0;
	            }

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	            H[5] = (H[5] + f) | 0;
	            H[6] = (H[6] + g) | 0;
	            H[7] = (H[7] + h) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Return final computed hash
	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA256('message');
	     *     var hash = CryptoJS.SHA256(wordArray);
	     */
	    C.SHA256 = Hasher._createHelper(SHA256);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA256(message, key);
	     */
	    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
	}(Math));


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    /**
	     * UTF-16 BE encoding strategy.
	     */
	    var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
	        /**
	         * Converts a word array to a UTF-16 BE string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-16 BE string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var utf16Chars = [];
	            for (var i = 0; i < sigBytes; i += 2) {
	                var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
	                utf16Chars.push(String.fromCharCode(codePoint));
	            }

	            return utf16Chars.join('');
	        },

	        /**
	         * Converts a UTF-16 BE string to a word array.
	         *
	         * @param {string} utf16Str The UTF-16 BE string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
	         */
	        parse: function (utf16Str) {
	            // Shortcut
	            var utf16StrLength = utf16Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < utf16StrLength; i++) {
	                words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
	            }

	            return WordArray.create(words, utf16StrLength * 2);
	        }
	    };

	    /**
	     * UTF-16 LE encoding strategy.
	     */
	    C_enc.Utf16LE = {
	        /**
	         * Converts a word array to a UTF-16 LE string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-16 LE string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var utf16Chars = [];
	            for (var i = 0; i < sigBytes; i += 2) {
	                var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
	                utf16Chars.push(String.fromCharCode(codePoint));
	            }

	            return utf16Chars.join('');
	        },

	        /**
	         * Converts a UTF-16 LE string to a word array.
	         *
	         * @param {string} utf16Str The UTF-16 LE string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
	         */
	        parse: function (utf16Str) {
	            // Shortcut
	            var utf16StrLength = utf16Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < utf16StrLength; i++) {
	                words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
	            }

	            return WordArray.create(words, utf16StrLength * 2);
	        }
	    };

	    function swapEndian(word) {
	        return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
	    }
	}());


	(function () {
	    // Check if typed arrays are supported
	    if (typeof ArrayBuffer != 'function') {
	        return;
	    }

	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;

	    // Reference original init
	    var superInit = WordArray.init;

	    // Augment WordArray.init to handle typed arrays
	    var subInit = WordArray.init = function (typedArray) {
	        // Convert buffers to uint8
	        if (typedArray instanceof ArrayBuffer) {
	            typedArray = new Uint8Array(typedArray);
	        }

	        // Convert other array views to uint8
	        if (
	            typedArray instanceof Int8Array ||
	            (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
	            typedArray instanceof Int16Array ||
	            typedArray instanceof Uint16Array ||
	            typedArray instanceof Int32Array ||
	            typedArray instanceof Uint32Array ||
	            typedArray instanceof Float32Array ||
	            typedArray instanceof Float64Array
	        ) {
	            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
	        }

	        // Handle Uint8Array
	        if (typedArray instanceof Uint8Array) {
	            // Shortcut
	            var typedArrayByteLength = typedArray.byteLength;

	            // Extract bytes
	            var words = [];
	            for (var i = 0; i < typedArrayByteLength; i++) {
	                words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
	            }

	            // Initialize this word array
	            superInit.call(this, words, typedArrayByteLength);
	        } else {
	            // Else call normal init
	            superInit.apply(this, arguments);
	        }
	    };

	    subInit.prototype = WordArray;
	}());


	/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Constants table
	    var _zl = WordArray.create([
	        0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
	        7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
	        3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
	        1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
	        4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13]);
	    var _zr = WordArray.create([
	        5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
	        6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
	        15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
	        8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
	        12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11]);
	    var _sl = WordArray.create([
	         11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
	        7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
	        11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
	          11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
	        9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ]);
	    var _sr = WordArray.create([
	        8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
	        9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
	        9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
	        15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
	        8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ]);

	    var _hl =  WordArray.create([ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]);
	    var _hr =  WordArray.create([ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]);

	    /**
	     * RIPEMD160 hash algorithm.
	     */
	    var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
	        _doReset: function () {
	            this._hash  = WordArray.create([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
	        },

	        _doProcessBlock: function (M, offset) {

	            // Swap endian
	            for (var i = 0; i < 16; i++) {
	                // Shortcuts
	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                // Swap
	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }
	            // Shortcut
	            var H  = this._hash.words;
	            var hl = _hl.words;
	            var hr = _hr.words;
	            var zl = _zl.words;
	            var zr = _zr.words;
	            var sl = _sl.words;
	            var sr = _sr.words;

	            // Working variables
	            var al, bl, cl, dl, el;
	            var ar, br, cr, dr, er;

	            ar = al = H[0];
	            br = bl = H[1];
	            cr = cl = H[2];
	            dr = dl = H[3];
	            er = el = H[4];
	            // Computation
	            var t;
	            for (var i = 0; i < 80; i += 1) {
	                t = (al +  M[offset+zl[i]])|0;
	                if (i<16){
		            t +=  f1(bl,cl,dl) + hl[0];
	                } else if (i<32) {
		            t +=  f2(bl,cl,dl) + hl[1];
	                } else if (i<48) {
		            t +=  f3(bl,cl,dl) + hl[2];
	                } else if (i<64) {
		            t +=  f4(bl,cl,dl) + hl[3];
	                } else {// if (i<80) {
		            t +=  f5(bl,cl,dl) + hl[4];
	                }
	                t = t|0;
	                t =  rotl(t,sl[i]);
	                t = (t+el)|0;
	                al = el;
	                el = dl;
	                dl = rotl(cl, 10);
	                cl = bl;
	                bl = t;

	                t = (ar + M[offset+zr[i]])|0;
	                if (i<16){
		            t +=  f5(br,cr,dr) + hr[0];
	                } else if (i<32) {
		            t +=  f4(br,cr,dr) + hr[1];
	                } else if (i<48) {
		            t +=  f3(br,cr,dr) + hr[2];
	                } else if (i<64) {
		            t +=  f2(br,cr,dr) + hr[3];
	                } else {// if (i<80) {
		            t +=  f1(br,cr,dr) + hr[4];
	                }
	                t = t|0;
	                t =  rotl(t,sr[i]) ;
	                t = (t+er)|0;
	                ar = er;
	                er = dr;
	                dr = rotl(cr, 10);
	                cr = br;
	                br = t;
	            }
	            // Intermediate hash value
	            t    = (H[1] + cl + dr)|0;
	            H[1] = (H[2] + dl + er)|0;
	            H[2] = (H[3] + el + ar)|0;
	            H[3] = (H[4] + al + br)|0;
	            H[4] = (H[0] + bl + cr)|0;
	            H[0] =  t;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
	            );
	            data.sigBytes = (dataWords.length + 1) * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var hash = this._hash;
	            var H = hash.words;

	            // Swap endian
	            for (var i = 0; i < 5; i++) {
	                // Shortcut
	                var H_i = H[i];

	                // Swap
	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });


	    function f1(x, y, z) {
	        return ((x) ^ (y) ^ (z));

	    }

	    function f2(x, y, z) {
	        return (((x)&(y)) | ((~x)&(z)));
	    }

	    function f3(x, y, z) {
	        return (((x) | (~(y))) ^ (z));
	    }

	    function f4(x, y, z) {
	        return (((x) & (z)) | ((y)&(~(z))));
	    }

	    function f5(x, y, z) {
	        return ((x) ^ ((y) |(~(z))));

	    }

	    function rotl(x,n) {
	        return (x<<n) | (x>>>(32-n));
	    }


	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.RIPEMD160('message');
	     *     var hash = CryptoJS.RIPEMD160(wordArray);
	     */
	    C.RIPEMD160 = Hasher._createHelper(RIPEMD160);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacRIPEMD160(message, key);
	     */
	    C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
	}(Math));


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var C_algo = C.algo;

	    /**
	     * HMAC algorithm.
	     */
	    var HMAC = C_algo.HMAC = Base.extend({
	        /**
	         * Initializes a newly created HMAC.
	         *
	         * @param {Hasher} hasher The hash algorithm to use.
	         * @param {WordArray|string} key The secret key.
	         *
	         * @example
	         *
	         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
	         */
	        init: function (hasher, key) {
	            // Init hasher
	            hasher = this._hasher = new hasher.init();

	            // Convert string to WordArray, else assume WordArray already
	            if (typeof key == 'string') {
	                key = Utf8.parse(key);
	            }

	            // Shortcuts
	            var hasherBlockSize = hasher.blockSize;
	            var hasherBlockSizeBytes = hasherBlockSize * 4;

	            // Allow arbitrary length keys
	            if (key.sigBytes > hasherBlockSizeBytes) {
	                key = hasher.finalize(key);
	            }

	            // Clamp excess bits
	            key.clamp();

	            // Clone key for inner and outer pads
	            var oKey = this._oKey = key.clone();
	            var iKey = this._iKey = key.clone();

	            // Shortcuts
	            var oKeyWords = oKey.words;
	            var iKeyWords = iKey.words;

	            // XOR keys with pad constants
	            for (var i = 0; i < hasherBlockSize; i++) {
	                oKeyWords[i] ^= 0x5c5c5c5c;
	                iKeyWords[i] ^= 0x36363636;
	            }
	            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this HMAC to its initial state.
	         *
	         * @example
	         *
	         *     hmacHasher.reset();
	         */
	        reset: function () {
	            // Shortcut
	            var hasher = this._hasher;

	            // Reset
	            hasher.reset();
	            hasher.update(this._iKey);
	        },

	        /**
	         * Updates this HMAC with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {HMAC} This HMAC instance.
	         *
	         * @example
	         *
	         *     hmacHasher.update('message');
	         *     hmacHasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            this._hasher.update(messageUpdate);

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the HMAC computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The HMAC.
	         *
	         * @example
	         *
	         *     var hmac = hmacHasher.finalize();
	         *     var hmac = hmacHasher.finalize('message');
	         *     var hmac = hmacHasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Shortcut
	            var hasher = this._hasher;

	            // Compute HMAC
	            var innerHash = hasher.finalize(messageUpdate);
	            hasher.reset();
	            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

	            return hmac;
	        }
	    });
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var SHA1 = C_algo.SHA1;
	    var HMAC = C_algo.HMAC;

	    /**
	     * Password-Based Key Derivation Function 2 algorithm.
	     */
	    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
	         * @property {Hasher} hasher The hasher to use. Default: SHA1
	         * @property {number} iterations The number of iterations to perform. Default: 1
	         */
	        cfg: Base.extend({
	            keySize: 128/32,
	            hasher: SHA1,
	            iterations: 1
	        }),

	        /**
	         * Initializes a newly created key derivation function.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
	         *
	         * @example
	         *
	         *     var kdf = CryptoJS.algo.PBKDF2.create();
	         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
	         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
	         */
	        init: function (cfg) {
	            this.cfg = this.cfg.extend(cfg);
	        },

	        /**
	         * Computes the Password-Based Key Derivation Function 2.
	         *
	         * @param {WordArray|string} password The password.
	         * @param {WordArray|string} salt A salt.
	         *
	         * @return {WordArray} The derived key.
	         *
	         * @example
	         *
	         *     var key = kdf.compute(password, salt);
	         */
	        compute: function (password, salt) {
	            // Shortcut
	            var cfg = this.cfg;

	            // Init HMAC
	            var hmac = HMAC.create(cfg.hasher, password);

	            // Initial values
	            var derivedKey = WordArray.create();
	            var blockIndex = WordArray.create([0x00000001]);

	            // Shortcuts
	            var derivedKeyWords = derivedKey.words;
	            var blockIndexWords = blockIndex.words;
	            var keySize = cfg.keySize;
	            var iterations = cfg.iterations;

	            // Generate key
	            while (derivedKeyWords.length < keySize) {
	                var block = hmac.update(salt).finalize(blockIndex);
	                hmac.reset();

	                // Shortcuts
	                var blockWords = block.words;
	                var blockWordsLength = blockWords.length;

	                // Iterations
	                var intermediate = block;
	                for (var i = 1; i < iterations; i++) {
	                    intermediate = hmac.finalize(intermediate);
	                    hmac.reset();

	                    // Shortcut
	                    var intermediateWords = intermediate.words;

	                    // XOR intermediate with block
	                    for (var j = 0; j < blockWordsLength; j++) {
	                        blockWords[j] ^= intermediateWords[j];
	                    }
	                }

	                derivedKey.concat(block);
	                blockIndexWords[0]++;
	            }
	            derivedKey.sigBytes = keySize * 4;

	            return derivedKey;
	        }
	    });

	    /**
	     * Computes the Password-Based Key Derivation Function 2.
	     *
	     * @param {WordArray|string} password The password.
	     * @param {WordArray|string} salt A salt.
	     * @param {Object} cfg (Optional) The configuration options to use for this computation.
	     *
	     * @return {WordArray} The derived key.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var key = CryptoJS.PBKDF2(password, salt);
	     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
	     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
	     */
	    C.PBKDF2 = function (password, salt, cfg) {
	        return PBKDF2.create(cfg).compute(password, salt);
	    };
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var MD5 = C_algo.MD5;

	    /**
	     * This key derivation function is meant to conform with EVP_BytesToKey.
	     * www.openssl.org/docs/crypto/EVP_BytesToKey.html
	     */
	    var EvpKDF = C_algo.EvpKDF = Base.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
	         * @property {Hasher} hasher The hash algorithm to use. Default: MD5
	         * @property {number} iterations The number of iterations to perform. Default: 1
	         */
	        cfg: Base.extend({
	            keySize: 128/32,
	            hasher: MD5,
	            iterations: 1
	        }),

	        /**
	         * Initializes a newly created key derivation function.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
	         *
	         * @example
	         *
	         *     var kdf = CryptoJS.algo.EvpKDF.create();
	         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
	         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
	         */
	        init: function (cfg) {
	            this.cfg = this.cfg.extend(cfg);
	        },

	        /**
	         * Derives a key from a password.
	         *
	         * @param {WordArray|string} password The password.
	         * @param {WordArray|string} salt A salt.
	         *
	         * @return {WordArray} The derived key.
	         *
	         * @example
	         *
	         *     var key = kdf.compute(password, salt);
	         */
	        compute: function (password, salt) {
	            var block;

	            // Shortcut
	            var cfg = this.cfg;

	            // Init hasher
	            var hasher = cfg.hasher.create();

	            // Initial values
	            var derivedKey = WordArray.create();

	            // Shortcuts
	            var derivedKeyWords = derivedKey.words;
	            var keySize = cfg.keySize;
	            var iterations = cfg.iterations;

	            // Generate key
	            while (derivedKeyWords.length < keySize) {
	                if (block) {
	                    hasher.update(block);
	                }
	                block = hasher.update(password).finalize(salt);
	                hasher.reset();

	                // Iterations
	                for (var i = 1; i < iterations; i++) {
	                    block = hasher.finalize(block);
	                    hasher.reset();
	                }

	                derivedKey.concat(block);
	            }
	            derivedKey.sigBytes = keySize * 4;

	            return derivedKey;
	        }
	    });

	    /**
	     * Derives a key from a password.
	     *
	     * @param {WordArray|string} password The password.
	     * @param {WordArray|string} salt A salt.
	     * @param {Object} cfg (Optional) The configuration options to use for this computation.
	     *
	     * @return {WordArray} The derived key.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var key = CryptoJS.EvpKDF(password, salt);
	     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
	     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
	     */
	    C.EvpKDF = function (password, salt, cfg) {
	        return EvpKDF.create(cfg).compute(password, salt);
	    };
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var SHA256 = C_algo.SHA256;

	    /**
	     * SHA-224 hash algorithm.
	     */
	    var SHA224 = C_algo.SHA224 = SHA256.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
	                0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
	            ]);
	        },

	        _doFinalize: function () {
	            var hash = SHA256._doFinalize.call(this);

	            hash.sigBytes -= 4;

	            return hash;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA224('message');
	     *     var hash = CryptoJS.SHA224(wordArray);
	     */
	    C.SHA224 = SHA256._createHelper(SHA224);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA224(message, key);
	     */
	    C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
	}());


	(function (undefined) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var X32WordArray = C_lib.WordArray;

	    /**
	     * x64 namespace.
	     */
	    var C_x64 = C.x64 = {};

	    /**
	     * A 64-bit word.
	     */
	    var X64Word = C_x64.Word = Base.extend({
	        /**
	         * Initializes a newly created 64-bit word.
	         *
	         * @param {number} high The high 32 bits.
	         * @param {number} low The low 32 bits.
	         *
	         * @example
	         *
	         *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
	         */
	        init: function (high, low) {
	            this.high = high;
	            this.low = low;
	        }

	        /**
	         * Bitwise NOTs this word.
	         *
	         * @return {X64Word} A new x64-Word object after negating.
	         *
	         * @example
	         *
	         *     var negated = x64Word.not();
	         */
	        // not: function () {
	            // var high = ~this.high;
	            // var low = ~this.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Bitwise ANDs this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to AND with this word.
	         *
	         * @return {X64Word} A new x64-Word object after ANDing.
	         *
	         * @example
	         *
	         *     var anded = x64Word.and(anotherX64Word);
	         */
	        // and: function (word) {
	            // var high = this.high & word.high;
	            // var low = this.low & word.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Bitwise ORs this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to OR with this word.
	         *
	         * @return {X64Word} A new x64-Word object after ORing.
	         *
	         * @example
	         *
	         *     var ored = x64Word.or(anotherX64Word);
	         */
	        // or: function (word) {
	            // var high = this.high | word.high;
	            // var low = this.low | word.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Bitwise XORs this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to XOR with this word.
	         *
	         * @return {X64Word} A new x64-Word object after XORing.
	         *
	         * @example
	         *
	         *     var xored = x64Word.xor(anotherX64Word);
	         */
	        // xor: function (word) {
	            // var high = this.high ^ word.high;
	            // var low = this.low ^ word.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Shifts this word n bits to the left.
	         *
	         * @param {number} n The number of bits to shift.
	         *
	         * @return {X64Word} A new x64-Word object after shifting.
	         *
	         * @example
	         *
	         *     var shifted = x64Word.shiftL(25);
	         */
	        // shiftL: function (n) {
	            // if (n < 32) {
	                // var high = (this.high << n) | (this.low >>> (32 - n));
	                // var low = this.low << n;
	            // } else {
	                // var high = this.low << (n - 32);
	                // var low = 0;
	            // }

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Shifts this word n bits to the right.
	         *
	         * @param {number} n The number of bits to shift.
	         *
	         * @return {X64Word} A new x64-Word object after shifting.
	         *
	         * @example
	         *
	         *     var shifted = x64Word.shiftR(7);
	         */
	        // shiftR: function (n) {
	            // if (n < 32) {
	                // var low = (this.low >>> n) | (this.high << (32 - n));
	                // var high = this.high >>> n;
	            // } else {
	                // var low = this.high >>> (n - 32);
	                // var high = 0;
	            // }

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Rotates this word n bits to the left.
	         *
	         * @param {number} n The number of bits to rotate.
	         *
	         * @return {X64Word} A new x64-Word object after rotating.
	         *
	         * @example
	         *
	         *     var rotated = x64Word.rotL(25);
	         */
	        // rotL: function (n) {
	            // return this.shiftL(n).or(this.shiftR(64 - n));
	        // },

	        /**
	         * Rotates this word n bits to the right.
	         *
	         * @param {number} n The number of bits to rotate.
	         *
	         * @return {X64Word} A new x64-Word object after rotating.
	         *
	         * @example
	         *
	         *     var rotated = x64Word.rotR(7);
	         */
	        // rotR: function (n) {
	            // return this.shiftR(n).or(this.shiftL(64 - n));
	        // },

	        /**
	         * Adds this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to add with this word.
	         *
	         * @return {X64Word} A new x64-Word object after adding.
	         *
	         * @example
	         *
	         *     var added = x64Word.add(anotherX64Word);
	         */
	        // add: function (word) {
	            // var low = (this.low + word.low) | 0;
	            // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
	            // var high = (this.high + word.high + carry) | 0;

	            // return X64Word.create(high, low);
	        // }
	    });

	    /**
	     * An array of 64-bit words.
	     *
	     * @property {Array} words The array of CryptoJS.x64.Word objects.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var X64WordArray = C_x64.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.x64.WordArray.create();
	         *
	         *     var wordArray = CryptoJS.x64.WordArray.create([
	         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
	         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
	         *     ]);
	         *
	         *     var wordArray = CryptoJS.x64.WordArray.create([
	         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
	         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
	         *     ], 10);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 8;
	            }
	        },

	        /**
	         * Converts this 64-bit word array to a 32-bit word array.
	         *
	         * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
	         *
	         * @example
	         *
	         *     var x32WordArray = x64WordArray.toX32();
	         */
	        toX32: function () {
	            // Shortcuts
	            var x64Words = this.words;
	            var x64WordsLength = x64Words.length;

	            // Convert
	            var x32Words = [];
	            for (var i = 0; i < x64WordsLength; i++) {
	                var x64Word = x64Words[i];
	                x32Words.push(x64Word.high);
	                x32Words.push(x64Word.low);
	            }

	            return X32WordArray.create(x32Words, this.sigBytes);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {X64WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = x64WordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);

	            // Clone "words" array
	            var words = clone.words = this.words.slice(0);

	            // Clone each X64Word object
	            var wordsLength = words.length;
	            for (var i = 0; i < wordsLength; i++) {
	                words[i] = words[i].clone();
	            }

	            return clone;
	        }
	    });
	}());


	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var C_algo = C.algo;

	    // Constants tables
	    var RHO_OFFSETS = [];
	    var PI_INDEXES  = [];
	    var ROUND_CONSTANTS = [];

	    // Compute Constants
	    (function () {
	        // Compute rho offset constants
	        var x = 1, y = 0;
	        for (var t = 0; t < 24; t++) {
	            RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

	            var newX = y % 5;
	            var newY = (2 * x + 3 * y) % 5;
	            x = newX;
	            y = newY;
	        }

	        // Compute pi index constants
	        for (var x = 0; x < 5; x++) {
	            for (var y = 0; y < 5; y++) {
	                PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
	            }
	        }

	        // Compute round constants
	        var LFSR = 0x01;
	        for (var i = 0; i < 24; i++) {
	            var roundConstantMsw = 0;
	            var roundConstantLsw = 0;

	            for (var j = 0; j < 7; j++) {
	                if (LFSR & 0x01) {
	                    var bitPosition = (1 << j) - 1;
	                    if (bitPosition < 32) {
	                        roundConstantLsw ^= 1 << bitPosition;
	                    } else /* if (bitPosition >= 32) */ {
	                        roundConstantMsw ^= 1 << (bitPosition - 32);
	                    }
	                }

	                // Compute next LFSR
	                if (LFSR & 0x80) {
	                    // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
	                    LFSR = (LFSR << 1) ^ 0x71;
	                } else {
	                    LFSR <<= 1;
	                }
	            }

	            ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
	        }
	    }());

	    // Reusable objects for temporary values
	    var T = [];
	    (function () {
	        for (var i = 0; i < 25; i++) {
	            T[i] = X64Word.create();
	        }
	    }());

	    /**
	     * SHA-3 hash algorithm.
	     */
	    var SHA3 = C_algo.SHA3 = Hasher.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} outputLength
	         *   The desired number of bits in the output hash.
	         *   Only values permitted are: 224, 256, 384, 512.
	         *   Default: 512
	         */
	        cfg: Hasher.cfg.extend({
	            outputLength: 512
	        }),

	        _doReset: function () {
	            var state = this._state = []
	            for (var i = 0; i < 25; i++) {
	                state[i] = new X64Word.init();
	            }

	            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcuts
	            var state = this._state;
	            var nBlockSizeLanes = this.blockSize / 2;

	            // Absorb
	            for (var i = 0; i < nBlockSizeLanes; i++) {
	                // Shortcuts
	                var M2i  = M[offset + 2 * i];
	                var M2i1 = M[offset + 2 * i + 1];

	                // Swap endian
	                M2i = (
	                    (((M2i << 8)  | (M2i >>> 24)) & 0x00ff00ff) |
	                    (((M2i << 24) | (M2i >>> 8))  & 0xff00ff00)
	                );
	                M2i1 = (
	                    (((M2i1 << 8)  | (M2i1 >>> 24)) & 0x00ff00ff) |
	                    (((M2i1 << 24) | (M2i1 >>> 8))  & 0xff00ff00)
	                );

	                // Absorb message into state
	                var lane = state[i];
	                lane.high ^= M2i1;
	                lane.low  ^= M2i;
	            }

	            // Rounds
	            for (var round = 0; round < 24; round++) {
	                // Theta
	                for (var x = 0; x < 5; x++) {
	                    // Mix column lanes
	                    var tMsw = 0, tLsw = 0;
	                    for (var y = 0; y < 5; y++) {
	                        var lane = state[x + 5 * y];
	                        tMsw ^= lane.high;
	                        tLsw ^= lane.low;
	                    }

	                    // Temporary values
	                    var Tx = T[x];
	                    Tx.high = tMsw;
	                    Tx.low  = tLsw;
	                }
	                for (var x = 0; x < 5; x++) {
	                    // Shortcuts
	                    var Tx4 = T[(x + 4) % 5];
	                    var Tx1 = T[(x + 1) % 5];
	                    var Tx1Msw = Tx1.high;
	                    var Tx1Lsw = Tx1.low;

	                    // Mix surrounding columns
	                    var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
	                    var tLsw = Tx4.low  ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
	                    for (var y = 0; y < 5; y++) {
	                        var lane = state[x + 5 * y];
	                        lane.high ^= tMsw;
	                        lane.low  ^= tLsw;
	                    }
	                }

	                // Rho Pi
	                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
	                    var tMsw;
	                    var tLsw;

	                    // Shortcuts
	                    var lane = state[laneIndex];
	                    var laneMsw = lane.high;
	                    var laneLsw = lane.low;
	                    var rhoOffset = RHO_OFFSETS[laneIndex];

	                    // Rotate lanes
	                    if (rhoOffset < 32) {
	                        tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
	                        tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
	                    } else /* if (rhoOffset >= 32) */ {
	                        tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
	                        tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
	                    }

	                    // Transpose lanes
	                    var TPiLane = T[PI_INDEXES[laneIndex]];
	                    TPiLane.high = tMsw;
	                    TPiLane.low  = tLsw;
	                }

	                // Rho pi at x = y = 0
	                var T0 = T[0];
	                var state0 = state[0];
	                T0.high = state0.high;
	                T0.low  = state0.low;

	                // Chi
	                for (var x = 0; x < 5; x++) {
	                    for (var y = 0; y < 5; y++) {
	                        // Shortcuts
	                        var laneIndex = x + 5 * y;
	                        var lane = state[laneIndex];
	                        var TLane = T[laneIndex];
	                        var Tx1Lane = T[((x + 1) % 5) + 5 * y];
	                        var Tx2Lane = T[((x + 2) % 5) + 5 * y];

	                        // Mix rows
	                        lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
	                        lane.low  = TLane.low  ^ (~Tx1Lane.low  & Tx2Lane.low);
	                    }
	                }

	                // Iota
	                var lane = state[0];
	                var roundConstant = ROUND_CONSTANTS[round];
	                lane.high ^= roundConstant.high;
	                lane.low  ^= roundConstant.low;
	            }
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;
	            var blockSizeBits = this.blockSize * 32;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
	            dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var state = this._state;
	            var outputLengthBytes = this.cfg.outputLength / 8;
	            var outputLengthLanes = outputLengthBytes / 8;

	            // Squeeze
	            var hashWords = [];
	            for (var i = 0; i < outputLengthLanes; i++) {
	                // Shortcuts
	                var lane = state[i];
	                var laneMsw = lane.high;
	                var laneLsw = lane.low;

	                // Swap endian
	                laneMsw = (
	                    (((laneMsw << 8)  | (laneMsw >>> 24)) & 0x00ff00ff) |
	                    (((laneMsw << 24) | (laneMsw >>> 8))  & 0xff00ff00)
	                );
	                laneLsw = (
	                    (((laneLsw << 8)  | (laneLsw >>> 24)) & 0x00ff00ff) |
	                    (((laneLsw << 24) | (laneLsw >>> 8))  & 0xff00ff00)
	                );

	                // Squeeze state to retrieve hash
	                hashWords.push(laneLsw);
	                hashWords.push(laneMsw);
	            }

	            // Return final computed hash
	            return new WordArray.init(hashWords, outputLengthBytes);
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);

	            var state = clone._state = this._state.slice(0);
	            for (var i = 0; i < 25; i++) {
	                state[i] = state[i].clone();
	            }

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA3('message');
	     *     var hash = CryptoJS.SHA3(wordArray);
	     */
	    C.SHA3 = Hasher._createHelper(SHA3);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA3(message, key);
	     */
	    C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
	}(Math));


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Hasher = C_lib.Hasher;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var X64WordArray = C_x64.WordArray;
	    var C_algo = C.algo;

	    function X64Word_create() {
	        return X64Word.create.apply(X64Word, arguments);
	    }

	    // Constants
	    var K = [
	        X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
	        X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
	        X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
	        X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
	        X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
	        X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
	        X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
	        X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
	        X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
	        X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
	        X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
	        X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
	        X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
	        X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
	        X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
	        X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
	        X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
	        X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
	        X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
	        X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
	        X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
	        X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
	        X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
	        X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
	        X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
	        X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
	        X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
	        X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
	        X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
	        X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
	        X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
	        X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
	        X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
	        X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
	        X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
	        X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
	        X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
	        X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
	        X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
	        X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
	    ];

	    // Reusable objects
	    var W = [];
	    (function () {
	        for (var i = 0; i < 80; i++) {
	            W[i] = X64Word_create();
	        }
	    }());

	    /**
	     * SHA-512 hash algorithm.
	     */
	    var SHA512 = C_algo.SHA512 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new X64WordArray.init([
	                new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
	                new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
	                new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
	                new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcuts
	            var H = this._hash.words;

	            var H0 = H[0];
	            var H1 = H[1];
	            var H2 = H[2];
	            var H3 = H[3];
	            var H4 = H[4];
	            var H5 = H[5];
	            var H6 = H[6];
	            var H7 = H[7];

	            var H0h = H0.high;
	            var H0l = H0.low;
	            var H1h = H1.high;
	            var H1l = H1.low;
	            var H2h = H2.high;
	            var H2l = H2.low;
	            var H3h = H3.high;
	            var H3l = H3.low;
	            var H4h = H4.high;
	            var H4l = H4.low;
	            var H5h = H5.high;
	            var H5l = H5.low;
	            var H6h = H6.high;
	            var H6l = H6.low;
	            var H7h = H7.high;
	            var H7l = H7.low;

	            // Working variables
	            var ah = H0h;
	            var al = H0l;
	            var bh = H1h;
	            var bl = H1l;
	            var ch = H2h;
	            var cl = H2l;
	            var dh = H3h;
	            var dl = H3l;
	            var eh = H4h;
	            var el = H4l;
	            var fh = H5h;
	            var fl = H5l;
	            var gh = H6h;
	            var gl = H6l;
	            var hh = H7h;
	            var hl = H7l;

	            // Rounds
	            for (var i = 0; i < 80; i++) {
	                var Wil;
	                var Wih;

	                // Shortcut
	                var Wi = W[i];

	                // Extend message
	                if (i < 16) {
	                    Wih = Wi.high = M[offset + i * 2]     | 0;
	                    Wil = Wi.low  = M[offset + i * 2 + 1] | 0;
	                } else {
	                    // Gamma0
	                    var gamma0x  = W[i - 15];
	                    var gamma0xh = gamma0x.high;
	                    var gamma0xl = gamma0x.low;
	                    var gamma0h  = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
	                    var gamma0l  = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));

	                    // Gamma1
	                    var gamma1x  = W[i - 2];
	                    var gamma1xh = gamma1x.high;
	                    var gamma1xl = gamma1x.low;
	                    var gamma1h  = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
	                    var gamma1l  = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));

	                    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
	                    var Wi7  = W[i - 7];
	                    var Wi7h = Wi7.high;
	                    var Wi7l = Wi7.low;

	                    var Wi16  = W[i - 16];
	                    var Wi16h = Wi16.high;
	                    var Wi16l = Wi16.low;

	                    Wil = gamma0l + Wi7l;
	                    Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
	                    Wil = Wil + gamma1l;
	                    Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
	                    Wil = Wil + Wi16l;
	                    Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);

	                    Wi.high = Wih;
	                    Wi.low  = Wil;
	                }

	                var chh  = (eh & fh) ^ (~eh & gh);
	                var chl  = (el & fl) ^ (~el & gl);
	                var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
	                var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

	                var sigma0h = ((ah >>> 28) | (al << 4))  ^ ((ah << 30)  | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
	                var sigma0l = ((al >>> 28) | (ah << 4))  ^ ((al << 30)  | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
	                var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
	                var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));

	                // t1 = h + sigma1 + ch + K[i] + W[i]
	                var Ki  = K[i];
	                var Kih = Ki.high;
	                var Kil = Ki.low;

	                var t1l = hl + sigma1l;
	                var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
	                var t1l = t1l + chl;
	                var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
	                var t1l = t1l + Kil;
	                var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
	                var t1l = t1l + Wil;
	                var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);

	                // t2 = sigma0 + maj
	                var t2l = sigma0l + majl;
	                var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

	                // Update working variables
	                hh = gh;
	                hl = gl;
	                gh = fh;
	                gl = fl;
	                fh = eh;
	                fl = el;
	                el = (dl + t1l) | 0;
	                eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
	                dh = ch;
	                dl = cl;
	                ch = bh;
	                cl = bl;
	                bh = ah;
	                bl = al;
	                al = (t1l + t2l) | 0;
	                ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
	            }

	            // Intermediate hash value
	            H0l = H0.low  = (H0l + al);
	            H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
	            H1l = H1.low  = (H1l + bl);
	            H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
	            H2l = H2.low  = (H2l + cl);
	            H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
	            H3l = H3.low  = (H3l + dl);
	            H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
	            H4l = H4.low  = (H4l + el);
	            H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
	            H5l = H5.low  = (H5l + fl);
	            H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
	            H6l = H6.low  = (H6l + gl);
	            H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
	            H7l = H7.low  = (H7l + hl);
	            H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Convert hash to 32-bit word array before returning
	            var hash = this._hash.toX32();

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        },

	        blockSize: 1024/32
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA512('message');
	     *     var hash = CryptoJS.SHA512(wordArray);
	     */
	    C.SHA512 = Hasher._createHelper(SHA512);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA512(message, key);
	     */
	    C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var X64WordArray = C_x64.WordArray;
	    var C_algo = C.algo;
	    var SHA512 = C_algo.SHA512;

	    /**
	     * SHA-384 hash algorithm.
	     */
	    var SHA384 = C_algo.SHA384 = SHA512.extend({
	        _doReset: function () {
	            this._hash = new X64WordArray.init([
	                new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
	                new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
	                new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
	                new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
	            ]);
	        },

	        _doFinalize: function () {
	            var hash = SHA512._doFinalize.call(this);

	            hash.sigBytes -= 16;

	            return hash;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA384('message');
	     *     var hash = CryptoJS.SHA384(wordArray);
	     */
	    C.SHA384 = SHA512._createHelper(SHA384);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA384(message, key);
	     */
	    C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
	}());


	/**
	 * Cipher core components.
	 */
	CryptoJS.lib.Cipher || (function (undefined) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var Base64 = C_enc.Base64;
	    var C_algo = C.algo;
	    var EvpKDF = C_algo.EvpKDF;

	    /**
	     * Abstract base cipher template.
	     *
	     * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
	     * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
	     * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
	     * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
	     */
	    var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {WordArray} iv The IV to use for this operation.
	         */
	        cfg: Base.extend(),

	        /**
	         * Creates this cipher in encryption mode.
	         *
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {Cipher} A cipher instance.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
	         */
	        createEncryptor: function (key, cfg) {
	            return this.create(this._ENC_XFORM_MODE, key, cfg);
	        },

	        /**
	         * Creates this cipher in decryption mode.
	         *
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {Cipher} A cipher instance.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
	         */
	        createDecryptor: function (key, cfg) {
	            return this.create(this._DEC_XFORM_MODE, key, cfg);
	        },

	        /**
	         * Initializes a newly created cipher.
	         *
	         * @param {number} xformMode Either the encryption or decryption transormation mode constant.
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @example
	         *
	         *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
	         */
	        init: function (xformMode, key, cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Store transform mode and key
	            this._xformMode = xformMode;
	            this._key = key;

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this cipher to its initial state.
	         *
	         * @example
	         *
	         *     cipher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-cipher logic
	            this._doReset();
	        },

	        /**
	         * Adds data to be encrypted or decrypted.
	         *
	         * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
	         *
	         * @return {WordArray} The data after processing.
	         *
	         * @example
	         *
	         *     var encrypted = cipher.process('data');
	         *     var encrypted = cipher.process(wordArray);
	         */
	        process: function (dataUpdate) {
	            // Append
	            this._append(dataUpdate);

	            // Process available blocks
	            return this._process();
	        },

	        /**
	         * Finalizes the encryption or decryption process.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
	         *
	         * @return {WordArray} The data after final processing.
	         *
	         * @example
	         *
	         *     var encrypted = cipher.finalize();
	         *     var encrypted = cipher.finalize('data');
	         *     var encrypted = cipher.finalize(wordArray);
	         */
	        finalize: function (dataUpdate) {
	            // Final data update
	            if (dataUpdate) {
	                this._append(dataUpdate);
	            }

	            // Perform concrete-cipher logic
	            var finalProcessedData = this._doFinalize();

	            return finalProcessedData;
	        },

	        keySize: 128/32,

	        ivSize: 128/32,

	        _ENC_XFORM_MODE: 1,

	        _DEC_XFORM_MODE: 2,

	        /**
	         * Creates shortcut functions to a cipher's object interface.
	         *
	         * @param {Cipher} cipher The cipher to create a helper for.
	         *
	         * @return {Object} An object with encrypt and decrypt shortcut functions.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
	         */
	        _createHelper: (function () {
	            function selectCipherStrategy(key) {
	                if (typeof key == 'string') {
	                    return PasswordBasedCipher;
	                } else {
	                    return SerializableCipher;
	                }
	            }

	            return function (cipher) {
	                return {
	                    encrypt: function (message, key, cfg) {
	                        return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
	                    },

	                    decrypt: function (ciphertext, key, cfg) {
	                        return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
	                    }
	                };
	            };
	        }())
	    });

	    /**
	     * Abstract base stream cipher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
	     */
	    var StreamCipher = C_lib.StreamCipher = Cipher.extend({
	        _doFinalize: function () {
	            // Process partial blocks
	            var finalProcessedBlocks = this._process(!!'flush');

	            return finalProcessedBlocks;
	        },

	        blockSize: 1
	    });

	    /**
	     * Mode namespace.
	     */
	    var C_mode = C.mode = {};

	    /**
	     * Abstract base block cipher mode template.
	     */
	    var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
	        /**
	         * Creates this mode for encryption.
	         *
	         * @param {Cipher} cipher A block cipher instance.
	         * @param {Array} iv The IV words.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
	         */
	        createEncryptor: function (cipher, iv) {
	            return this.Encryptor.create(cipher, iv);
	        },

	        /**
	         * Creates this mode for decryption.
	         *
	         * @param {Cipher} cipher A block cipher instance.
	         * @param {Array} iv The IV words.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
	         */
	        createDecryptor: function (cipher, iv) {
	            return this.Decryptor.create(cipher, iv);
	        },

	        /**
	         * Initializes a newly created mode.
	         *
	         * @param {Cipher} cipher A block cipher instance.
	         * @param {Array} iv The IV words.
	         *
	         * @example
	         *
	         *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
	         */
	        init: function (cipher, iv) {
	            this._cipher = cipher;
	            this._iv = iv;
	        }
	    });

	    /**
	     * Cipher Block Chaining mode.
	     */
	    var CBC = C_mode.CBC = (function () {
	        /**
	         * Abstract base CBC mode.
	         */
	        var CBC = BlockCipherMode.extend();

	        /**
	         * CBC encryptor.
	         */
	        CBC.Encryptor = CBC.extend({
	            /**
	             * Processes the data block at offset.
	             *
	             * @param {Array} words The data words to operate on.
	             * @param {number} offset The offset where the block starts.
	             *
	             * @example
	             *
	             *     mode.processBlock(data.words, offset);
	             */
	            processBlock: function (words, offset) {
	                // Shortcuts
	                var cipher = this._cipher;
	                var blockSize = cipher.blockSize;

	                // XOR and encrypt
	                xorBlock.call(this, words, offset, blockSize);
	                cipher.encryptBlock(words, offset);

	                // Remember this block to use with next block
	                this._prevBlock = words.slice(offset, offset + blockSize);
	            }
	        });

	        /**
	         * CBC decryptor.
	         */
	        CBC.Decryptor = CBC.extend({
	            /**
	             * Processes the data block at offset.
	             *
	             * @param {Array} words The data words to operate on.
	             * @param {number} offset The offset where the block starts.
	             *
	             * @example
	             *
	             *     mode.processBlock(data.words, offset);
	             */
	            processBlock: function (words, offset) {
	                // Shortcuts
	                var cipher = this._cipher;
	                var blockSize = cipher.blockSize;

	                // Remember this block to use with next block
	                var thisBlock = words.slice(offset, offset + blockSize);

	                // Decrypt and XOR
	                cipher.decryptBlock(words, offset);
	                xorBlock.call(this, words, offset, blockSize);

	                // This block becomes the previous block
	                this._prevBlock = thisBlock;
	            }
	        });

	        function xorBlock(words, offset, blockSize) {
	            var block;

	            // Shortcut
	            var iv = this._iv;

	            // Choose mixing block
	            if (iv) {
	                block = iv;

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            } else {
	                block = this._prevBlock;
	            }

	            // XOR blocks
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= block[i];
	            }
	        }

	        return CBC;
	    }());

	    /**
	     * Padding namespace.
	     */
	    var C_pad = C.pad = {};

	    /**
	     * PKCS #5/7 padding strategy.
	     */
	    var Pkcs7 = C_pad.Pkcs7 = {
	        /**
	         * Pads data using the algorithm defined in PKCS #5/7.
	         *
	         * @param {WordArray} data The data to pad.
	         * @param {number} blockSize The multiple that the data should be padded to.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
	         */
	        pad: function (data, blockSize) {
	            // Shortcut
	            var blockSizeBytes = blockSize * 4;

	            // Count padding bytes
	            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

	            // Create padding word
	            var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

	            // Create padding
	            var paddingWords = [];
	            for (var i = 0; i < nPaddingBytes; i += 4) {
	                paddingWords.push(paddingWord);
	            }
	            var padding = WordArray.create(paddingWords, nPaddingBytes);

	            // Add padding
	            data.concat(padding);
	        },

	        /**
	         * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
	         *
	         * @param {WordArray} data The data to unpad.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     CryptoJS.pad.Pkcs7.unpad(wordArray);
	         */
	        unpad: function (data) {
	            // Get number of padding bytes from last byte
	            var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	            // Remove padding
	            data.sigBytes -= nPaddingBytes;
	        }
	    };

	    /**
	     * Abstract base block cipher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
	     */
	    var BlockCipher = C_lib.BlockCipher = Cipher.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {Mode} mode The block mode to use. Default: CBC
	         * @property {Padding} padding The padding strategy to use. Default: Pkcs7
	         */
	        cfg: Cipher.cfg.extend({
	            mode: CBC,
	            padding: Pkcs7
	        }),

	        reset: function () {
	            var modeCreator;

	            // Reset cipher
	            Cipher.reset.call(this);

	            // Shortcuts
	            var cfg = this.cfg;
	            var iv = cfg.iv;
	            var mode = cfg.mode;

	            // Reset block mode
	            if (this._xformMode == this._ENC_XFORM_MODE) {
	                modeCreator = mode.createEncryptor;
	            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
	                modeCreator = mode.createDecryptor;
	                // Keep at least one block in the buffer for unpadding
	                this._minBufferSize = 1;
	            }

	            if (this._mode && this._mode.__creator == modeCreator) {
	                this._mode.init(this, iv && iv.words);
	            } else {
	                this._mode = modeCreator.call(mode, this, iv && iv.words);
	                this._mode.__creator = modeCreator;
	            }
	        },

	        _doProcessBlock: function (words, offset) {
	            this._mode.processBlock(words, offset);
	        },

	        _doFinalize: function () {
	            var finalProcessedBlocks;

	            // Shortcut
	            var padding = this.cfg.padding;

	            // Finalize
	            if (this._xformMode == this._ENC_XFORM_MODE) {
	                // Pad data
	                padding.pad(this._data, this.blockSize);

	                // Process final blocks
	                finalProcessedBlocks = this._process(!!'flush');
	            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
	                // Process final blocks
	                finalProcessedBlocks = this._process(!!'flush');

	                // Unpad data
	                padding.unpad(finalProcessedBlocks);
	            }

	            return finalProcessedBlocks;
	        },

	        blockSize: 128/32
	    });

	    /**
	     * A collection of cipher parameters.
	     *
	     * @property {WordArray} ciphertext The raw ciphertext.
	     * @property {WordArray} key The key to this ciphertext.
	     * @property {WordArray} iv The IV used in the ciphering operation.
	     * @property {WordArray} salt The salt used with a key derivation function.
	     * @property {Cipher} algorithm The cipher algorithm.
	     * @property {Mode} mode The block mode used in the ciphering operation.
	     * @property {Padding} padding The padding scheme used in the ciphering operation.
	     * @property {number} blockSize The block size of the cipher.
	     * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
	     */
	    var CipherParams = C_lib.CipherParams = Base.extend({
	        /**
	         * Initializes a newly created cipher params object.
	         *
	         * @param {Object} cipherParams An object with any of the possible cipher parameters.
	         *
	         * @example
	         *
	         *     var cipherParams = CryptoJS.lib.CipherParams.create({
	         *         ciphertext: ciphertextWordArray,
	         *         key: keyWordArray,
	         *         iv: ivWordArray,
	         *         salt: saltWordArray,
	         *         algorithm: CryptoJS.algo.AES,
	         *         mode: CryptoJS.mode.CBC,
	         *         padding: CryptoJS.pad.PKCS7,
	         *         blockSize: 4,
	         *         formatter: CryptoJS.format.OpenSSL
	         *     });
	         */
	        init: function (cipherParams) {
	            this.mixIn(cipherParams);
	        },

	        /**
	         * Converts this cipher params object to a string.
	         *
	         * @param {Format} formatter (Optional) The formatting strategy to use.
	         *
	         * @return {string} The stringified cipher params.
	         *
	         * @throws Error If neither the formatter nor the default formatter is set.
	         *
	         * @example
	         *
	         *     var string = cipherParams + '';
	         *     var string = cipherParams.toString();
	         *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
	         */
	        toString: function (formatter) {
	            return (formatter || this.formatter).stringify(this);
	        }
	    });

	    /**
	     * Format namespace.
	     */
	    var C_format = C.format = {};

	    /**
	     * OpenSSL formatting strategy.
	     */
	    var OpenSSLFormatter = C_format.OpenSSL = {
	        /**
	         * Converts a cipher params object to an OpenSSL-compatible string.
	         *
	         * @param {CipherParams} cipherParams The cipher params object.
	         *
	         * @return {string} The OpenSSL-compatible string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
	         */
	        stringify: function (cipherParams) {
	            var wordArray;

	            // Shortcuts
	            var ciphertext = cipherParams.ciphertext;
	            var salt = cipherParams.salt;

	            // Format
	            if (salt) {
	                wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
	            } else {
	                wordArray = ciphertext;
	            }

	            return wordArray.toString(Base64);
	        },

	        /**
	         * Converts an OpenSSL-compatible string to a cipher params object.
	         *
	         * @param {string} openSSLStr The OpenSSL-compatible string.
	         *
	         * @return {CipherParams} The cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
	         */
	        parse: function (openSSLStr) {
	            var salt;

	            // Parse base64
	            var ciphertext = Base64.parse(openSSLStr);

	            // Shortcut
	            var ciphertextWords = ciphertext.words;

	            // Test for salt
	            if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
	                // Extract salt
	                salt = WordArray.create(ciphertextWords.slice(2, 4));

	                // Remove salt from ciphertext
	                ciphertextWords.splice(0, 4);
	                ciphertext.sigBytes -= 16;
	            }

	            return CipherParams.create({ ciphertext: ciphertext, salt: salt });
	        }
	    };

	    /**
	     * A cipher wrapper that returns ciphertext as a serializable cipher params object.
	     */
	    var SerializableCipher = C_lib.SerializableCipher = Base.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
	         */
	        cfg: Base.extend({
	            format: OpenSSLFormatter
	        }),

	        /**
	         * Encrypts a message.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {WordArray|string} message The message to encrypt.
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {CipherParams} A cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
	         */
	        encrypt: function (cipher, message, key, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Encrypt
	            var encryptor = cipher.createEncryptor(key, cfg);
	            var ciphertext = encryptor.finalize(message);

	            // Shortcut
	            var cipherCfg = encryptor.cfg;

	            // Create and return serializable cipher params
	            return CipherParams.create({
	                ciphertext: ciphertext,
	                key: key,
	                iv: cipherCfg.iv,
	                algorithm: cipher,
	                mode: cipherCfg.mode,
	                padding: cipherCfg.padding,
	                blockSize: cipher.blockSize,
	                formatter: cfg.format
	            });
	        },

	        /**
	         * Decrypts serialized ciphertext.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {WordArray} The plaintext.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
	         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
	         */
	        decrypt: function (cipher, ciphertext, key, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Convert string to CipherParams
	            ciphertext = this._parse(ciphertext, cfg.format);

	            // Decrypt
	            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

	            return plaintext;
	        },

	        /**
	         * Converts serialized ciphertext to CipherParams,
	         * else assumed CipherParams already and returns ciphertext unchanged.
	         *
	         * @param {CipherParams|string} ciphertext The ciphertext.
	         * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
	         *
	         * @return {CipherParams} The unserialized ciphertext.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
	         */
	        _parse: function (ciphertext, format) {
	            if (typeof ciphertext == 'string') {
	                return format.parse(ciphertext, this);
	            } else {
	                return ciphertext;
	            }
	        }
	    });

	    /**
	     * Key derivation function namespace.
	     */
	    var C_kdf = C.kdf = {};

	    /**
	     * OpenSSL key derivation function.
	     */
	    var OpenSSLKdf = C_kdf.OpenSSL = {
	        /**
	         * Derives a key and IV from a password.
	         *
	         * @param {string} password The password to derive from.
	         * @param {number} keySize The size in words of the key to generate.
	         * @param {number} ivSize The size in words of the IV to generate.
	         * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
	         *
	         * @return {CipherParams} A cipher params object with the key, IV, and salt.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
	         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
	         */
	        execute: function (password, keySize, ivSize, salt) {
	            // Generate random salt
	            if (!salt) {
	                salt = WordArray.random(64/8);
	            }

	            // Derive key and IV
	            var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);

	            // Separate key and IV
	            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
	            key.sigBytes = keySize * 4;

	            // Return params
	            return CipherParams.create({ key: key, iv: iv, salt: salt });
	        }
	    };

	    /**
	     * A serializable cipher wrapper that derives the key from a password,
	     * and returns ciphertext as a serializable cipher params object.
	     */
	    var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
	         */
	        cfg: SerializableCipher.cfg.extend({
	            kdf: OpenSSLKdf
	        }),

	        /**
	         * Encrypts a message using a password.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {WordArray|string} message The message to encrypt.
	         * @param {string} password The password.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {CipherParams} A cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
	         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
	         */
	        encrypt: function (cipher, message, password, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Derive key and other params
	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

	            // Add IV to config
	            cfg.iv = derivedParams.iv;

	            // Encrypt
	            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

	            // Mix in derived params
	            ciphertext.mixIn(derivedParams);

	            return ciphertext;
	        },

	        /**
	         * Decrypts serialized ciphertext using a password.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
	         * @param {string} password The password.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {WordArray} The plaintext.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
	         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
	         */
	        decrypt: function (cipher, ciphertext, password, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Convert string to CipherParams
	            ciphertext = this._parse(ciphertext, cfg.format);

	            // Derive key and other params
	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

	            // Add IV to config
	            cfg.iv = derivedParams.iv;

	            // Decrypt
	            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

	            return plaintext;
	        }
	    });
	}());


	/**
	 * Cipher Feedback block mode.
	 */
	CryptoJS.mode.CFB = (function () {
	    var CFB = CryptoJS.lib.BlockCipherMode.extend();

	    CFB.Encryptor = CFB.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher;
	            var blockSize = cipher.blockSize;

	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

	            // Remember this block to use with next block
	            this._prevBlock = words.slice(offset, offset + blockSize);
	        }
	    });

	    CFB.Decryptor = CFB.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher;
	            var blockSize = cipher.blockSize;

	            // Remember this block to use with next block
	            var thisBlock = words.slice(offset, offset + blockSize);

	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

	            // This block becomes the previous block
	            this._prevBlock = thisBlock;
	        }
	    });

	    function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
	        var keystream;

	        // Shortcut
	        var iv = this._iv;

	        // Generate keystream
	        if (iv) {
	            keystream = iv.slice(0);

	            // Remove IV for subsequent blocks
	            this._iv = undefined;
	        } else {
	            keystream = this._prevBlock;
	        }
	        cipher.encryptBlock(keystream, 0);

	        // Encrypt
	        for (var i = 0; i < blockSize; i++) {
	            words[offset + i] ^= keystream[i];
	        }
	    }

	    return CFB;
	}());


	/**
	 * Electronic Codebook block mode.
	 */
	CryptoJS.mode.ECB = (function () {
	    var ECB = CryptoJS.lib.BlockCipherMode.extend();

	    ECB.Encryptor = ECB.extend({
	        processBlock: function (words, offset) {
	            this._cipher.encryptBlock(words, offset);
	        }
	    });

	    ECB.Decryptor = ECB.extend({
	        processBlock: function (words, offset) {
	            this._cipher.decryptBlock(words, offset);
	        }
	    });

	    return ECB;
	}());


	/**
	 * ANSI X.923 padding strategy.
	 */
	CryptoJS.pad.AnsiX923 = {
	    pad: function (data, blockSize) {
	        // Shortcuts
	        var dataSigBytes = data.sigBytes;
	        var blockSizeBytes = blockSize * 4;

	        // Count padding bytes
	        var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;

	        // Compute last byte position
	        var lastBytePos = dataSigBytes + nPaddingBytes - 1;

	        // Pad
	        data.clamp();
	        data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
	        data.sigBytes += nPaddingBytes;
	    },

	    unpad: function (data) {
	        // Get number of padding bytes from last byte
	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	        // Remove padding
	        data.sigBytes -= nPaddingBytes;
	    }
	};


	/**
	 * ISO 10126 padding strategy.
	 */
	CryptoJS.pad.Iso10126 = {
	    pad: function (data, blockSize) {
	        // Shortcut
	        var blockSizeBytes = blockSize * 4;

	        // Count padding bytes
	        var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

	        // Pad
	        data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).
	             concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
	    },

	    unpad: function (data) {
	        // Get number of padding bytes from last byte
	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	        // Remove padding
	        data.sigBytes -= nPaddingBytes;
	    }
	};


	/**
	 * ISO/IEC 9797-1 Padding Method 2.
	 */
	CryptoJS.pad.Iso97971 = {
	    pad: function (data, blockSize) {
	        // Add 0x80 byte
	        data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));

	        // Zero pad the rest
	        CryptoJS.pad.ZeroPadding.pad(data, blockSize);
	    },

	    unpad: function (data) {
	        // Remove zero padding
	        CryptoJS.pad.ZeroPadding.unpad(data);

	        // Remove one more byte -- the 0x80 byte
	        data.sigBytes--;
	    }
	};


	/**
	 * Output Feedback block mode.
	 */
	CryptoJS.mode.OFB = (function () {
	    var OFB = CryptoJS.lib.BlockCipherMode.extend();

	    var Encryptor = OFB.Encryptor = OFB.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var keystream = this._keystream;

	            // Generate keystream
	            if (iv) {
	                keystream = this._keystream = iv.slice(0);

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            }
	            cipher.encryptBlock(keystream, 0);

	            // Encrypt
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    OFB.Decryptor = Encryptor;

	    return OFB;
	}());


	/**
	 * A noop padding strategy.
	 */
	CryptoJS.pad.NoPadding = {
	    pad: function () {
	    },

	    unpad: function () {
	    }
	};


	(function (undefined) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var CipherParams = C_lib.CipherParams;
	    var C_enc = C.enc;
	    var Hex = C_enc.Hex;
	    var C_format = C.format;

	    var HexFormatter = C_format.Hex = {
	        /**
	         * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
	         *
	         * @param {CipherParams} cipherParams The cipher params object.
	         *
	         * @return {string} The hexadecimally encoded string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
	         */
	        stringify: function (cipherParams) {
	            return cipherParams.ciphertext.toString(Hex);
	        },

	        /**
	         * Converts a hexadecimally encoded ciphertext string to a cipher params object.
	         *
	         * @param {string} input The hexadecimally encoded string.
	         *
	         * @return {CipherParams} The cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
	         */
	        parse: function (input) {
	            var ciphertext = Hex.parse(input);
	            return CipherParams.create({ ciphertext: ciphertext });
	        }
	    };
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    // Lookup tables
	    var SBOX = [];
	    var INV_SBOX = [];
	    var SUB_MIX_0 = [];
	    var SUB_MIX_1 = [];
	    var SUB_MIX_2 = [];
	    var SUB_MIX_3 = [];
	    var INV_SUB_MIX_0 = [];
	    var INV_SUB_MIX_1 = [];
	    var INV_SUB_MIX_2 = [];
	    var INV_SUB_MIX_3 = [];

	    // Compute lookup tables
	    (function () {
	        // Compute double table
	        var d = [];
	        for (var i = 0; i < 256; i++) {
	            if (i < 128) {
	                d[i] = i << 1;
	            } else {
	                d[i] = (i << 1) ^ 0x11b;
	            }
	        }

	        // Walk GF(2^8)
	        var x = 0;
	        var xi = 0;
	        for (var i = 0; i < 256; i++) {
	            // Compute sbox
	            var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
	            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
	            SBOX[x] = sx;
	            INV_SBOX[sx] = x;

	            // Compute multiplication
	            var x2 = d[x];
	            var x4 = d[x2];
	            var x8 = d[x4];

	            // Compute sub bytes, mix columns tables
	            var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
	            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
	            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
	            SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
	            SUB_MIX_3[x] = t;

	            // Compute inv sub bytes, inv mix columns tables
	            var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
	            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
	            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
	            INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
	            INV_SUB_MIX_3[sx] = t;

	            // Compute next counter
	            if (!x) {
	                x = xi = 1;
	            } else {
	                x = x2 ^ d[d[d[x8 ^ x2]]];
	                xi ^= d[d[xi]];
	            }
	        }
	    }());

	    // Precomputed Rcon lookup
	    var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

	    /**
	     * AES block cipher algorithm.
	     */
	    var AES = C_algo.AES = BlockCipher.extend({
	        _doReset: function () {
	            var t;

	            // Skip reset of nRounds has been set before and key did not change
	            if (this._nRounds && this._keyPriorReset === this._key) {
	                return;
	            }

	            // Shortcuts
	            var key = this._keyPriorReset = this._key;
	            var keyWords = key.words;
	            var keySize = key.sigBytes / 4;

	            // Compute number of rounds
	            var nRounds = this._nRounds = keySize + 6;

	            // Compute number of key schedule rows
	            var ksRows = (nRounds + 1) * 4;

	            // Compute key schedule
	            var keySchedule = this._keySchedule = [];
	            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
	                if (ksRow < keySize) {
	                    keySchedule[ksRow] = keyWords[ksRow];
	                } else {
	                    t = keySchedule[ksRow - 1];

	                    if (!(ksRow % keySize)) {
	                        // Rot word
	                        t = (t << 8) | (t >>> 24);

	                        // Sub word
	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

	                        // Mix Rcon
	                        t ^= RCON[(ksRow / keySize) | 0] << 24;
	                    } else if (keySize > 6 && ksRow % keySize == 4) {
	                        // Sub word
	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
	                    }

	                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
	                }
	            }

	            // Compute inv key schedule
	            var invKeySchedule = this._invKeySchedule = [];
	            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
	                var ksRow = ksRows - invKsRow;

	                if (invKsRow % 4) {
	                    var t = keySchedule[ksRow];
	                } else {
	                    var t = keySchedule[ksRow - 4];
	                }

	                if (invKsRow < 4 || ksRow <= 4) {
	                    invKeySchedule[invKsRow] = t;
	                } else {
	                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
	                                               INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
	                }
	            }
	        },

	        encryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
	        },

	        decryptBlock: function (M, offset) {
	            // Swap 2nd and 4th rows
	            var t = M[offset + 1];
	            M[offset + 1] = M[offset + 3];
	            M[offset + 3] = t;

	            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

	            // Inv swap 2nd and 4th rows
	            var t = M[offset + 1];
	            M[offset + 1] = M[offset + 3];
	            M[offset + 3] = t;
	        },

	        _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
	            // Shortcut
	            var nRounds = this._nRounds;

	            // Get input, add round key
	            var s0 = M[offset]     ^ keySchedule[0];
	            var s1 = M[offset + 1] ^ keySchedule[1];
	            var s2 = M[offset + 2] ^ keySchedule[2];
	            var s3 = M[offset + 3] ^ keySchedule[3];

	            // Key schedule row counter
	            var ksRow = 4;

	            // Rounds
	            for (var round = 1; round < nRounds; round++) {
	                // Shift rows, sub bytes, mix columns, add round key
	                var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
	                var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
	                var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
	                var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

	                // Update state
	                s0 = t0;
	                s1 = t1;
	                s2 = t2;
	                s3 = t3;
	            }

	            // Shift rows, sub bytes, add round key
	            var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
	            var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
	            var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
	            var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

	            // Set output
	            M[offset]     = t0;
	            M[offset + 1] = t1;
	            M[offset + 2] = t2;
	            M[offset + 3] = t3;
	        },

	        keySize: 256/32
	    });

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
	     */
	    C.AES = BlockCipher._createHelper(AES);
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    // Permuted Choice 1 constants
	    var PC1 = [
	        57, 49, 41, 33, 25, 17, 9,  1,
	        58, 50, 42, 34, 26, 18, 10, 2,
	        59, 51, 43, 35, 27, 19, 11, 3,
	        60, 52, 44, 36, 63, 55, 47, 39,
	        31, 23, 15, 7,  62, 54, 46, 38,
	        30, 22, 14, 6,  61, 53, 45, 37,
	        29, 21, 13, 5,  28, 20, 12, 4
	    ];

	    // Permuted Choice 2 constants
	    var PC2 = [
	        14, 17, 11, 24, 1,  5,
	        3,  28, 15, 6,  21, 10,
	        23, 19, 12, 4,  26, 8,
	        16, 7,  27, 20, 13, 2,
	        41, 52, 31, 37, 47, 55,
	        30, 40, 51, 45, 33, 48,
	        44, 49, 39, 56, 34, 53,
	        46, 42, 50, 36, 29, 32
	    ];

	    // Cumulative bit shift constants
	    var BIT_SHIFTS = [1,  2,  4,  6,  8,  10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];

	    // SBOXes and round permutation constants
	    var SBOX_P = [
	        {
	            0x0: 0x808200,
	            0x10000000: 0x8000,
	            0x20000000: 0x808002,
	            0x30000000: 0x2,
	            0x40000000: 0x200,
	            0x50000000: 0x808202,
	            0x60000000: 0x800202,
	            0x70000000: 0x800000,
	            0x80000000: 0x202,
	            0x90000000: 0x800200,
	            0xa0000000: 0x8200,
	            0xb0000000: 0x808000,
	            0xc0000000: 0x8002,
	            0xd0000000: 0x800002,
	            0xe0000000: 0x0,
	            0xf0000000: 0x8202,
	            0x8000000: 0x0,
	            0x18000000: 0x808202,
	            0x28000000: 0x8202,
	            0x38000000: 0x8000,
	            0x48000000: 0x808200,
	            0x58000000: 0x200,
	            0x68000000: 0x808002,
	            0x78000000: 0x2,
	            0x88000000: 0x800200,
	            0x98000000: 0x8200,
	            0xa8000000: 0x808000,
	            0xb8000000: 0x800202,
	            0xc8000000: 0x800002,
	            0xd8000000: 0x8002,
	            0xe8000000: 0x202,
	            0xf8000000: 0x800000,
	            0x1: 0x8000,
	            0x10000001: 0x2,
	            0x20000001: 0x808200,
	            0x30000001: 0x800000,
	            0x40000001: 0x808002,
	            0x50000001: 0x8200,
	            0x60000001: 0x200,
	            0x70000001: 0x800202,
	            0x80000001: 0x808202,
	            0x90000001: 0x808000,
	            0xa0000001: 0x800002,
	            0xb0000001: 0x8202,
	            0xc0000001: 0x202,
	            0xd0000001: 0x800200,
	            0xe0000001: 0x8002,
	            0xf0000001: 0x0,
	            0x8000001: 0x808202,
	            0x18000001: 0x808000,
	            0x28000001: 0x800000,
	            0x38000001: 0x200,
	            0x48000001: 0x8000,
	            0x58000001: 0x800002,
	            0x68000001: 0x2,
	            0x78000001: 0x8202,
	            0x88000001: 0x8002,
	            0x98000001: 0x800202,
	            0xa8000001: 0x202,
	            0xb8000001: 0x808200,
	            0xc8000001: 0x800200,
	            0xd8000001: 0x0,
	            0xe8000001: 0x8200,
	            0xf8000001: 0x808002
	        },
	        {
	            0x0: 0x40084010,
	            0x1000000: 0x4000,
	            0x2000000: 0x80000,
	            0x3000000: 0x40080010,
	            0x4000000: 0x40000010,
	            0x5000000: 0x40084000,
	            0x6000000: 0x40004000,
	            0x7000000: 0x10,
	            0x8000000: 0x84000,
	            0x9000000: 0x40004010,
	            0xa000000: 0x40000000,
	            0xb000000: 0x84010,
	            0xc000000: 0x80010,
	            0xd000000: 0x0,
	            0xe000000: 0x4010,
	            0xf000000: 0x40080000,
	            0x800000: 0x40004000,
	            0x1800000: 0x84010,
	            0x2800000: 0x10,
	            0x3800000: 0x40004010,
	            0x4800000: 0x40084010,
	            0x5800000: 0x40000000,
	            0x6800000: 0x80000,
	            0x7800000: 0x40080010,
	            0x8800000: 0x80010,
	            0x9800000: 0x0,
	            0xa800000: 0x4000,
	            0xb800000: 0x40080000,
	            0xc800000: 0x40000010,
	            0xd800000: 0x84000,
	            0xe800000: 0x40084000,
	            0xf800000: 0x4010,
	            0x10000000: 0x0,
	            0x11000000: 0x40080010,
	            0x12000000: 0x40004010,
	            0x13000000: 0x40084000,
	            0x14000000: 0x40080000,
	            0x15000000: 0x10,
	            0x16000000: 0x84010,
	            0x17000000: 0x4000,
	            0x18000000: 0x4010,
	            0x19000000: 0x80000,
	            0x1a000000: 0x80010,
	            0x1b000000: 0x40000010,
	            0x1c000000: 0x84000,
	            0x1d000000: 0x40004000,
	            0x1e000000: 0x40000000,
	            0x1f000000: 0x40084010,
	            0x10800000: 0x84010,
	            0x11800000: 0x80000,
	            0x12800000: 0x40080000,
	            0x13800000: 0x4000,
	            0x14800000: 0x40004000,
	            0x15800000: 0x40084010,
	            0x16800000: 0x10,
	            0x17800000: 0x40000000,
	            0x18800000: 0x40084000,
	            0x19800000: 0x40000010,
	            0x1a800000: 0x40004010,
	            0x1b800000: 0x80010,
	            0x1c800000: 0x0,
	            0x1d800000: 0x4010,
	            0x1e800000: 0x40080010,
	            0x1f800000: 0x84000
	        },
	        {
	            0x0: 0x104,
	            0x100000: 0x0,
	            0x200000: 0x4000100,
	            0x300000: 0x10104,
	            0x400000: 0x10004,
	            0x500000: 0x4000004,
	            0x600000: 0x4010104,
	            0x700000: 0x4010000,
	            0x800000: 0x4000000,
	            0x900000: 0x4010100,
	            0xa00000: 0x10100,
	            0xb00000: 0x4010004,
	            0xc00000: 0x4000104,
	            0xd00000: 0x10000,
	            0xe00000: 0x4,
	            0xf00000: 0x100,
	            0x80000: 0x4010100,
	            0x180000: 0x4010004,
	            0x280000: 0x0,
	            0x380000: 0x4000100,
	            0x480000: 0x4000004,
	            0x580000: 0x10000,
	            0x680000: 0x10004,
	            0x780000: 0x104,
	            0x880000: 0x4,
	            0x980000: 0x100,
	            0xa80000: 0x4010000,
	            0xb80000: 0x10104,
	            0xc80000: 0x10100,
	            0xd80000: 0x4000104,
	            0xe80000: 0x4010104,
	            0xf80000: 0x4000000,
	            0x1000000: 0x4010100,
	            0x1100000: 0x10004,
	            0x1200000: 0x10000,
	            0x1300000: 0x4000100,
	            0x1400000: 0x100,
	            0x1500000: 0x4010104,
	            0x1600000: 0x4000004,
	            0x1700000: 0x0,
	            0x1800000: 0x4000104,
	            0x1900000: 0x4000000,
	            0x1a00000: 0x4,
	            0x1b00000: 0x10100,
	            0x1c00000: 0x4010000,
	            0x1d00000: 0x104,
	            0x1e00000: 0x10104,
	            0x1f00000: 0x4010004,
	            0x1080000: 0x4000000,
	            0x1180000: 0x104,
	            0x1280000: 0x4010100,
	            0x1380000: 0x0,
	            0x1480000: 0x10004,
	            0x1580000: 0x4000100,
	            0x1680000: 0x100,
	            0x1780000: 0x4010004,
	            0x1880000: 0x10000,
	            0x1980000: 0x4010104,
	            0x1a80000: 0x10104,
	            0x1b80000: 0x4000004,
	            0x1c80000: 0x4000104,
	            0x1d80000: 0x4010000,
	            0x1e80000: 0x4,
	            0x1f80000: 0x10100
	        },
	        {
	            0x0: 0x80401000,
	            0x10000: 0x80001040,
	            0x20000: 0x401040,
	            0x30000: 0x80400000,
	            0x40000: 0x0,
	            0x50000: 0x401000,
	            0x60000: 0x80000040,
	            0x70000: 0x400040,
	            0x80000: 0x80000000,
	            0x90000: 0x400000,
	            0xa0000: 0x40,
	            0xb0000: 0x80001000,
	            0xc0000: 0x80400040,
	            0xd0000: 0x1040,
	            0xe0000: 0x1000,
	            0xf0000: 0x80401040,
	            0x8000: 0x80001040,
	            0x18000: 0x40,
	            0x28000: 0x80400040,
	            0x38000: 0x80001000,
	            0x48000: 0x401000,
	            0x58000: 0x80401040,
	            0x68000: 0x0,
	            0x78000: 0x80400000,
	            0x88000: 0x1000,
	            0x98000: 0x80401000,
	            0xa8000: 0x400000,
	            0xb8000: 0x1040,
	            0xc8000: 0x80000000,
	            0xd8000: 0x400040,
	            0xe8000: 0x401040,
	            0xf8000: 0x80000040,
	            0x100000: 0x400040,
	            0x110000: 0x401000,
	            0x120000: 0x80000040,
	            0x130000: 0x0,
	            0x140000: 0x1040,
	            0x150000: 0x80400040,
	            0x160000: 0x80401000,
	            0x170000: 0x80001040,
	            0x180000: 0x80401040,
	            0x190000: 0x80000000,
	            0x1a0000: 0x80400000,
	            0x1b0000: 0x401040,
	            0x1c0000: 0x80001000,
	            0x1d0000: 0x400000,
	            0x1e0000: 0x40,
	            0x1f0000: 0x1000,
	            0x108000: 0x80400000,
	            0x118000: 0x80401040,
	            0x128000: 0x0,
	            0x138000: 0x401000,
	            0x148000: 0x400040,
	            0x158000: 0x80000000,
	            0x168000: 0x80001040,
	            0x178000: 0x40,
	            0x188000: 0x80000040,
	            0x198000: 0x1000,
	            0x1a8000: 0x80001000,
	            0x1b8000: 0x80400040,
	            0x1c8000: 0x1040,
	            0x1d8000: 0x80401000,
	            0x1e8000: 0x400000,
	            0x1f8000: 0x401040
	        },
	        {
	            0x0: 0x80,
	            0x1000: 0x1040000,
	            0x2000: 0x40000,
	            0x3000: 0x20000000,
	            0x4000: 0x20040080,
	            0x5000: 0x1000080,
	            0x6000: 0x21000080,
	            0x7000: 0x40080,
	            0x8000: 0x1000000,
	            0x9000: 0x20040000,
	            0xa000: 0x20000080,
	            0xb000: 0x21040080,
	            0xc000: 0x21040000,
	            0xd000: 0x0,
	            0xe000: 0x1040080,
	            0xf000: 0x21000000,
	            0x800: 0x1040080,
	            0x1800: 0x21000080,
	            0x2800: 0x80,
	            0x3800: 0x1040000,
	            0x4800: 0x40000,
	            0x5800: 0x20040080,
	            0x6800: 0x21040000,
	            0x7800: 0x20000000,
	            0x8800: 0x20040000,
	            0x9800: 0x0,
	            0xa800: 0x21040080,
	            0xb800: 0x1000080,
	            0xc800: 0x20000080,
	            0xd800: 0x21000000,
	            0xe800: 0x1000000,
	            0xf800: 0x40080,
	            0x10000: 0x40000,
	            0x11000: 0x80,
	            0x12000: 0x20000000,
	            0x13000: 0x21000080,
	            0x14000: 0x1000080,
	            0x15000: 0x21040000,
	            0x16000: 0x20040080,
	            0x17000: 0x1000000,
	            0x18000: 0x21040080,
	            0x19000: 0x21000000,
	            0x1a000: 0x1040000,
	            0x1b000: 0x20040000,
	            0x1c000: 0x40080,
	            0x1d000: 0x20000080,
	            0x1e000: 0x0,
	            0x1f000: 0x1040080,
	            0x10800: 0x21000080,
	            0x11800: 0x1000000,
	            0x12800: 0x1040000,
	            0x13800: 0x20040080,
	            0x14800: 0x20000000,
	            0x15800: 0x1040080,
	            0x16800: 0x80,
	            0x17800: 0x21040000,
	            0x18800: 0x40080,
	            0x19800: 0x21040080,
	            0x1a800: 0x0,
	            0x1b800: 0x21000000,
	            0x1c800: 0x1000080,
	            0x1d800: 0x40000,
	            0x1e800: 0x20040000,
	            0x1f800: 0x20000080
	        },
	        {
	            0x0: 0x10000008,
	            0x100: 0x2000,
	            0x200: 0x10200000,
	            0x300: 0x10202008,
	            0x400: 0x10002000,
	            0x500: 0x200000,
	            0x600: 0x200008,
	            0x700: 0x10000000,
	            0x800: 0x0,
	            0x900: 0x10002008,
	            0xa00: 0x202000,
	            0xb00: 0x8,
	            0xc00: 0x10200008,
	            0xd00: 0x202008,
	            0xe00: 0x2008,
	            0xf00: 0x10202000,
	            0x80: 0x10200000,
	            0x180: 0x10202008,
	            0x280: 0x8,
	            0x380: 0x200000,
	            0x480: 0x202008,
	            0x580: 0x10000008,
	            0x680: 0x10002000,
	            0x780: 0x2008,
	            0x880: 0x200008,
	            0x980: 0x2000,
	            0xa80: 0x10002008,
	            0xb80: 0x10200008,
	            0xc80: 0x0,
	            0xd80: 0x10202000,
	            0xe80: 0x202000,
	            0xf80: 0x10000000,
	            0x1000: 0x10002000,
	            0x1100: 0x10200008,
	            0x1200: 0x10202008,
	            0x1300: 0x2008,
	            0x1400: 0x200000,
	            0x1500: 0x10000000,
	            0x1600: 0x10000008,
	            0x1700: 0x202000,
	            0x1800: 0x202008,
	            0x1900: 0x0,
	            0x1a00: 0x8,
	            0x1b00: 0x10200000,
	            0x1c00: 0x2000,
	            0x1d00: 0x10002008,
	            0x1e00: 0x10202000,
	            0x1f00: 0x200008,
	            0x1080: 0x8,
	            0x1180: 0x202000,
	            0x1280: 0x200000,
	            0x1380: 0x10000008,
	            0x1480: 0x10002000,
	            0x1580: 0x2008,
	            0x1680: 0x10202008,
	            0x1780: 0x10200000,
	            0x1880: 0x10202000,
	            0x1980: 0x10200008,
	            0x1a80: 0x2000,
	            0x1b80: 0x202008,
	            0x1c80: 0x200008,
	            0x1d80: 0x0,
	            0x1e80: 0x10000000,
	            0x1f80: 0x10002008
	        },
	        {
	            0x0: 0x100000,
	            0x10: 0x2000401,
	            0x20: 0x400,
	            0x30: 0x100401,
	            0x40: 0x2100401,
	            0x50: 0x0,
	            0x60: 0x1,
	            0x70: 0x2100001,
	            0x80: 0x2000400,
	            0x90: 0x100001,
	            0xa0: 0x2000001,
	            0xb0: 0x2100400,
	            0xc0: 0x2100000,
	            0xd0: 0x401,
	            0xe0: 0x100400,
	            0xf0: 0x2000000,
	            0x8: 0x2100001,
	            0x18: 0x0,
	            0x28: 0x2000401,
	            0x38: 0x2100400,
	            0x48: 0x100000,
	            0x58: 0x2000001,
	            0x68: 0x2000000,
	            0x78: 0x401,
	            0x88: 0x100401,
	            0x98: 0x2000400,
	            0xa8: 0x2100000,
	            0xb8: 0x100001,
	            0xc8: 0x400,
	            0xd8: 0x2100401,
	            0xe8: 0x1,
	            0xf8: 0x100400,
	            0x100: 0x2000000,
	            0x110: 0x100000,
	            0x120: 0x2000401,
	            0x130: 0x2100001,
	            0x140: 0x100001,
	            0x150: 0x2000400,
	            0x160: 0x2100400,
	            0x170: 0x100401,
	            0x180: 0x401,
	            0x190: 0x2100401,
	            0x1a0: 0x100400,
	            0x1b0: 0x1,
	            0x1c0: 0x0,
	            0x1d0: 0x2100000,
	            0x1e0: 0x2000001,
	            0x1f0: 0x400,
	            0x108: 0x100400,
	            0x118: 0x2000401,
	            0x128: 0x2100001,
	            0x138: 0x1,
	            0x148: 0x2000000,
	            0x158: 0x100000,
	            0x168: 0x401,
	            0x178: 0x2100400,
	            0x188: 0x2000001,
	            0x198: 0x2100000,
	            0x1a8: 0x0,
	            0x1b8: 0x2100401,
	            0x1c8: 0x100401,
	            0x1d8: 0x400,
	            0x1e8: 0x2000400,
	            0x1f8: 0x100001
	        },
	        {
	            0x0: 0x8000820,
	            0x1: 0x20000,
	            0x2: 0x8000000,
	            0x3: 0x20,
	            0x4: 0x20020,
	            0x5: 0x8020820,
	            0x6: 0x8020800,
	            0x7: 0x800,
	            0x8: 0x8020000,
	            0x9: 0x8000800,
	            0xa: 0x20800,
	            0xb: 0x8020020,
	            0xc: 0x820,
	            0xd: 0x0,
	            0xe: 0x8000020,
	            0xf: 0x20820,
	            0x80000000: 0x800,
	            0x80000001: 0x8020820,
	            0x80000002: 0x8000820,
	            0x80000003: 0x8000000,
	            0x80000004: 0x8020000,
	            0x80000005: 0x20800,
	            0x80000006: 0x20820,
	            0x80000007: 0x20,
	            0x80000008: 0x8000020,
	            0x80000009: 0x820,
	            0x8000000a: 0x20020,
	            0x8000000b: 0x8020800,
	            0x8000000c: 0x0,
	            0x8000000d: 0x8020020,
	            0x8000000e: 0x8000800,
	            0x8000000f: 0x20000,
	            0x10: 0x20820,
	            0x11: 0x8020800,
	            0x12: 0x20,
	            0x13: 0x800,
	            0x14: 0x8000800,
	            0x15: 0x8000020,
	            0x16: 0x8020020,
	            0x17: 0x20000,
	            0x18: 0x0,
	            0x19: 0x20020,
	            0x1a: 0x8020000,
	            0x1b: 0x8000820,
	            0x1c: 0x8020820,
	            0x1d: 0x20800,
	            0x1e: 0x820,
	            0x1f: 0x8000000,
	            0x80000010: 0x20000,
	            0x80000011: 0x800,
	            0x80000012: 0x8020020,
	            0x80000013: 0x20820,
	            0x80000014: 0x20,
	            0x80000015: 0x8020000,
	            0x80000016: 0x8000000,
	            0x80000017: 0x8000820,
	            0x80000018: 0x8020820,
	            0x80000019: 0x8000020,
	            0x8000001a: 0x8000800,
	            0x8000001b: 0x0,
	            0x8000001c: 0x20800,
	            0x8000001d: 0x820,
	            0x8000001e: 0x20020,
	            0x8000001f: 0x8020800
	        }
	    ];

	    // Masks that select the SBOX input
	    var SBOX_MASK = [
	        0xf8000001, 0x1f800000, 0x01f80000, 0x001f8000,
	        0x0001f800, 0x00001f80, 0x000001f8, 0x8000001f
	    ];

	    /**
	     * DES block cipher algorithm.
	     */
	    var DES = C_algo.DES = BlockCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var key = this._key;
	            var keyWords = key.words;

	            // Select 56 bits according to PC1
	            var keyBits = [];
	            for (var i = 0; i < 56; i++) {
	                var keyBitPos = PC1[i] - 1;
	                keyBits[i] = (keyWords[keyBitPos >>> 5] >>> (31 - keyBitPos % 32)) & 1;
	            }

	            // Assemble 16 subkeys
	            var subKeys = this._subKeys = [];
	            for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
	                // Create subkey
	                var subKey = subKeys[nSubKey] = [];

	                // Shortcut
	                var bitShift = BIT_SHIFTS[nSubKey];

	                // Select 48 bits according to PC2
	                for (var i = 0; i < 24; i++) {
	                    // Select from the left 28 key bits
	                    subKey[(i / 6) | 0] |= keyBits[((PC2[i] - 1) + bitShift) % 28] << (31 - i % 6);

	                    // Select from the right 28 key bits
	                    subKey[4 + ((i / 6) | 0)] |= keyBits[28 + (((PC2[i + 24] - 1) + bitShift) % 28)] << (31 - i % 6);
	                }

	                // Since each subkey is applied to an expanded 32-bit input,
	                // the subkey can be broken into 8 values scaled to 32-bits,
	                // which allows the key to be used without expansion
	                subKey[0] = (subKey[0] << 1) | (subKey[0] >>> 31);
	                for (var i = 1; i < 7; i++) {
	                    subKey[i] = subKey[i] >>> ((i - 1) * 4 + 3);
	                }
	                subKey[7] = (subKey[7] << 5) | (subKey[7] >>> 27);
	            }

	            // Compute inverse subkeys
	            var invSubKeys = this._invSubKeys = [];
	            for (var i = 0; i < 16; i++) {
	                invSubKeys[i] = subKeys[15 - i];
	            }
	        },

	        encryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._subKeys);
	        },

	        decryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._invSubKeys);
	        },

	        _doCryptBlock: function (M, offset, subKeys) {
	            // Get input
	            this._lBlock = M[offset];
	            this._rBlock = M[offset + 1];

	            // Initial permutation
	            exchangeLR.call(this, 4,  0x0f0f0f0f);
	            exchangeLR.call(this, 16, 0x0000ffff);
	            exchangeRL.call(this, 2,  0x33333333);
	            exchangeRL.call(this, 8,  0x00ff00ff);
	            exchangeLR.call(this, 1,  0x55555555);

	            // Rounds
	            for (var round = 0; round < 16; round++) {
	                // Shortcuts
	                var subKey = subKeys[round];
	                var lBlock = this._lBlock;
	                var rBlock = this._rBlock;

	                // Feistel function
	                var f = 0;
	                for (var i = 0; i < 8; i++) {
	                    f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
	                }
	                this._lBlock = rBlock;
	                this._rBlock = lBlock ^ f;
	            }

	            // Undo swap from last round
	            var t = this._lBlock;
	            this._lBlock = this._rBlock;
	            this._rBlock = t;

	            // Final permutation
	            exchangeLR.call(this, 1,  0x55555555);
	            exchangeRL.call(this, 8,  0x00ff00ff);
	            exchangeRL.call(this, 2,  0x33333333);
	            exchangeLR.call(this, 16, 0x0000ffff);
	            exchangeLR.call(this, 4,  0x0f0f0f0f);

	            // Set output
	            M[offset] = this._lBlock;
	            M[offset + 1] = this._rBlock;
	        },

	        keySize: 64/32,

	        ivSize: 64/32,

	        blockSize: 64/32
	    });

	    // Swap bits across the left and right words
	    function exchangeLR(offset, mask) {
	        var t = ((this._lBlock >>> offset) ^ this._rBlock) & mask;
	        this._rBlock ^= t;
	        this._lBlock ^= t << offset;
	    }

	    function exchangeRL(offset, mask) {
	        var t = ((this._rBlock >>> offset) ^ this._lBlock) & mask;
	        this._lBlock ^= t;
	        this._rBlock ^= t << offset;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.DES.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.DES.decrypt(ciphertext, key, cfg);
	     */
	    C.DES = BlockCipher._createHelper(DES);

	    /**
	     * Triple-DES block cipher algorithm.
	     */
	    var TripleDES = C_algo.TripleDES = BlockCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var key = this._key;
	            var keyWords = key.words;
	            // Make sure the key length is valid (64, 128 or >= 192 bit)
	            if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) {
	                throw new Error('Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.');
	            }

	            // Extend the key according to the keying options defined in 3DES standard
	            var key1 = keyWords.slice(0, 2);
	            var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
	            var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);

	            // Create DES instances
	            this._des1 = DES.createEncryptor(WordArray.create(key1));
	            this._des2 = DES.createEncryptor(WordArray.create(key2));
	            this._des3 = DES.createEncryptor(WordArray.create(key3));
	        },

	        encryptBlock: function (M, offset) {
	            this._des1.encryptBlock(M, offset);
	            this._des2.decryptBlock(M, offset);
	            this._des3.encryptBlock(M, offset);
	        },

	        decryptBlock: function (M, offset) {
	            this._des3.decryptBlock(M, offset);
	            this._des2.encryptBlock(M, offset);
	            this._des1.decryptBlock(M, offset);
	        },

	        keySize: 192/32,

	        ivSize: 64/32,

	        blockSize: 64/32
	    });

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.TripleDES.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.TripleDES.decrypt(ciphertext, key, cfg);
	     */
	    C.TripleDES = BlockCipher._createHelper(TripleDES);
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    /**
	     * RC4 stream cipher algorithm.
	     */
	    var RC4 = C_algo.RC4 = StreamCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var key = this._key;
	            var keyWords = key.words;
	            var keySigBytes = key.sigBytes;

	            // Init sbox
	            var S = this._S = [];
	            for (var i = 0; i < 256; i++) {
	                S[i] = i;
	            }

	            // Key setup
	            for (var i = 0, j = 0; i < 256; i++) {
	                var keyByteIndex = i % keySigBytes;
	                var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;

	                j = (j + S[i] + keyByte) % 256;

	                // Swap
	                var t = S[i];
	                S[i] = S[j];
	                S[j] = t;
	            }

	            // Counters
	            this._i = this._j = 0;
	        },

	        _doProcessBlock: function (M, offset) {
	            M[offset] ^= generateKeystreamWord.call(this);
	        },

	        keySize: 256/32,

	        ivSize: 0
	    });

	    function generateKeystreamWord() {
	        // Shortcuts
	        var S = this._S;
	        var i = this._i;
	        var j = this._j;

	        // Generate keystream word
	        var keystreamWord = 0;
	        for (var n = 0; n < 4; n++) {
	            i = (i + 1) % 256;
	            j = (j + S[i]) % 256;

	            // Swap
	            var t = S[i];
	            S[i] = S[j];
	            S[j] = t;

	            keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
	        }

	        // Update counters
	        this._i = i;
	        this._j = j;

	        return keystreamWord;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.RC4.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.RC4.decrypt(ciphertext, key, cfg);
	     */
	    C.RC4 = StreamCipher._createHelper(RC4);

	    /**
	     * Modified RC4 stream cipher algorithm.
	     */
	    var RC4Drop = C_algo.RC4Drop = RC4.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} drop The number of keystream words to drop. Default 192
	         */
	        cfg: RC4.cfg.extend({
	            drop: 192
	        }),

	        _doReset: function () {
	            RC4._doReset.call(this);

	            // Drop
	            for (var i = this.cfg.drop; i > 0; i--) {
	                generateKeystreamWord.call(this);
	            }
	        }
	    });

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.RC4Drop.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.RC4Drop.decrypt(ciphertext, key, cfg);
	     */
	    C.RC4Drop = StreamCipher._createHelper(RC4Drop);
	}());


	/** @preserve
	 * Counter block mode compatible with  Dr Brian Gladman fileenc.c
	 * derived from CryptoJS.mode.CTR
	 * Jan Hruby jhruby.web@gmail.com
	 */
	CryptoJS.mode.CTRGladman = (function () {
	    var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();

		function incWord(word)
		{
			if (((word >> 24) & 0xff) === 0xff) { //overflow
			var b1 = (word >> 16)&0xff;
			var b2 = (word >> 8)&0xff;
			var b3 = word & 0xff;

			if (b1 === 0xff) // overflow b1
			{
			b1 = 0;
			if (b2 === 0xff)
			{
				b2 = 0;
				if (b3 === 0xff)
				{
					b3 = 0;
				}
				else
				{
					++b3;
				}
			}
			else
			{
				++b2;
			}
			}
			else
			{
			++b1;
			}

			word = 0;
			word += (b1 << 16);
			word += (b2 << 8);
			word += b3;
			}
			else
			{
			word += (0x01 << 24);
			}
			return word;
		}

		function incCounter(counter)
		{
			if ((counter[0] = incWord(counter[0])) === 0)
			{
				// encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
				counter[1] = incWord(counter[1]);
			}
			return counter;
		}

	    var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var counter = this._counter;

	            // Generate keystream
	            if (iv) {
	                counter = this._counter = iv.slice(0);

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            }

				incCounter(counter);

				var keystream = counter.slice(0);
	            cipher.encryptBlock(keystream, 0);

	            // Encrypt
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    CTRGladman.Decryptor = Encryptor;

	    return CTRGladman;
	}());




	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    // Reusable objects
	    var S  = [];
	    var C_ = [];
	    var G  = [];

	    /**
	     * Rabbit stream cipher algorithm
	     */
	    var Rabbit = C_algo.Rabbit = StreamCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var K = this._key.words;
	            var iv = this.cfg.iv;

	            // Swap endian
	            for (var i = 0; i < 4; i++) {
	                K[i] = (((K[i] << 8)  | (K[i] >>> 24)) & 0x00ff00ff) |
	                       (((K[i] << 24) | (K[i] >>> 8))  & 0xff00ff00);
	            }

	            // Generate initial state values
	            var X = this._X = [
	                K[0], (K[3] << 16) | (K[2] >>> 16),
	                K[1], (K[0] << 16) | (K[3] >>> 16),
	                K[2], (K[1] << 16) | (K[0] >>> 16),
	                K[3], (K[2] << 16) | (K[1] >>> 16)
	            ];

	            // Generate initial counter values
	            var C = this._C = [
	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
	            ];

	            // Carry bit
	            this._b = 0;

	            // Iterate the system four times
	            for (var i = 0; i < 4; i++) {
	                nextState.call(this);
	            }

	            // Modify the counters
	            for (var i = 0; i < 8; i++) {
	                C[i] ^= X[(i + 4) & 7];
	            }

	            // IV setup
	            if (iv) {
	                // Shortcuts
	                var IV = iv.words;
	                var IV_0 = IV[0];
	                var IV_1 = IV[1];

	                // Generate four subvectors
	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

	                // Modify counter values
	                C[0] ^= i0;
	                C[1] ^= i1;
	                C[2] ^= i2;
	                C[3] ^= i3;
	                C[4] ^= i0;
	                C[5] ^= i1;
	                C[6] ^= i2;
	                C[7] ^= i3;

	                // Iterate the system four times
	                for (var i = 0; i < 4; i++) {
	                    nextState.call(this);
	                }
	            }
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var X = this._X;

	            // Iterate the system
	            nextState.call(this);

	            // Generate four keystream words
	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

	            for (var i = 0; i < 4; i++) {
	                // Swap endian
	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

	                // Encrypt
	                M[offset + i] ^= S[i];
	            }
	        },

	        blockSize: 128/32,

	        ivSize: 64/32
	    });

	    function nextState() {
	        // Shortcuts
	        var X = this._X;
	        var C = this._C;

	        // Save old counter values
	        for (var i = 0; i < 8; i++) {
	            C_[i] = C[i];
	        }

	        // Calculate new counter values
	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

	        // Calculate the g-values
	        for (var i = 0; i < 8; i++) {
	            var gx = X[i] + C[i];

	            // Construct high and low argument for squaring
	            var ga = gx & 0xffff;
	            var gb = gx >>> 16;

	            // Calculate high and low result of squaring
	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

	            // High XOR low
	            G[i] = gh ^ gl;
	        }

	        // Calculate new state values
	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.Rabbit.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.Rabbit.decrypt(ciphertext, key, cfg);
	     */
	    C.Rabbit = StreamCipher._createHelper(Rabbit);
	}());


	/**
	 * Counter block mode.
	 */
	CryptoJS.mode.CTR = (function () {
	    var CTR = CryptoJS.lib.BlockCipherMode.extend();

	    var Encryptor = CTR.Encryptor = CTR.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var counter = this._counter;

	            // Generate keystream
	            if (iv) {
	                counter = this._counter = iv.slice(0);

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            }
	            var keystream = counter.slice(0);
	            cipher.encryptBlock(keystream, 0);

	            // Increment counter
	            counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0

	            // Encrypt
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    CTR.Decryptor = Encryptor;

	    return CTR;
	}());


	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    // Reusable objects
	    var S  = [];
	    var C_ = [];
	    var G  = [];

	    /**
	     * Rabbit stream cipher algorithm.
	     *
	     * This is a legacy version that neglected to convert the key to little-endian.
	     * This error doesn't affect the cipher's security,
	     * but it does affect its compatibility with other implementations.
	     */
	    var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var K = this._key.words;
	            var iv = this.cfg.iv;

	            // Generate initial state values
	            var X = this._X = [
	                K[0], (K[3] << 16) | (K[2] >>> 16),
	                K[1], (K[0] << 16) | (K[3] >>> 16),
	                K[2], (K[1] << 16) | (K[0] >>> 16),
	                K[3], (K[2] << 16) | (K[1] >>> 16)
	            ];

	            // Generate initial counter values
	            var C = this._C = [
	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
	            ];

	            // Carry bit
	            this._b = 0;

	            // Iterate the system four times
	            for (var i = 0; i < 4; i++) {
	                nextState.call(this);
	            }

	            // Modify the counters
	            for (var i = 0; i < 8; i++) {
	                C[i] ^= X[(i + 4) & 7];
	            }

	            // IV setup
	            if (iv) {
	                // Shortcuts
	                var IV = iv.words;
	                var IV_0 = IV[0];
	                var IV_1 = IV[1];

	                // Generate four subvectors
	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

	                // Modify counter values
	                C[0] ^= i0;
	                C[1] ^= i1;
	                C[2] ^= i2;
	                C[3] ^= i3;
	                C[4] ^= i0;
	                C[5] ^= i1;
	                C[6] ^= i2;
	                C[7] ^= i3;

	                // Iterate the system four times
	                for (var i = 0; i < 4; i++) {
	                    nextState.call(this);
	                }
	            }
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var X = this._X;

	            // Iterate the system
	            nextState.call(this);

	            // Generate four keystream words
	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

	            for (var i = 0; i < 4; i++) {
	                // Swap endian
	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

	                // Encrypt
	                M[offset + i] ^= S[i];
	            }
	        },

	        blockSize: 128/32,

	        ivSize: 64/32
	    });

	    function nextState() {
	        // Shortcuts
	        var X = this._X;
	        var C = this._C;

	        // Save old counter values
	        for (var i = 0; i < 8; i++) {
	            C_[i] = C[i];
	        }

	        // Calculate new counter values
	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

	        // Calculate the g-values
	        for (var i = 0; i < 8; i++) {
	            var gx = X[i] + C[i];

	            // Construct high and low argument for squaring
	            var ga = gx & 0xffff;
	            var gb = gx >>> 16;

	            // Calculate high and low result of squaring
	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

	            // High XOR low
	            G[i] = gh ^ gl;
	        }

	        // Calculate new state values
	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.RabbitLegacy.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.RabbitLegacy.decrypt(ciphertext, key, cfg);
	     */
	    C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
	}());


	/**
	 * Zero padding strategy.
	 */
	CryptoJS.pad.ZeroPadding = {
	    pad: function (data, blockSize) {
	        // Shortcut
	        var blockSizeBytes = blockSize * 4;

	        // Pad
	        data.clamp();
	        data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
	    },

	    unpad: function (data) {
	        // Shortcut
	        var dataWords = data.words;

	        // Unpad
	        var i = data.sigBytes - 1;
	        for (var i = data.sigBytes - 1; i >= 0; i--) {
	            if (((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
	                data.sigBytes = i + 1;
	                break;
	            }
	        }
	    }
	};


	return CryptoJS;

}));
var _0xod1='jsjiami.com.v6',_0x177f=[_0xod1,'woDDuHnDry7CvMOLSnw4wqfChcKtHA==','wqpew7vCrcO9ecONwrLCssKIwonCvMKEXA==','w70zwqAAdMKDTA==','aAt0CgrCnMK9woQ=','XTYsfWk=','w7YzwroudMKO','QsO2w4BqdA==','agkJTHE=','wpdKw5fDsHU=','w5lxwq3DjHTDiWw=','wp8ORMK4Bg==','QsKwK8Kuwos=','HMKZw4ZEw6c=','wp5LF2lR','asOewpcYaQ==','XS8NZGg=','wr9rw5vDnmN2NcOX','wqQoZ8KIKQ==','wq3CiiQnw5Q=','RsKnXsOLw74=','CD0SIcKeSGNGTsOJwoM=','w4ZkwqRjw5LDjcKIw4fDhsOxEAVEIcKyYsKn','w4I2TV09wo7DksKuwrkyXsOCe8OSS8OQLiBRasOuV8OQwpjCiDADJcKNWsOJXMOowoUkBj5NPiwWwrAg','w5Z4wqhlw50=','DjnDo8K2wrs=','O8KdIsO6','w504wqfCscOd','Y0NxXw92','w5Jvw5LDlsOf','b8K0fsOvaTcNw4HDlQ==','WsO+w6tHRg==','w7tIw7nDg8OyUTU3Yg==','woInRMKMKMKA','w6PDgQZLEcKE','UQDCl8K5GcOGBw==','JcKlYzTChQ==','w7x0wp7CviQ=','fMKGU8Onw5/CiQ==','J8O3QFxr','w55XwpRow7c=','w7XDmMOgwr0=','w6wgwoQ=','w7QUaWfCkw==','w5AqUlzCtA==','wqHCkgAyw4k=','w5pwwqDDhw==','BQbDlMKAwpDCoRA=','VhBRPDA=','KMKqBcKuPA==','Y8O6w4bCqHY=','NMKHQSzCgg==','M8KORMKtw4fCjh5xU8OSBw==','QcKNe8OLw50=','w7bDhw1FFw==','A8OjLGkG','w6TCmcODPMOn','w65HGSIc','RsKRKw1x','wpXCig8Hw4o=','dcKCF8Kiwpw=','OMK/JMOHNQ==','HcO7ZxoM','c8OBw7nCtkQ=','Vg9PJxk=','w7RNwpNow5k=','EMK4w51tw7Q=','O8KkZC3Cog==','UgHCmsKy','w77Cv8OhN8OO','wqLCtFnDvRVsMnQ=','w51cw6nDpcOQ','w7lrVFfDjsOx','w4lhRcKXYcKa','wrNOw6XCrg==','w55JY8KYTQ==','wq1Sw7fDhkY=','fMKoLsKtwrrDvA==','w4MsakY=','w4t1wqPCqR9cZMKRw6zDug==','wqN3D0hvH8KjMCQ/w70gBnYOZnQ=','DzcBBcKdQktDSg==','GzY+JcKU','BMOtIUca','LcKhKcO2Nw==','FcKrw5hew7p0w4HDul0jwpQ=','BAbDkMKvwp7CrR7DvBk=','FRDDqcKEwpc=','w4t1wqPCqTU=','bkNqXQV2','csK3ecOjw4w=','E8OzaVZC','w6FCw7tJ','w7Q5wqAgY8KD','6KWj6aG15pOK5peK5bS157uC5p63','d3h0ZxU=','w5Yubw==','wo4qWUE=','wqXCulnDjxAtPGvDsw==','dsODQwdiNw==','woXCqjI8','IjXDvMKuwqA=','wr1gw5HDgn97J8Od','w7pnw5nDlsOS','YcOKVjtrIMKZYMO6w4QZw6/DocO4','LMKXNsOhw6c=','wrVUw6/CsQ==','bsOzwpM=','GwsmC8Kq','w6sxEVljA8Kibw==','M8KHw5hew7U=','eghxCg==','c8K3KsKhwrfDvQ==','KMO6IR3DmF5Iw44=','wqXCvlE=','w4IYwpnCuMOQ','N8OTEgI1OcOAecKn','w7YmwofCkg==','esO7wp4Ae8Kgw402wqw=','wpxdworCvAZNecKVw6o=','I8ODBn8NUTzCpw==','woRkLwMWwrPDskvCkMKnEcO9W8OpThNKe0/Do8KUw7xUwr0Zw6PCqsKDf8Oqw5fDgw5tBBtHKljDpMOkYsO1w44KMsOAw55Aw77Cr8KowrHCkj7DisOYw4kxIDpjwpk3w6J2w6XDqcKgw6TDmCTCjcO8wowQQ07CuQJiDQZFwoVTSyHDkTrCsCTCt8K7wqbDpA==','UisPK8KCQUFTSsOIw53CglEMbg==','XcOnw6pLR1TCsmvCqsKF','w6rCjUbCvk0=','w7UhwofCvcOO','w5Ikb3zCj8ORw5oU','wqJow6BmQg==','fMKvd8Oaw5M=','w4IDwrHCrMOu','w4ElZlDClcOV','NsO9eysM','wqpTw6fCqQ==','w4bCrcOgJsOQ','cUF2WgU=','w7sowrnCpsO3','wowifcOyRw==','w7VIZ8K2Ug==','woZxw6VWSw==','wrNrEExuBsKoPw==','BcKuw4ZFw6s=','woonWcKfLsKHJg==','w75acEzDvA==','wrZ2Bntw','wrPCvlrDjRNlEGHDtCfDkg==','woogfsOOaw==','ZXlKQzU=','w6Rhw41UAA==','EMOiG3waTQ==','V8O/w7HCiQ==','w6zChVw=','Th7CpsKSMA==','YgpcBBY=','YsKGUMOvw53ChA==','cMKXG8KgwrM=','XcKyCg==','wp8gSQ==','wq9ww5TDtXY=','wqkywrzCoA==','TgHClw==','BAbDkA==','wr1gw4Y=','w4Alfw==','w7lIw6c=','wpfCqycnw5U=','wpFdw5TDpQ==','w7prVw==','woPDtGk=','HsK1IMK1','w79Ow6A=','w4ZxwrU=','VDUG','TMK6GB53wrQ=','cMKZOcKzw7FD','w6TDgwBE','ccOXwogkaw==','wpDDsmbDszU=','w4ZyMgE=','w7U8wpfChA==','dgFCMRo=','w6lNw7I=','w7LCjsOgPQ==','w4TCkRPCmw==','wpHDtGbDtSXCusOJcCdowrTCksO3','w4ppQcK+bMKGwqDDgUhawq/Cngxw','wroOf8KnHw==','w6xIw69SEQ==','ED0SKQ==','wqFqA1h2','JsKDYwrCsw==','IcO7wpNQasOg','EcOUZnc=','woRPE3l+','f8Oqwpk=','wo9uw7HDtHU=','wrYcZsOF','w6nDncOvwq8=','asOfASrDnU8=','w4rCisOvGsO+','w65XMQoO','w6/CicOoIw==','CsOWHybDpw==','QMK/DMKpGw==','wq92DUlU','w5p4b3zDgw==','wr9ow5zDong=','woUPwq3CqMO4Ag==','OcOyJCfDkU0=','CsKQAsKuIjg=','c8KZesOnw7ETI8KNbXHDpWkYw78nR2vDijs=','w6jCi8O/B8OM','HsKqw4dA','KsOpHlAj','QMOjw7FlRQ==','aUFofxE=','wqINW8KhCw==','JDcAA8KK','GzAbL8Km','P8K7C8KvHA==','wogCwrPCrw==','wrpXw6HCvcO/','w6DCmMOxCsOGW8O7wqrChMO+w4vDmDXDmA==','ZMKKUMOlw7TCgBs=','IMOwKzvDhndvw7DCoA==','wprDikPDiAM=','CMK1JsKZGA==','w6lRw7t6Bw==','wrMdacOEQUoiwp4j','J8K5ShnCtA==','w5XCiAbCjQ==','w6E7wo8=','w6d6EB8l','DjcYKcKESA==','K8KVM8Oq','wosgSX00wo/CksK4wqMydcOVVcKW','ETU9JcKm','RMO8w7zCn0M=','XMOXZw5f','MsKRw6Few40=','w5FvwqA=','c8K3Mw==','wqvCli8Sw6I=','bEN/UA==','IhIiGwctGG0GwpXCl1c=','wqxXw69cGsOgCw==','H8K8NsOgw6c=','wpwkSEs9','wpVcw5p7Yg==','wqgtworCncKEQ37CocKSw4HDpVfCi8KYw54BYcKTwqXCsMKbwqXChn8zZHkrf0zCjsKmEwt+wrfDnz3CgMKf5biI5ZOsPXjDtlwlDsKIwoLDpmwtORbCoWk=','w7IswrXCn8OW','FsKFJMOyHw==','w7vCklbCoF4R','w4fCryoyw4kpw7U6w6Viw7bDtDA=','wrvDqkDDlDE=','w415wqPCoxxJ','McKtw6d/w4o=','w73CpFTCgU0=','NcOSDnUm','w4QOwobCu8Ol','RMK1PsK9CA==','woYz5ZCFE+WzpeiFmuWIgeS5neaDuuaTmeaXpuS5puS7kemYqw==','w7U0wr4sY8KS','woowU1sswoPCkMKz','w6MybkzCl8Of','ZSwVcG4rw6DChMOtw61V','V8KGXsOrw4Q=','wrBrw6nCug==','wokSYcOAQWs=','w7YswqcKUQ==','w41Nwo/CvD4=','FBwTEcKg','I8KCKcONw4Q=','ETckEMKo','f8KfHQNT','wpHCqzwew4I=','BcOXc2lI','w6/CtMOBOsOH','NMKxw49pw50=','w6BVVMKf','I8O6Xg==','wo0hTg==','AcK5Og==','w5p0Ng==','GsK3w4RH','dcOKVg==','wqN3D0g=','w554wr0=','w7xCw7c=','w51lVg==','F8Kuw5pAw6Y=','ZcODSx1s','aR7CqcK9DA==','wrfCuls=','w6kzwqA=','AsOJSzw/','J8OyWmhL','GMKLw7ltw64=','XxMxMsKbXQ==','fMODwpY7fQ==','N8OoYlxi','wrdow6DDhlY=','EsOiUVda','w6xRwrvChSU=','w5PCqcOCNsOi','MMO8Uz0Ew4XCpg==','X8OaSil/','VMKFVsOEw6U=','JsOhHVci','XsKTPw52','acKSPCNa','wqptw5HDpHw=','woIgRUw=','wr4Ba8KGPQ==','Hz0bNcKdQUU=','w4rCukXChmM=','MMOlamtc','w6VKPAYR','wqXCulnDjxA=','UMK5Hg==','XsKwNMK0','w6xYw7nDhcOh','wrVqw5PDrg==','wok3T1cq','TBzCksK/BA==','EcOvwqDCjAR9dFPDngzDtsKjwpA=','c1xyXRI=','AcOoGGADRDw=','w7fDjxtO','FsK9fC3CuMKZw4Q=','ZcOATA1oKcKR','w63ChVHCrEk=','wqLCtFnDkQpsNg==','OMKnI8OgNyda','w5NwwqfDmmPDqm8=','wrBrw5I=','wrBVw6bCu8OmXsO3wqzCig==','fcOfw5B9Zw==','aAt0Cg==','US4J','w6N1AwMC','WsOcwrYnWw==','IcO2UCEdw4w=','VcK4HQJqwonCiw==','woZNw6R1fi08','w5fCnFXCgUI=','wprDs27DuT/CnMOD','w4tAw416LA==','C8OpEnYUZz8=','BsKvw5N5w5Y=','wrtRw6l0Ywwu','GgLDkMKPwpk=','w4jChRPCl8Kv','aUJ6UR5cQg==','wqXCsSIhw58lw6M=','T8O7cDlg','w5x6wqVjw47Cr8Kd','BBMtAcKm','cQlxFgbCusK2','f8KaNsKbDA==','w75Ew73DkcOF','IcK6w5lUw7A=','SxFkOC0=','wrVqw5HDpGtVMg==','Uw/ClMKtKw==','w51Sw53DmcOR','wr9rElpi','6LWS5Y+A6Ky46au6','dD3CtsKUGQ==','VSMg','BsOnW3Y=','w499wrzCvw8=','acKiH18=','VMKXGihh','wps2VA==','dsKiOcK2wqDDqXk=','P8KZPg==','w7h4U8OD','XA/CncKxFA==','HhEkN8Ko','wp1Bw6Y=','w6XDgApSAcKRwrM=','bUN6UQ==','woLCmXQ=','BcKzdg==','LDkWNcOF','wqZQw55laSomDw==','w4V4wqB/w4LCicKWw5Y=','wp7CgR/ChMKuY8KND8Kr','O8O8ISjDnQ==','FiEaKA==','w6TDiwpMEcKPwqw=','WQTCksKk','wqgofMKMOQ==','S8Oiw5/CvGA=','dMKGXsOsw4LCjxQ=','wrbCul7DlhFpPmg=','SMOqw7Q=','dsKmLsKl','w4xoRg==','woAKwqnCpQ==','GwzDg8KD','P8KaPcOkw68=','wrN/Fkw=','EMOVenFYOh4=','w4ltQcKa','wqR7DEluBsKqNA==','wrFQw6F+aQ==','XA/Ch8K9','w7rCmFzCoF4=','LsOsKivDhGBD','Y8KGSQ==','QMOhw7/ChUE=','TcOjw7VbXkE=','w6HDlcO1wqU=','wrZew6N8biwm','w6LDhsOuwrEk','fxV6Bg7CqsKo','LsKcKQ==','YcKzO8Kwwrw=','KsOMd39W','Y8KXXMO0w44=','fsK4EcKeOg==','JcO6WSsE','RMO8w77Cr0FtJFY=','w7HCksOh','wpLCsCI=','w7DDhsOt','KMO6Ng==','X8K+Ig==','fMKKU8Or','wrNXBX9D','OsKsPg==','T8KzDQ==','w4VWw5DDicOH','U21OcS4=','dMOSw4DCtXk=','IMO2SQcfw4zCrg==','XsKsDMKDwoE=','e8OOwoYsbQ==','w5bDmsOnwosc','wr7DtVjDthA=','wp4Yc8KxLw==','ZMK5FMKwHA==','CsOtFirDtg==','w7TDgS5tLMKywrPClX46Fg==','O8KHw4tI','YMKKXg==','RTgW','w6rCkkQ=','wqlSw6s=','w7sywqc=','VzkR','w4F9wqxj','w4t5Jg==','w4puwqI=','5L+25ZCd5Liu5bGm5YuH6ICX','LkF7WQlhXW8SwpDCgBBaYm1vZ2vDs8Knwo7DkHM4wotuIA3DhsKE','wqDCpywDw6A=','wq9Tw4/ClMOA','w5bDmRlNFQ==','wqFew7lQE8OpGC0gwog8wr7CtGxTARlYw7IALHXCkDVWwofChsKIw73CljvCuh7ClHQtw73CpRHCqcOwacObMRx3CcOKUx/DjMOmwqkJw6k=','w4lxPA0N','wrnDh8O1wr04w7TDsMKHwosUw5zDlSjDmjggMsKLwpFzwokUFg==','w5DDsWXDvSPCusOLfiU1wrrCnMKxHcOCw6TChhPDusOaw7UMw5EJbsODIh4=','ayzCvsK4Nw==','woRkLwMWwrPDskvCkMKnEcOtXMOoTQhLcA==','wrg2Q8OYQQ==','wqs0XcK6EA==','K8KkLMOqPTk=','TMK6GB4=','w6ACRlvCtQ==','esOzwqMsdA==','wpHDuXrDsCbCqg==','WsOnw71L','c8K2OMKAwq0=','wrQDXnIP','EsKgfSvCpw==','wrBsDVhqMMK/','w5hnwqY=','wrZqFl8=','bsOKw5rCtks=','w7XDmMOgwr0xw6M=','BsOqBn8NUQ==','FcK6w7tIw6c=','w5XCtkLCmEE=','wpV6w7rCicO5','w6TCmcOUK8OS','OcKyGMOwOw==','w5EiwqABVg==','wq3Cnn/Dhgk=','HMK6BMKwMA==','CsOMFUIU','wqYReEkM','PcOxIjnDmFp4w5HCjV9A','OsOuIDvDkBJIw4nCmEVdBwV2RsOQwp4=','bMKkBcKiCg==','cEB/TQ==','wqMKZW47','w6lqSVTDmcOt','SsOqw5ZKSg==','wp0ze1rChsOUwoQUJgDCsQPCtsONwoLDoHxIEUrCpWBTw5DCjsKSw5QRw7/DrMKkwqfCucKCPMOhLn80XFLDlF0=','wrkfbsOCWA==','c8OiWCpj','csOKWgo=','CDcNMg==','YcKiP8Kv','XcKiDRU=','wpkEdMOUVA==','TMO+DH4cRDjCrBwxY27Cvhl5wpgbOy7DmCEWAQ==','OMKsHMO3IA==','w6HCmWTCn2k=','w4tTw4tqBw==','w4bCgDbCkMK/','wporXsKHOQ==','LMKQw4Njw6c=','wrpLw6B9','dEVqWAM=','DzsR','K8K+JcORGg==','w5ZwwpBiw44=','OcKnKcOq','RsO3w7TCs11gNlw=','E8OlOXAt','asKIVcOVw6E=','w5cpclbChw==','N8OsA1I0','WMO7w4NDfw==','PsKNHsOjw5g=','w7AkwpPCh8OFUw==','w5bCjQM=','w73CnknCpkg=','woDCtj86w5Q=','w5t1wrfCpQ4=','PMKqK8Oow4U=','M8OOKTrDoA==','w6NZLSIJ','NsOVOVQn','wqbDmMOowqo/wqA=','M8KPVMOuw4DDkFJmT8OfA8KTw6Vr','CsOrPWM8','GwLCmsKyCsK6TcO4fcOTCCU=','w5d7wqV/','w4wfwqwxSA==','CMKqKcOrKQ==','w43DpMOCwqwS','w554wqDDink=','HcK4I8ObLQ==','EQLDgMKJwrjCrA==','MQAMJMK3','H8KuKMO8w5k=','w7kUwoY7SQ==','E8KzdjvCnsKb','wpRpw7HCvMOR','X8OVw7vCmEQ=','Q8KKEcKQwqA=','wp3DumPDvzI=','w4N3wqbDng==','cwnCq8K1Lg==','w4FZUcKPQQ==','wqfCulPDhyxu','wo8xbXUZ','EsOCcXZYOBU6','UjkXb2ITw6vClQ==','w70ZwoLCjw==','w5AUY2nChA==','bMKUNcOvw7FHb8KGKX3DoTNDw7M8UX3Cm3gQccKLw6NbfcKgY8Kt','wqBXEUNT','LsKIKsOrw7tK','dMKCU8Otw54=','wrN7BA==','w5PCjQPCkcKo','w6A7wpo=','EcKzfDPCtsKew5Q=','acOfQx1uMcKN','dMOCwrEBTA==','5pC35pWo5Zq85b2J5ZCv','w7HCklHCq1g=','wp/DvHnDqDM=','wrRNw6RibzA=','wrVaw7vCqsOn','wqN3D0hF','wr5Qw6x1ficlDcO8Vk/Ds1PCkA==','PsKmKcO2PA==','DDMANcKX','w7TDhwRFDcKRwqPChmMx','wojCsCE=','dcObSxNi','w7NqRV/Dmw==','WsKLDcKowq0=','w6NGw7BJFw==','Z0lq','w5HCgBXCgsKX','EAvDq8Krwqg=','w7Y3wqc9dA==','wogwQ8KYKMKb','w4LCgRM=','RsOfw5FeSA==','bE1tQBU=','GzcB','SRcCUUw=','wrHCt1bDmxFpPmg=','Z0lqdwl8TysH','w5bCqsOtNcOF','wr9ww5zDrHY=','L8OxNzPDlUtvw5TCgUk=','w5pxNBcSwrbDvlc=','E8Kqw6VUw6g=','w4ZyNAoDwrvDvlfCgcK0WMO/QMOmcgBLc0/Do8KU','wq59Nk55','woV0LUxr','6KWj6aG15baV5YSy5aeA5bCg57iC772w5Y+l5bKy5Lmv5oOl5pKn5pSt','w51kVMKfQw==','TMK/IsK/LwBAw5lrwqhVNw==','wrcnX8O2QA==','wqPDgxANFMKOwqbCg346Fg==','bMO/wp0CeMOo','asOqwrsOfg==','wrHCt1bDmw==','EMKyGsK2Dg==','JAoFMMKX','wrYaWsKdOQ==','w51gVMKCZcKR','w7DDgghZ','aQUEeA==','w7DDjxxTHQ==','V8Oyw6XCg1Q=','w7Y/wroi','PcOGTFR0','w4J+w6JZ','BcKzZy3Csg==','S8OIw5VrQg==','OcOmUD4=','YsOKRA==','wpAtchLCj8Ofw4gDOxrCvw==','w7kfbsOPWDE=','6KWr6aKd5beH5YS95aSH5bOS57in776o5Y2V5bCo5LuX5oGP5pOo5pSq','w43ClRfCncKf','K8KXOcO7w7hLb8KV','wqV7D0JsCg==','w6UDwrTCpsO3','wq1ew7DCqg==','YMOrw5JeRQ==','w4d5WMKL','csO1wpMMesOkw40+','fgNtHho=','wrRCw6TCt8O6fQ==','wrxaw7Vl','5rqZ6aa35oyZ56aT','wqBOw61ZBsO9VyQtwoo+wrjCon1VRwVawrhdNGTCmD0=','w4zDoRltIg==','w7R6D1l/F8Kz','55iZ6ZuB5ZG45ome6IKR5Y+55b2g5bqAACxm44OzzILjgo48','ZMKRRMOzw47ChA==','wos3Uk0o','woPCrSkmw4A=','wpNcw6rCj8OY','w5dzwpVWw4E=','KsKrH8KyBg==','FMK1w7pAw5U=','TsO8wpkaRg==','OsKVAMO9w6Q=','QMOMax9U','wqUrbmk0','w4rCpVjCg3Y=','w61mQF7DgA==','wpDDqHjDriLCvcORTWE6wrA=','MjMQIcKC','EcK/w6Fcw64=','KMKZEcO+w6Q=','fcOvwoIfa8Ojw5YEwqPDvcK9','wqoScsOSVg==','5YmJ6ZGn6K6P556F5bWn57u95p2e77+t6K+z55mk5b+b57qs57uV5pC65pWr5a6u5pW56KSx6aKI','5rmm6aWQ5o6K56a0','c8OjwpwEYMOm','UzsbIsKXVQ5aR8OKw5/CmkMad8OEHsKqw5AjwpJLIBp6OQ==','ecKMFcKiwrI=','w45afsKtSg==','U8OEw6lDUQ==','RykXbm4Sw7HCssOPw6lE','w6o3wqE6ZQ==','SsK+KMK8IjpM','JcKbw6Nlw7I=','w7xPw6LDg8OjRg==','w4UnwozChMOP','w7HCpcOmKsOH','woAqXlkswoPCkMKz','w43ClgLCkg==','PcOrRRoq','D8O+GnoCQw==','woc3Z8K6Kw==','RcOhw6RPRk3CuWQ=','w63DhsOkwqI=','w4B1WcKSbsKI','TitmIwg=','UBzClsK6','w4hKbXLDgg==','w51mwqXDgGLDrQ==','YsKrO8K9wq3DsGDCug==','5pCo5paK57mS5p6b5ZSywqzjg5LDjg==','w7Z8Qw==','TsOzK8Og','5pKJ5pWi57q25p2D5ZWtQeOCh8Ob','WQ7DgcKBwp7CsAzCuAwQHSIaY3J3w7DCqMKWNmBGU24taBJyw54J','w4HDoTnDoHbCr8KVZTw=','UcKdCsKuM09aIsOf','w5Evb0Y=','w4oGwrjCqcO2CcO7wp3Dg2J/SV47w5ttw74=','wqPDggZBHMKIwqnCgDo2Hik=','aMOIwpEsTw==','KcKHGcOFPg==','worCqis=','VsK/a3PCu8Kaw4Baw5nDmMKw','wqZEw6HDncO2Tz0gYMKKZEzDmsOKEhN+DQ==','wqnCnsOpIMOZWw==','fcO2wpkOZQ==','XMK/IcKwL0JCPsKABcKvwoXCn8Opw6dnDw94w6VFwqnDuMOH','w5UUwpw8Zg==','BMK4XgfCsg==','H8Knfy4=','DMOCYmE=','QzkRWWcZw6jCg8OIw7Bjwo1VdA==','w6xLw6peCA==','CsKYKMKNCw==','Xj8heGM=','w4fDpjlqEA==','c8KdZA==','wpFuw7vDr1I=','BMOlw7/ClBx1LFvChhU=','BcOXc2BfMw==','woohMFDltpTmkbLmlq3oh4E=','w5Zgwqhrw5M=','772D57if57q35LqE5q605pKD5pS/77++ODDDq3UEw7N1QWHClmoadsKJw65bfcK1NMKxwobDrcOJSMOPQzRj5pqSPMOFw5MiHMKsw4/CpsOfPBA+w7c=','wpPCvi8nw4Qlw6oA','w4V4WMKX','VcK4FwJgwo7CucO7w5s=','wrtww7x+Qg==','w71afn3DjQ==','wopSw6NQTw==','wo5Lw7HCvMO/','w4Flw7RNGg==','w54mwrMYdg==','S8OdwqYheQ==','w7clwrM=','w6FJwoTDpGc=','w5ouZVrCkcO4w70qHg==','w4/CuULCqUo=','w4Upb1rCjA==','YsKrO8K9','w41uBS0B','w7EmRG3CtQ==','BQbDicKDwofCpw==','TsK4J8Kof01PJsOeHMOnw4rCgsKgwqR4ERcswrhDwr3DrMKaw5HDucOnwoLDgcKFwq4WwpkRLMOUGB7CmDRVfy3DnlYCwpPDmcOpw5VxbMOLwovCssO0IV9oDcKuw5oOw4AXw4DCrGzDrEVpKcOIwqvCsizDniXDomMWZlPDjkjDpnrDrVbkua/mrZ/nnIHliavDsC3DmAgLw6xHw7hVwr/CmMOHwp7Djg==','wqHCiz4iw7w=','w5DCnlzClms=','w79gR07DgsOtJHs=','w6HDnhlFFsKF','a8OZw6h/Rw==','wqPDmE/DpRU=','O8OpWygT','KMKPPMKxCg==','I8OgR3xQ','w45ew6LDlsOF','PcKdN8Ohw6NL','AcOyBGEJRi3CgRAuKw==','PAnDoMKdwrY=','wq9Sw6zCu8O7','w4/DjsOowrEd','w7J+w7zDiMOn','w4EBTVbCtg==','wrvDrG/DngI=','W8Orw6pBREE=','bgjCtcK3GQ==','F8KjYQbCgQ==','VjkIc30Zw4bCisOHw7dS','UGh8ZTU=','VDAEZQ==','B8KuIg==','woRwMAMJwq3Dqh/ChcK5XcOnGcOwSABV','ORsAFcKG','w5MlwoQQVg==','w5hiZMKwcg==','wr7CmC8nw6I=','wpcOwrjCrw==','akZubBE=','Z8OzIDPDm01CwpDCnEBSGQVuRMOUwoB5wqXDp2Uzwo7CvDJbwodVekU=','wqBaw6B+bSY=','w5N3wqzDimfDo24=','WsKgG8KlwpM=','wqjCpwM1w50=','dgsEXnM=','KBsjD0/CicOjwp10wofCv8OKYQ==','w7jDty9hIA==','wqFew7lQE8OpGC0gwog8wr7CtGxTARlYw7IZOmLCnCJRwovDhMKQw6XCnic=','w6/Cok3DjxVsMnTDsCbCjMKQAghGw6bCosKPVm7DncOawrTCvUfDmyQ2w4Fy','wrcvwpHCgsOXXm7DtcOdw5Q=','asO0MDPDhEtSw5DCiQ==','wr4AwrvCh8ON','w4jCqsOSCcOC','wpV3w6XDmFI=','w7wkwr06dMKV','wozCuic3w4Q=','FDcUIsKG','IcKwIsOrw7A=','RcOvw7RaQQ==','IsO9TTk8','wrYSdMOVRw==','Yh4QUWk=','CsODMFEg','w55SwoZhw54=','a2pZUw4=','w59BVnjDjQ==','wo0hWXs0wovCjMKu','w5x1w5DDvMOS','DsKPD8Otw5Y=','R8O9w6FmWw==','w5x0wqvCrwFJZA==','N8K5w6BPw7A=','wrQFeMK+Jg==','w5luZsKxYw==','YsK5TMOrw4U=','wp8tdW0c','dwlzFhI=','BsOLPwTDvA==','w6VUOgIM','RMOdwqI4dA==','MMO/VC0A','M8OfWV9X','wrMcwovCrsOM','ZMKXM8KIMw==','w74Gfm3Cmw==','w5HCiwDCk8KrdMKrEMO3w4cm','w4zCtyXCpsKO','DMKeEcO8w78=','bgZ5','wqpew7w=','w5x8OQ==','UsOiwrULYw==','w7ZVw49/CQ==','w4l1MA0NwrrDtw==','woDDuH4=','w4/CkQrChA==','TDkEeA==','wp1VEEp7','w4HDrcODwrI2','GsK5L8K6','NcKkIMKZOA==','w7JVwrJ3w6A=','IMO2SQ==','w4PCsGLCmlY=','w6bCmcOhDMOGX8Olwrw=','X8K+HAR5wqPCiQ==','wr0Uf8KfNQ==','ccKrM8KnwrI=','w6Iowo8=','w6V6wqLCoi0=','OsO7MQ==','DsOmKxnDkw==','RMKDFSx+','w4AwZ1bClw==','w6NIw6Q=','w5t5wqzCuQ0=','FAzDisKfwp7CrhA=','SMKkGAR3','wrkcacOSXG4T','w6DDjMOiwqEkw6XCucKcwpw=','FcKxw4Rfw7B2w5A=','wrfCpQkDw54=','BcK7w54=','Z8ObVgw=','eMKGXMOkw58=','LsKMLsO8','w5x+wrrDnQ==','w4I8R1UowobCnsKkwqg0GsOfecKGEcOAOioMdcO/S8OQwo7DlmNGf8KNWsOTV8Kg','w53CjSzChMKN','SxrCmsKxBA==','wpTCsycqw4Qlw6oA','w5HCpVPCo28=','w5Nmwqh1w4LCkw==','GcKOLcOXw4U=','ZcO/w45gdQ==','w55RGiwC','wqhhw43DtQ==','w5HCgR/CgA==','wr97A0lu','TMK6GB5mwq/CgMOT','w4JuVUzDqw==','allzRDl1','VgHCh8K1AsOs','5Y6q5bC95Lqy5oG26LWn6L+R54uk5bOf','AcK7fzvCiA==','wr7Dnn/DjCI=','w5wxR1vCpQ==','w5F5wrbCuA==','fMKhFcKNJw==','wp7DnEzDtjc=','IcKOw7pHw7Q=','UcKlHg==','6K2C6L6H5Yak5pyP5pe+5pSW6ZSP5ZGs776z','fMKCTsO0w5g=','QMO+w6xMZQ==','YMOyw4LCqXQ=','AQrDgMKJwp4=','w4HCkRXClcKzeMKHEg==','SsK/HQJ9','exJnARvCm8KkwrUvwpbDrw==','wpYFacO7QQ==','N8KpPsOnBz9Ww40=','JcKWFcO8w5Y=','GwLDl8KYwoU=','USbCocK7Mg==','AMOLDkQU','wrZ9w6TDjkI=','w7XDnAU=','w5tlUcKebw==','w4vCgR/CgA==','esKvUsOjw4A=','w4HChQnCmcKyesKd','fMKmN8Kh','w4HChQnCgcKq','RWh8XB4=','LhgwPMKh','wpDCuj4n','w4VwwrFrw7s=','wokkXlA=','OsOLAh1rJMKHdsKpwpI/w7fDhsOxwqYkw61lw7rCsmQ2PMOBwpTDmjXDvcKgw6k=','GlDDj8KwCMK3','w65Sw6nDncOnVwgwaMKd','QH0ZL8OMEUxDD8OOwpnCm1waOMOJ','w4/CsmbDtXnDr8OJcCgjwrzCkMKmHMKWwrXnl57miYjvvoE=','IsK1wpwEMMKxw445w6rDs8K0woUewqTDgcOBd34VwoVBwr5TS2vDisOyPMOJBsKIwonCrUbCl8Oiw4zCvMOoeTp2fsOZwqLDpMO0wpTCnX7DrQ==','w4NHw7o=','OcK2w5c=','UsO7MGDku6nmiZDCnRHDnMOfw6lzw4fCu8Ka','A8O3BnYCTA==','wrxpw7DCscOW','w7dSw6vCscO6O8Obwos=','w7pYw7bDn8OwRg==','wrtBwqvDjMK3X24lMQ==','wrLCim/DqgY=','A8KzfivCsg==','6K2j5Yq25Yyy6YOq5pWE5oSl5LmT5YSZ5ayJ77696KWN6Iy15oGa55m55b6V5biL5YaU5a2L','5LyE5ZOC5Luj5bCz5YqR6IGw','55qf6ZqZ5ZGI5oie6IGN5Y6d5b6+5biww6xswqvjgbzOnOOBhQQ=','GMK4OsK1JQ==','ZMKSUsOCw5I=','a8O9TTxg','J8K2w69Vw4c=','dcKFKcKzwrs=','w7fDnS9HKg==','wpTCuRMnw5s=','6Ky25Yik6aKm57uj5pKo5L2c772S5Y+c6YKU5b2t5bu06Z+j6ZaT6Zuo','wrFTw6RycA==','wo7CqSEiw4M=','wo0MTFww','w6zCusOuGMOp','dcKxN8O+dTJFw5DClcKiCUfDkmXDk8KfwrnCi8OZHsOXEMK2Zw==','w7Fbw6Blfjs8','w4RmwrnDjCzDr2TDpXN8','w5rChlTCm0k=','KMOWWBN3KcKVfMOxw4J2w7XDh8Oxwr4qw7Y8wrvCqHI2asKIwo7DlHU=','w75SwoPDs0g=','PisUKMK5','MMO8USEZwonCqmc/w4ZE','wpDDsWPDvyw=','w4ZBwrtDw6Q=','fQ4tXWg=','ZcK3e8Ohw4w=','wqpLw6TCt8Og','bElwUxJ7','w6NCw61aF8Ot','w4RsGC0s','woXCqzIh','w4FrXHHDnA==','woHDmnDDjik=','wqDDt33DuDA=','wo9ZAGtv','VcOywqY3WA==','wrZuw6TDhF0=','wr4ec8OYQ2c=','SMKCKcKiMg==','dsKMU8O0wovCiBFlT8OI','IcOURxwF','w4vDnMOkwqMT','fjYHUXw=','wrByw6pbeQ==','dMO5w6fClEY=','asOowokea8Oo','CcKmO8O8Fw==','w6hVw6xIE8OaAQ==','wrQoSMKmKw==','WsKvCsKowpU=','PsK2w7pAw5M=','cMO/wogZ','CcOQdEZ+','wrzCmCQVw4U=','wpEbUcO7ZQ==','DcK9VD3CgQ==','AsOoekJX','wqJdw6p7YQ==','GMKhdQ==','TsK4P8KqHQ==','w7xQw4pUKQ==','LMKUM8Otw74=','DsOTJj3DrQ==','SgljHDE=','McKxw6xjw7w=','w7xSw6h8dDExRcO4W0rDqwrChhvCqGMPXsOdCHYhw4QsD8OHNMK6woo=','BcOiAlYATTTCsBc3DHHCghE=','wrsHc8OT','N8O+STcbw4w=','wrFMw74=','MsOnSTw=','VzUfeQ==','ZsK1I8K3wrzDvA==','w5dtwqbDnHw=','NMOhUjsbw7bCuw==','A8OQYFx2','w77ChV/Culw=','w7k6woQ=','w4t8b8KNaQ==','w5zCsyjCgMKL','EsOlEXkW','w7B3NyMR','V8OZWDJd','w6QswpPCnsOA','w4JzwpZhw4Y=','c0l/RgV7','TMK0Hg1o','XcOWw7JbWQ==','wpcwTcKcFA==','w4FpW8KcdMKL','MsKmKcO2IARZ','ST0ialw=','I8KdNMOpw6FG','dRRy','Vg9wFDk=','LcKqBMO1Pw==','KsKxF8OUFw==','wr8Lb8KmOQ==','wpYOwrDCq8OvHg==','XQsqaEc=','w6vCmMOrKMOeVg==','Sz3CqcKMNw==','Tj4BXm0=','w6VOw7w=','6Ke36L2N5YeP5byV5buK5Yaf5ayM5Zek5Za2772P','ZMKIJ8K+','wqlaw73CrcOx','w51gVMKC','wqJew7hifg==','w79Gw7ZOBg==','YcOKVg==','D8KKw6l6w7A=','w4xDwo5yw7o=','wqkWacOFR2sbwrY=','w5fCuMORGcOY','w4FlwpBxw4I=','F8OtHEs8','ESES','F8K2w7J2w74=','EsK/w4RBw75xw4A=','wrLCvlnDhg==','AxHDjcKLwpbCpwc=','bMOdwoo/YA==','dcO/wokJYcO6w4w=','woTDu1jDkAA=','HMOjTgE/','UynCmMKLIg==','w51nQGzDog==','F8KyKsK7O2ZCKcOJA8K/wpo=','w6XDrxxLIA==','UQDCncK5E8OBNcKWQg==','LQnDvMKHwok=','dcOKRxU=','S8OLw5LCvUM=','w5DDiRhRLA==','W8K+ey3Co8OYw5JWw5/DgQ==','J8O6UCs=','w54+G8KXbsKUbMOvag==','B8K1J8K0Jj1Kw4IiwqpFKA==','wrQywrUnbcKTSlrCsFzDkcOkw4M=','w5t+wqLCrwZFY8Kb','cMKZOcKzw7JLdcOHbXvCsw==','R8OOZx1S','YcKBIMOjw6VCYMKYYW3CoydRw6QhD2TClHYHZ8KFw7ROfsOoIcKqwpLCsMOPXMObVmRww455wpfDni8cwqvCncOq','RMO/w7nCk1o=','6L2S6Kej6K2O','w5InFA==','w5jDsCNt','XMKlNMKzL0JCPsOIHcO3woTChsK2wr06Cg1uwqY=','dyrCnMKQMw==','Tl5ubgc=','w7ENXE/Csg==','fcO/VD0fwoTCsGEgw4Q=','F8K0w4tU','w4xda2rDjQ==','SMKhLw==','w5VawozDk2g=','KsK+LcKIBg==','e8Kvd8OGw4o=','fD4GSlI=','YBsqWm4=','Y0N6UQ==','w6BvIBkE','w6c5wo/CgsOQ','N8OyUyMew4LCtg==','FsK9IMKrMg==','ZMOUwqkCSg==','wpggRUw=','BcOGcGZC','F8K9LcK2','SwfChMKPwp3CowbDpkFeGDpZeXV9w7XCqcOZM3xTFSc3ZlJ1woxT','wrwcdcOMUnYiwroCMg==','GHMJdTVAw6nCj8KGw7BIwoBwdV4j','b8K8USdVwpXCr2Bvw4dZQcOawp0Bw7Hnl6LmiJDvvrw=','JwA5','woLDiEA=','w74SwqrDoOS6quaKs8Kfw47CqsKOw4XDocOMXcKg','VcOAdw1l','IcOBdgoD','w6dRwq/Dpks=','wq9hw5DDqg==','RsKaAz9n','wpwGwpDCjMOs','BsK5NsKq','ZcKQWMOyw4XClBI=','w7lnGEBqA8KmKDUowpgoBnQNLnYDfMOIworCnQLDsnXChQxfwpjCucOjVzTDrMOJw5FnScOjw4N0C3VBwpIALArCucOQw6vCscKNPVHDkiPDiRBkw6Ibwoxyw4vCszR3wqYMw7PClA==','SgNGGA8=','wrt7DEpuBw==','wr0iX8OZWA==','eRdlFhDCkQ==','EiDDlMK1wrA=','J8Kzw4V2w54=','wrRUGk9p','MAMtC8KF','w4rCmnLCoWc=','wogpd0oK','E8OmTW5f','JSfDs8KcwoQ=','w4HCh0XClmk=','w5E4fl3ChQ==','YApYOws=','w6Yswo7ChMOSTw==','WMO2w5ZcWg==','DMKKAcOEFg==','5oGw5oag5YiV5bCx','ITTDtcKAwqY=','AC3DicK2wrU=','6L2a5rCo6L2Y56eO','6LSf5Y+J6K+16auZ','5Lqe6Lu35pWe5Yen','5L2b54ut6Zq656Sq','SsOhw6lIW1bCuw==','cMOfw6PCsWI=','5Lql5oqq5byd5bmu','wpzCrwQHw5k=','w7BjwqZfw4U=','TcObw6hkZg==','5Z+Y5Z+25biy5ZOZ','w4I2TV09wo7DksKuwrkyXsOCew==','wq0rXE0a','H8KLw4JVw7M=','w7Aowo3ChsOR','ZsKoPcKjwrXDvE7CszDCpTc=','w5ltMAsCw7LDoEbCgcK8UsO5GcOoSgRL','w6tGw61QFg==','bsO1woMZUcO/','6LeX5Y2V6K+s6aqs','IMKJw7tAw4g=','WMK3Fwpn','w7XDm8OywrALw6M=','5Lq66LqH5pSl5YeP','w7DDnR9CHA==','w559ZlnDpA==','JcKNN8O+w4pI','5L6r54i16Zmg56as','K8KZNMOjw6A=','5ZyE5Z+D5bu65ZCF','BsOmGH4Z','AMOGbWhE','wqLCsycQw5g=','TMK5ChNNwrQ=','A8OJbAEg','w7bDncOl','P8KXKcO6w4pc','5Lq+5oiL5om55Yq/77255oe+6LOl5oGP5Lit5a+c5ouV5b2o5bqu5LyT5Ya+5LuT6LWs542k','VMKpPcK7LRM=','woPCkALCjMKzLA==','w7UjwoLCkw==','by3CvsKtJQ==','wqZPw71bdQ==','e8KfECVL','w4LDvcOowoYN','wotVw6vCkcOh','w6TDhMOo','aT7Ci8K4Ng==','FcO9dRQG','HMKtw4VC','w6rCjsOi','dsOSw6PClFU=','dA57GA==','w51gVMKCdMKKwqDDgQ==','SwvCh8KUDsO8E8Ko','BhYhB8K7','F8OCcHZYOBUaN0DDk8KqWSY=','VzkRVX8Zw6g=','HsOjV0R4','wqA3U8Ogeg==','wqbCkygcw4I=','EsOrw79eW1bCs3nDow==','AcK9VRPCg8Kmw5VMw5nDmMKw','dcO/wrkDdg==','GcK5B8KwJw==','w6LDkcO1woE4w7TCvcKWwpwQw7vCkUPDig==','RzMKd2IZ','wpVSDGJo','w4VPQsKQeA==','w6d9wobCuSg=','wq8swpvCm8ONWH/Dr8KN','w4oYwq3CocO8H8Kvw4PDh3p3XhQ=','w7QKfcOMQ24XwqoKJVHCv8Kiw5vDiE1iPsOzw7jDglZFwpjDnMOUdcOvwqcjw5cKwrcTBcONXkshwrsxwqNUR1YDD8KJwq3DkcKnXMKyw4xj','RzAMf2A=','f8OJw6RERA==','AcKYw71bw74=','W8KXaMO5w4A=','xjVfsYjQiantmiL.comE.v6khYAg=='];(function(_0x16a432,_0x40a355,_0x51aa81){var _0x26162d=function(_0x47d49a,_0x129a6d,_0x35946a,_0xd5cd82,_0x5c982b){_0x129a6d=_0x129a6d>>0x8,_0x5c982b='po';var _0xba1d13='shift',_0x30b42b='push';if(_0x129a6d<_0x47d49a){while(--_0x47d49a){_0xd5cd82=_0x16a432[_0xba1d13]();if(_0x129a6d===_0x47d49a){_0x129a6d=_0xd5cd82;_0x35946a=_0x16a432[_0x5c982b+'p']();}else if(_0x129a6d&&_0x35946a['replace'](/[xVfYQntLEkhYAg=]/g,'')===_0x129a6d){_0x16a432[_0x30b42b](_0xd5cd82);}}_0x16a432[_0x30b42b](_0x16a432[_0xba1d13]());}return 0x5214d;};var _0x2f7e0c=function(){var _0xc2cbe={'data':{'key':'cookie','value':'timeout'},'setCookie':function(_0x1fa095,_0x11e7e8,_0xeff428,_0x6b061a){_0x6b061a=_0x6b061a||{};var _0x1e160d=_0x11e7e8+'='+_0xeff428;var _0x9f33c5=0x0;for(var _0x9f33c5=0x0,_0x5c5fa8=_0x1fa095['length'];_0x9f33c5<_0x5c5fa8;_0x9f33c5++){var _0x1b6442=_0x1fa095[_0x9f33c5];_0x1e160d+=';\x20'+_0x1b6442;var _0x4308af=_0x1fa095[_0x1b6442];_0x1fa095['push'](_0x4308af);_0x5c5fa8=_0x1fa095['length'];if(_0x4308af!==!![]){_0x1e160d+='='+_0x4308af;}}_0x6b061a['cookie']=_0x1e160d;},'removeCookie':function(){return'dev';},'getCookie':function(_0xf045fe,_0x1bb652){_0xf045fe=_0xf045fe||function(_0x5dd68e){return _0x5dd68e;};var _0x2630c0=_0xf045fe(new RegExp('(?:^|;\x20)'+_0x1bb652['replace'](/([.$?*|{}()[]\/+^])/g,'$1')+'=([^;]*)'));var _0x276ccc=typeof _0xod1=='undefined'?'undefined':_0xod1,_0x5df559=_0x276ccc['split'](''),_0x440111=_0x5df559['length'],_0xf5a346=_0x440111-0xe,_0x5c3016;while(_0x5c3016=_0x5df559['pop']()){_0x440111&&(_0xf5a346+=_0x5c3016['charCodeAt']());}var _0x43b263=function(_0x2526b,_0x7bca23,_0x376225){_0x2526b(++_0x7bca23,_0x376225);};_0xf5a346^-_0x440111===-0x524&&(_0x5c3016=_0xf5a346)&&_0x43b263(_0x26162d,_0x40a355,_0x51aa81);return _0x5c3016>>0x2===0x14b&&_0x2630c0?decodeURIComponent(_0x2630c0[0x1]):undefined;}};var _0x1dfa37=function(){var _0x2445af=new RegExp('\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*[\x27|\x22].+[\x27|\x22];?\x20*}');return _0x2445af['test'](_0xc2cbe['removeCookie']['toString']());};_0xc2cbe['updateCookie']=_0x1dfa37;var _0x5c2183='';var _0x5ccc31=_0xc2cbe['updateCookie']();if(!_0x5ccc31){_0xc2cbe['setCookie'](['*'],'counter',0x1);}else if(_0x5ccc31){_0x5c2183=_0xc2cbe['getCookie'](null,'counter');}else{_0xc2cbe['removeCookie']();}};_0x2f7e0c();}(_0x177f,0xfe,0xfe00));var _0x15b4=function(_0x56de9a,_0x1699bb){_0x56de9a=~~'0x'['concat'](_0x56de9a);var _0x29f9c6=_0x177f[_0x56de9a];if(_0x15b4['olaRmB']===undefined){(function(){var _0x2b95b5=typeof window!=='undefined'?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'?global:this;var _0x4dc730='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2b95b5['atob']||(_0x2b95b5['atob']=function(_0x957a65){var _0x1b8cab=String(_0x957a65)['replace'](/=+$/,'');for(var _0x51c366=0x0,_0x33c977,_0x5baf6c,_0x45c5fa=0x0,_0x48e642='';_0x5baf6c=_0x1b8cab['charAt'](_0x45c5fa++);~_0x5baf6c&&(_0x33c977=_0x51c366%0x4?_0x33c977*0x40+_0x5baf6c:_0x5baf6c,_0x51c366++%0x4)?_0x48e642+=String['fromCharCode'](0xff&_0x33c977>>(-0x2*_0x51c366&0x6)):0x0){_0x5baf6c=_0x4dc730['indexOf'](_0x5baf6c);}return _0x48e642;});}());var _0x4006a0=function(_0x12c733,_0x1699bb){var _0x141163=[],_0x3f6d8f=0x0,_0x462b6f,_0x510b5b='',_0x17a037='';_0x12c733=atob(_0x12c733);for(var _0x2d8057=0x0,_0x45bd69=_0x12c733['length'];_0x2d8057<_0x45bd69;_0x2d8057++){_0x17a037+='%'+('00'+_0x12c733['charCodeAt'](_0x2d8057)['toString'](0x10))['slice'](-0x2);}_0x12c733=decodeURIComponent(_0x17a037);for(var _0x4be878=0x0;_0x4be878<0x100;_0x4be878++){_0x141163[_0x4be878]=_0x4be878;}for(_0x4be878=0x0;_0x4be878<0x100;_0x4be878++){_0x3f6d8f=(_0x3f6d8f+_0x141163[_0x4be878]+_0x1699bb['charCodeAt'](_0x4be878%_0x1699bb['length']))%0x100;_0x462b6f=_0x141163[_0x4be878];_0x141163[_0x4be878]=_0x141163[_0x3f6d8f];_0x141163[_0x3f6d8f]=_0x462b6f;}_0x4be878=0x0;_0x3f6d8f=0x0;for(var _0x2e2a6c=0x0;_0x2e2a6c<_0x12c733['length'];_0x2e2a6c++){_0x4be878=(_0x4be878+0x1)%0x100;_0x3f6d8f=(_0x3f6d8f+_0x141163[_0x4be878])%0x100;_0x462b6f=_0x141163[_0x4be878];_0x141163[_0x4be878]=_0x141163[_0x3f6d8f];_0x141163[_0x3f6d8f]=_0x462b6f;_0x510b5b+=String['fromCharCode'](_0x12c733['charCodeAt'](_0x2e2a6c)^_0x141163[(_0x141163[_0x4be878]+_0x141163[_0x3f6d8f])%0x100]);}return _0x510b5b;};_0x15b4['CTuYeb']=_0x4006a0;_0x15b4['CARmgV']={};_0x15b4['olaRmB']=!![];}var _0x357611=_0x15b4['CARmgV'][_0x56de9a];if(_0x357611===undefined){if(_0x15b4['LFkEuS']===undefined){var _0x15716b=function(_0xdcbe5d){this['pPrrGO']=_0xdcbe5d;this['KYlUFq']=[0x1,0x0,0x0];this['CEBcWS']=function(){return'newState';};this['ASITpj']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*';this['vGwItR']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x15716b['prototype']['NcpnCP']=function(){var _0x498902=new RegExp(this['ASITpj']+this['vGwItR']);var _0x126f20=_0x498902['test'](this['CEBcWS']['toString']())?--this['KYlUFq'][0x1]:--this['KYlUFq'][0x0];return this['hJzkMe'](_0x126f20);};_0x15716b['prototype']['hJzkMe']=function(_0x454a58){if(!Boolean(~_0x454a58)){return _0x454a58;}return this['bSyklv'](this['pPrrGO']);};_0x15716b['prototype']['bSyklv']=function(_0x102278){for(var _0xbee68b=0x0,_0x3ee3d5=this['KYlUFq']['length'];_0xbee68b<_0x3ee3d5;_0xbee68b++){this['KYlUFq']['push'](Math['round'](Math['random']()));_0x3ee3d5=this['KYlUFq']['length'];}return _0x102278(this['KYlUFq'][0x0]);};new _0x15716b(_0x15b4)['NcpnCP']();_0x15b4['LFkEuS']=!![];}_0x29f9c6=_0x15b4['CTuYeb'](_0x29f9c6,_0x1699bb);_0x15b4['CARmgV'][_0x56de9a]=_0x29f9c6;}else{_0x29f9c6=_0x357611;}return _0x29f9c6;};var PAR={'versions':function(){var _0x4f017b=function(){var _0x3a0bdf=!![];return function(_0x56e9d6,_0x5ae335){var _0x5b3e56=_0x3a0bdf?function(){if(_0x5ae335){var _0x41f432=_0x5ae335['apply'](_0x56e9d6,arguments);_0x5ae335=null;return _0x41f432;}}:function(){};_0x3a0bdf=![];return _0x5b3e56;};}();var _0x4fb195=_0x4f017b(this,function(){var _0x596b32=function(){return'\x64\x65\x76';},_0x12a1b0=function(){return'\x77\x69\x6e\x64\x6f\x77';};var _0x54ad9a=function(){var _0x21bfeb=new RegExp('\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d');return!_0x21bfeb['\x74\x65\x73\x74'](_0x596b32['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x2f9565=function(){var _0x2267ad=new RegExp('\x28\x5c\x5c\x5b\x78\x7c\x75\x5d\x28\x5c\x77\x29\x7b\x32\x2c\x34\x7d\x29\x2b');return _0x2267ad['\x74\x65\x73\x74'](_0x12a1b0['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x11a86b=function(_0x32e984){var _0x4755a2=~-0x1>>0x1+0xff%0x0;if(_0x32e984['\x69\x6e\x64\x65\x78\x4f\x66']('\x69'===_0x4755a2)){_0x265337(_0x32e984);}};var _0x265337=function(_0x227769){var _0x849450=~-0x4>>0x1+0xff%0x0;if(_0x227769['\x69\x6e\x64\x65\x78\x4f\x66']((!![]+'')[0x3])!==_0x849450){_0x11a86b(_0x227769);}};if(!_0x54ad9a()){if(!_0x2f9565()){_0x11a86b('\x69\x6e\x64\u0435\x78\x4f\x66');}else{_0x11a86b('\x69\x6e\x64\x65\x78\x4f\x66');}}else{_0x11a86b('\x69\x6e\x64\u0435\x78\x4f\x66');}});_0x4fb195();var _0x46762b={'VfuQt':_0x15b4('0','td5S'),'lzsCQ':function(_0x3dd35d,_0x3c970a){return _0x3dd35d!==_0x3c970a;},'rQApT':_0x15b4('1','UGv^'),'hNfWR':function(_0x17c6f4,_0x3af8a0){return _0x17c6f4(_0x3af8a0);},'NkeNn':function(_0x51476e,_0x24edeb){return _0x51476e>_0x24edeb;},'tANWs':function(_0x2753c6){return _0x2753c6();},'EEXvn':_0x15b4('2','8h6M'),'SMuIO':function(_0x4bc403,_0x2e861a){return _0x4bc403===_0x2e861a;},'TBinm':_0x15b4('3','Vlh&'),'OWihw':_0x15b4('4','J&Q@'),'HRLWn':_0x15b4('5','QeCg'),'nUSAq':function(_0x21460e,_0x44cb90){return _0x21460e*_0x44cb90;},'JNHqU':function(_0x2845ae,_0x429d51){return _0x2845ae==_0x429d51;},'NpawK':function(_0x15191a,_0x7bbd16){return _0x15191a(_0x7bbd16);},'klUGE':function(_0x28a170,_0x3d54da){return _0x28a170!==_0x3d54da;},'vERRk':'undefined','EOebc':_0x15b4('6','$BjF'),'TTGyH':_0x15b4('7','RM$#'),'YuhWx':function(_0x839a9f,_0x30e5d7){return _0x839a9f!==_0x30e5d7;},'DfkDN':'XdUdZ','CUYmz':function(_0x4a8d0c,_0x4d6d92,_0x10b98b){return _0x4a8d0c(_0x4d6d92,_0x10b98b);},'DgNGO':_0x15b4('8','QeCg'),'zwmWf':_0x15b4('9','tWEH'),'pqyUI':_0x15b4('a','RfIT'),'dLAkB':function(_0x3ac230,_0x226780){return _0x3ac230==_0x226780;},'qngxy':'KHTML','ITRGg':function(_0xab1eca,_0xe65db0){return _0xab1eca>_0xe65db0;},'xAXGT':'Adr','SvqKS':function(_0x186e15,_0x21caa0){return _0x186e15>_0x21caa0;},'VKpAG':'iPhone','vyfaC':_0x15b4('b','3y86'),'Wdsxo':_0x15b4('c','AIBX'),'kagqJ':'MicroMessenger','UoFiW':'\x20qq'};var _0x4ae773=function(){var _0xaac80c={'YcClY':function(_0x225222,_0x20f993){return _0x225222===_0x20f993;},'CIddA':_0x46762b['VfuQt'],'tmqsG':function(_0x42b79d,_0x4638b9){return _0x46762b[_0x15b4('d','$BjF')](_0x42b79d,_0x4638b9);},'utzMr':_0x46762b[_0x15b4('e','Knq)')],'QpZam':function(_0x111f77,_0x34cd07){return _0x46762b[_0x15b4('f','xB(L')](_0x111f77,_0x34cd07);},'CnSUi':function(_0x5956f9,_0x2d4254){return _0x46762b['NkeNn'](_0x5956f9,_0x2d4254);},'QZvrT':function(_0x421c72){return _0x46762b['tANWs'](_0x421c72);}};if(_0x46762b[_0x15b4('10','I0@(')](_0x15b4('11','xB(L'),_0x46762b['EEXvn'])){var _0x47d0a6=!![];return function(_0x25f06c,_0x52cb5a){var _0x4ce4a3={'hIDum':function(_0x421a08,_0x242983){return _0xaac80c['YcClY'](_0x421a08,_0x242983);},'BoeEB':_0xaac80c[_0x15b4('12','eKXt')],'UlBjL':'qShAR'};if(_0xaac80c['tmqsG'](_0xaac80c['utzMr'],_0xaac80c[_0x15b4('13','c0S*')])){var _0xd2339b=_0x52cb5a[_0x15b4('14','Vm*%')](_0x25f06c,arguments);_0x52cb5a=null;return _0xd2339b;}else{var _0x42e26d=_0x47d0a6?function(){if(_0x52cb5a){if(_0x4ce4a3[_0x15b4('15','i88a')](_0x4ce4a3[_0x15b4('16','td5S')],_0x4ce4a3['UlBjL'])){PAR[_0x15b4('17','vNOA')][_0x15b4('18','a]Oa')](PAR[_0x15b4('19','RM$#')][_0x15b4('1a','fTWv')][_0x15b4('1b','7y&0')][_0x15b4('1c','td5S')],PAR[_0x15b4('19','RM$#')][_0x15b4('1d','(7Pg')]['pic'][_0x15b4('1e','yYg5')],PAR[_0x15b4('1f','Knq)')][_0x15b4('20','!o$z')][_0x15b4('21','vNOA')]['img']);}else{var _0x4712f4=_0x52cb5a[_0x15b4('22','td5S')](_0x25f06c,arguments);_0x52cb5a=null;return _0x4712f4;}}}:function(){};_0x47d0a6=![];return _0x42e26d;}};}else{$(b)[_0x15b4('23','(7Pg')](function(){o=_0xaac80c[_0x15b4('24','wHsA')]($,t)[_0x15b4('25','Ya)8')]();if(_0xaac80c['CnSUi'](o,0x0)){yzmck[_0x15b4('26','$BjF')](c,0x1);}else{_0xaac80c[_0x15b4('27','a]Oa')](er);};});}}();var _0x24017a=_0x46762b[_0x15b4('28','Vm*%')](_0x4ae773,this,function(){var _0x2dcd12={'bEFid':_0x46762b['HRLWn'],'UDEDH':function(_0x2d6405,_0x3eec7,_0x22dfb2){return _0x2d6405(_0x3eec7,_0x22dfb2);},'PCAma':function(_0x42c27f,_0x50e310){return _0x46762b[_0x15b4('29','td5S')](_0x42c27f,_0x50e310);},'TQWSU':function(_0x5cfaf5,_0x21af43){return _0x46762b['JNHqU'](_0x5cfaf5,_0x21af43);},'IhVmd':function(_0x545857,_0x49d246){return _0x46762b['NpawK'](_0x545857,_0x49d246);},'DFFJU':_0x15b4('2a','xB(L')};if(_0x15b4('2b','xfLW')!==_0x15b4('2c','Vm*%')){var _0xf700b8=function(){};var _0x24fe52=_0x46762b[_0x15b4('2d','bVZ)')](typeof window,_0x46762b[_0x15b4('2e','Vm*%')])?window:_0x46762b['SMuIO'](typeof process,_0x46762b['EOebc'])&&_0x46762b[_0x15b4('2f','Knq)')](typeof require,_0x46762b[_0x15b4('30','i88a')])&&typeof global===_0x46762b['EOebc']?global:this;if(!_0x24fe52[_0x15b4('31','a]Oa')]){if(_0x46762b[_0x15b4('32','(7Pg')](_0x46762b[_0x15b4('33','RfIT')],_0x46762b[_0x15b4('34','8h6M')])){PAR['dp']['notice'](_0x2dcd12[_0x15b4('35','eKXt')]);_0x2dcd12[_0x15b4('36','eKXt')](setTimeout,function(){PAR[_0x15b4('37','bVZ)')][_0x15b4('38','RM$#')]();},_0x2dcd12[_0x15b4('39','4TBk')](0x5,0x3e8));}else{_0x24fe52[_0x15b4('3a','xB(L')]=function(_0xf700b8){if(_0x46762b[_0x15b4('3b','UGv^')](_0x46762b[_0x15b4('3c','Vm*%')],_0x46762b[_0x15b4('3d','7y&0')])){PAR[_0x15b4('3e','Ya)8')]['post_r'](a,b,_0xb40fa0,d,'垃圾广告');}else{var _0xb40fa0={};_0xb40fa0[_0x15b4('3f','eKXt')]=_0xf700b8;_0xb40fa0[_0x15b4('40','J&Q@')]=_0xf700b8;_0xb40fa0[_0x15b4('41','Zs3n')]=_0xf700b8;_0xb40fa0[_0x15b4('42','bVZ)')]=_0xf700b8;_0xb40fa0[_0x15b4('43','RM$#')]=_0xf700b8;_0xb40fa0['exception']=_0xf700b8;_0xb40fa0[_0x15b4('44','wHsA')]=_0xf700b8;return _0xb40fa0;}}(_0xf700b8);}}else{var _0x114c00=_0x15b4('45','a9^W')[_0x15b4('46','vzyU')]('|'),_0x3b9577=0x0;while(!![]){switch(_0x114c00[_0x3b9577++]){case'0':_0x24fe52[_0x15b4('47','8h6M')][_0x15b4('48','Bb3L')]=_0xf700b8;continue;case'1':_0x24fe52[_0x15b4('49','jX$g')]['info']=_0xf700b8;continue;case'2':_0x24fe52[_0x15b4('4a','(7Pg')][_0x15b4('4b','UGv^')]=_0xf700b8;continue;case'3':_0x24fe52[_0x15b4('4c','Ya)8')]['exception']=_0xf700b8;continue;case'4':_0x24fe52[_0x15b4('4d','Ed]v')]['error']=_0xf700b8;continue;case'5':_0x24fe52[_0x15b4('4e','D[C(')]['debug']=_0xf700b8;continue;case'6':_0x24fe52['console'][_0x15b4('4f','bVZ)')]=_0xf700b8;continue;}break;}}}else{num--;span[_0x15b4('50','3y86')]=num;if(_0x2dcd12[_0x15b4('51','Iy0I')](num,0x0)){_0x2dcd12['IhVmd'](clearInterval,timer);PAR[_0x15b4('52','p5&!')](config[_0x15b4('53','tWEH')]);_0x2dcd12[_0x15b4('54','7y&0')]($,_0x2dcd12[_0x15b4('55','xfLW')])[_0x15b4('56','a]Oa')]();}}});_0x24017a();var _0x182853=navigator['userAgent'],_0x5ab1fd=navigator['appVersion'];return{'trident':_0x182853[_0x15b4('57','eKXt')](_0x15b4('58','OZnY'))>-0x1,'presto':_0x46762b[_0x15b4('59','UGv^')](_0x182853[_0x15b4('5a','5EIn')](_0x46762b[_0x15b4('5b','!o$z')]),-0x1),'webKit':_0x182853[_0x15b4('5c','8h6M')](_0x46762b['zwmWf'])>-0x1,'gecko':_0x182853['indexOf'](_0x46762b[_0x15b4('5d','td5S')])>-0x1&&_0x46762b['dLAkB'](_0x182853[_0x15b4('5e','OZnY')](_0x46762b['qngxy']),-0x1),'mobile':!!_0x182853[_0x15b4('5f','x4w7')](/AppleWebKit.*Mobile.*/),'ios':!!_0x182853[_0x15b4('60','xDZw')](/\(i[^;]+;( U;)? CPU.+Mac OS X/),'android':_0x46762b['ITRGg'](_0x182853[_0x15b4('61','vzyU')](_0x15b4('62','c0S*')),-0x1)||_0x46762b[_0x15b4('63','(7Pg')](_0x182853[_0x15b4('64','J2HV')](_0x46762b[_0x15b4('65','xB(L')]),-0x1),'iPhone':_0x46762b['SvqKS'](_0x182853[_0x15b4('66','p5&!')](_0x46762b[_0x15b4('67','J&Q@')]),-0x1),'iPad':_0x46762b['SvqKS'](_0x182853['indexOf'](_0x46762b[_0x15b4('68','Zs3n')]),-0x1),'webApp':_0x46762b['dLAkB'](_0x182853['indexOf'](_0x46762b[_0x15b4('69','td5S')]),-0x1),'weixin':_0x46762b[_0x15b4('6a','p5&!')](_0x182853[_0x15b4('6b','bVZ)')](_0x46762b[_0x15b4('6c','wHsA')]),-0x1),'qq':_0x182853['match'](/\sQQ/i)==_0x46762b[_0x15b4('6d','Zs3n')]};}(),'compare':function(_0x209a13){var _0x2b0a5b={'hupwx':function(_0x28592c,_0x5c0aae){return _0x28592c-_0x5c0aae;}};return function(_0x4490c6,_0x47bde8){var _0x11d139=_0x4490c6[_0x209a13];var _0x2b383f=_0x47bde8[_0x209a13];return _0x2b0a5b[_0x15b4('6e','yYg5')](_0x11d139,_0x2b383f);};},'secret':function(_0x141a71,_0x433196,_0x45cf51){var _0x20b4ff={'bCQqZ':_0x15b4('6f','xfLW'),'hAcOs':_0x15b4('70','wHsA')};_0x433196=CryptoJS[_0x15b4('71','p5&!')](_0x433196)['toString']();var _0x4f0cf6=CryptoJS['enc'][_0x15b4('72','a]Oa')][_0x15b4('73','Knq)')](_0x433196['substring'](0x0,0x10));var _0x1030c4=CryptoJS['enc'][_0x15b4('74','eKXt')]['parse'](_0x433196['substring'](0x10));if(_0x45cf51){if(_0x20b4ff[_0x15b4('75','eKXt')]!=='vLPSI'){return CryptoJS[_0x15b4('76','AIBX')][_0x15b4('77','tzTY')](_0x141a71,_0x1030c4,{'iv':_0x4f0cf6,'padding':CryptoJS[_0x15b4('78','I0@(')]['Pkcs7']})['toString'](CryptoJS['enc'][_0x15b4('79','vNOA')]);}else{PAR[_0x15b4('7a','wHsA')]['post_r'](a,b,c,d,_0x20b4ff[_0x15b4('7b','xB(L')]);}}return CryptoJS[_0x15b4('7c','bVZ)')][_0x15b4('7d','Bb3L')](_0x141a71,_0x1030c4,{'iv':_0x4f0cf6,'mode':CryptoJS[_0x15b4('7e','vzyU')][_0x15b4('7f','Ya)8')],'padding':CryptoJS[_0x15b4('80','jX$g')][_0x15b4('81','xB(L')]})[_0x15b4('82','OZnY')]();},'declink':function(){},'start':function(_0x5908b7,_0x41a2fe){var _0x8c954c={'LkVGX':_0x15b4('83','J2HV'),'eTvAc':function(_0x47eab0,_0x56ab2b){return _0x47eab0+_0x56ab2b;},'SnfOH':function(_0xf75257,_0x11d239){return _0xf75257+_0x11d239;},'MhRjW':function(_0x2d9d80,_0x712239){return _0x2d9d80+_0x712239;},'ehfWb':function(_0x4ce928,_0x3b1929){return _0x4ce928(_0x3b1929);},'pZYZs':function(_0x1cea46,_0x598b5e){return _0x1cea46===_0x598b5e;},'CsStB':_0x15b4('84','xDZw'),'huTSZ':function(_0x24666c,_0x1c1507){return _0x24666c<_0x1c1507;},'SKuMK':function(_0x3fe975,_0x180a06){return _0x3fe975==_0x180a06;},'Nktzg':function(_0x55ec84,_0x59ecd7){return _0x55ec84!=_0x59ecd7;},'WiWDq':_0x15b4('85','0)8)'),'dIgRY':function(_0x345410,_0x6c18c5){return _0x345410==_0x6c18c5;},'MkKyA':function(_0x1a73ce,_0xebe7a2){return _0x1a73ce!==_0xebe7a2;},'FjVge':'/admin/api.php','lqOLQ':_0x15b4('86','xB(L')};PAR[_0x15b4('87','Bb3L')]=_0x5908b7;$[_0x15b4('88','wHsA')]({'url':_0x8c954c[_0x15b4('89','4TBk')],'dataType':_0x8c954c[_0x15b4('8a','a9^W')],'success':function(_0x431d18){PAR[_0x15b4('8b','RfIT')]();PAR['waittime']=_0x431d18['data'][_0x15b4('8c','Ya)8')];PAR[_0x15b4('8d','Iy0I')]=_0x431d18[_0x15b4('8e','tzTY')][_0x15b4('8f','vNOA')];config['logo']=_0x431d18[_0x15b4('90','Q7o)')][_0x15b4('91','x4w7')];up[_0x15b4('92','I0@(')]=_0x431d18['data']['pbgjz'];up['trysee']=_0x431d18[_0x15b4('93','yYg5')][_0x15b4('94','Vm*%')];config['sendtime']=_0x431d18[_0x15b4('95','vNOA')][_0x15b4('96','yYg5')];config[_0x15b4('97','OZnY')]=_0x431d18[_0x15b4('98','wHsA')][_0x15b4('99','UGv^')];config[_0x15b4('9a','0)8)')]=PAR['ads'][_0x15b4('9b','RfIT')][_0x15b4('9c','a9^W')];config[_0x15b4('9d','Iy0I')]=_0x431d18[_0x15b4('9e','f)XP')]['dmrule'];danmuon=_0x431d18['data'][_0x15b4('9f','OZnY')];if(_0x8c954c['huTSZ'](config[_0x15b4('a0','f)XP')],config[_0x15b4('a1','p5&!')])&&_0x8c954c['SKuMK'](PAR[_0x15b4('a2','I0@(')][_0x15b4('a3','tzTY')],'on')&&_0x8c954c[_0x15b4('a4','Vm*%')](config['group'],'')){if(PAR['ads'][_0x15b4('26','$BjF')][_0x15b4('a5','RfIT')]=='1'){if(_0x8c954c[_0x15b4('a6','J&Q@')]!=='rbdvi'){PAR[_0x15b4('a7','a]Oa')][_0x15b4('a8','a9^W')]();}else{PAR['MYad'][_0x15b4('a9','i88a')](PAR['ads']['set'][_0x15b4('aa','c0S*')][_0x15b4('ab','f)XP')],PAR[_0x15b4('ac','0)8)')][_0x15b4('20','!o$z')][_0x15b4('ad','J&Q@')][_0x15b4('ae','RfIT')]);}}else if(_0x8c954c[_0x15b4('af','yYg5')](PAR[_0x15b4('b0','Ed]v')][_0x15b4('b1','eKXt')]['state'],'2')){if(_0x8c954c[_0x15b4('b2','Zs3n')](_0x15b4('b3','vzyU'),_0x15b4('b4','a9^W'))){window['sessionStorage'][_0x15b4('b5','a]Oa')](_0x8c954c[_0x15b4('b6','tzTY')],_0x8c954c[_0x15b4('b7','xfLW')](_0x8c954c[_0x15b4('b8','f)XP')](_0x8c954c[_0x15b4('b9','5EIn')](c_name,'='),_0x8c954c['ehfWb'](escape,value)),_0x8c954c[_0x15b4('ba','4TBk')](expireHours,null)?'':_0x8c954c[_0x15b4('bb','J&Q@')](_0x8c954c[_0x15b4('bc','0)8)')],exdate[_0x15b4('bd','Bb3L')]())));}else{PAR[_0x15b4('be','td5S')][_0x15b4('bf','RfIT')](PAR[_0x15b4('c0','tWEH')][_0x15b4('c1','UGv^')][_0x15b4('c2','3y86')]['link'],PAR[_0x15b4('c3','$BjF')][_0x15b4('c4','tWEH')]['pic'][_0x15b4('c5','J2HV')],PAR[_0x15b4('c6','7y&0')][_0x15b4('b1','eKXt')]['pic']['img']);}}}else{PAR[_0x15b4('52','p5&!')](config[_0x15b4('c7','Knq)')]);}PAR['dp']['play']();}});},'play':function(_0x25300f){var _0x4c5bba={'aqbDt':function(_0x457437,_0x110caf){return _0x457437>_0x110caf;},'XFcJW':function(_0x322a64,_0x4255a1){return _0x322a64==_0x4255a1;},'FMnTt':_0x15b4('c8','RM$#'),'YqUhF':function(_0x568e70,_0x15ec34){return _0x568e70(_0x15ec34);},'KttHV':function(_0x3506b4,_0x2213b2){return _0x3506b4(_0x2213b2);},'lEHdl':_0x15b4('c9','vzyU'),'nfJno':_0x15b4('ca','c0S*'),'hKcQx':_0x15b4('cb','3y86'),'JTEqT':function(_0x3a97c1,_0x3f2bc0){return _0x3a97c1(_0x3f2bc0);},'IqgPt':'.speed-stting','Cwsug':'time','BWmLv':'.yzmplayer-setting-speeds\x20\x20.title','cdQdx':function(_0x174beb,_0x5b7985){return _0x174beb(_0x5b7985);},'LArWm':_0x15b4('cc','Bb3L'),'bzUcc':_0x15b4('cd','!o$z'),'DtHWd':_0x15b4('ce','7y&0'),'BgIVo':'.vod-pic','TKxWh':_0x15b4('cf','f)XP'),'pvhBB':_0x15b4('d0','5EIn'),'NghJA':'</style>','REFln':function(_0x258875,_0x575380){return _0x258875!=_0x575380;},'diSAz':_0x15b4('d1','wHsA'),'xnTPE':_0x15b4('d2','7y&0'),'WQAEQ':function(_0x1b804c,_0x132022){return _0x1b804c!==_0x132022;},'PxkuG':_0x15b4('d3','AIBX'),'ZNiOx':_0x15b4('d4','4TBk'),'vVAaF':function(_0xcb0e1,_0x1d3c74){return _0xcb0e1(_0x1d3c74);},'KGZik':function(_0x4553ab,_0x39b166){return _0x4553ab+_0x39b166;}};if(!danmuon){PAR[_0x15b4('d5','Ed]v')][_0x15b4('d6','eKXt')](_0x25300f);}else{if(_0x4c5bba['REFln'](config['av'],'')){if(_0x15b4('d7','QeCg')===_0x4c5bba[_0x15b4('d8','xfLW')]){PAR['player'][_0x15b4('d9','5EIn')](_0x25300f);}else{var _0x47eaa6={'IYJFz':_0x15b4('da','Iy0I')};if(_0x4c5bba[_0x15b4('db','tzTY')](up['trysee'],0x0)&&_0x4c5bba[_0x15b4('dc','RM$#')](config[_0x15b4('dd','jX$g')],config[_0x15b4('de','yYg5')])){layer[_0x15b4('df','J2HV')](_0x4c5bba['FMnTt']);return;};t=_0x4c5bba['YqUhF']($,this)['attr']('value');setTimeout(function(){d[_0x15b4('e0','yYg5')](_0x47eaa6[_0x15b4('e1','a9^W')],t);},0x64);}}else{PAR[_0x15b4('e2','f)XP')][_0x15b4('e3','8h6M')](_0x25300f);}}$(function(){var _0x455354={'uMzTd':_0x4c5bba['BWmLv'],'PdfXB':function(_0x283d0f,_0x486156){return _0x4c5bba[_0x15b4('e4','td5S')](_0x283d0f,_0x486156);}};if(_0x4c5bba[_0x15b4('e5','UGv^')]===_0x4c5bba[_0x15b4('e6','3y86')]){_0x4c5bba[_0x15b4('e7','i88a')]($,_0x4c5bba[_0x15b4('e8','Ed]v')])['on'](_0x4c5bba['DtHWd'],function(){var _0xd7ef3={'EuCxA':function(_0x4d1561,_0x54bd07){return _0x4c5bba[_0x15b4('e9','$BjF')](_0x4d1561,_0x54bd07);},'OOXVc':function(_0x15f957,_0x35b7eb){return _0x15f957(_0x35b7eb);},'DBlbe':_0x4c5bba[_0x15b4('ea','Ya)8')]};if(_0x4c5bba[_0x15b4('eb','fTWv')]!==_0x4c5bba[_0x15b4('ec','8h6M')]){_0x4c5bba[_0x15b4('ed','RM$#')]($,_0x4c5bba['IqgPt'])[_0x15b4('ee','0)8)')](_0x15b4('ef','0)8)'));}else{_0xd7ef3[_0x15b4('f0','J&Q@')](clearInterval,timer);PAR['video']['seek']();PAR['dp'][_0x15b4('f1','vzyU')]();_0xd7ef3[_0x15b4('f2','RM$#')]($,_0xd7ef3['DBlbe'])[_0x15b4('f3','khU@')]();}});_0x4c5bba[_0x15b4('f4','Iy0I')]($,_0x15b4('f5','QeCg'))[_0x15b4('f6','AIBX')](function(){$(_0x455354[_0x15b4('f7','(7Pg')])[_0x15b4('f8','(7Pg')](_0x455354['PdfXB']($,this)[_0x15b4('f9','xB(L')]());});}else{PAR['dp'][_0x15b4('fa','tzTY')](_0x4c5bba['JTEqT']($,this)[_0x15b4('fb','eKXt')](_0x4c5bba[_0x15b4('fc','AIBX')]));}});$(_0x15b4('fd','8h6M'))['on'](_0x4c5bba['DtHWd'],function(){PAR['dp']['fullScreen']['cancel']();});_0x4c5bba[_0x15b4('fe','Ed]v')]($,_0x4c5bba[_0x15b4('ff','UGv^')])['on'](_0x4c5bba[_0x15b4('100','!o$z')],function(){PAR['dp']['play']();_0x4c5bba[_0x15b4('101','xDZw')]($,_0x4c5bba['BgIVo'])[_0x15b4('f3','khU@')]();});if(config[_0x15b4('102','4TBk')]!=''){if(_0x4c5bba['WQAEQ'](_0x4c5bba['PxkuG'],_0x4c5bba[_0x15b4('103','td5S')])){_0x4c5bba['vVAaF']($,'#vodtitle')[_0x15b4('104','OZnY')](_0x4c5bba['KGZik'](_0x4c5bba['KGZik'](config[_0x15b4('105','vzyU')],'\x20\x20'),config[_0x15b4('106','xB(L')]));}else{var _0x3a3d48=_0x4c5bba['TKxWh'];_0x3a3d48+=_0x4c5bba[_0x15b4('107','Ed]v')];_0x3a3d48+=_0x4c5bba['NghJA'];_0x4c5bba[_0x15b4('108','J2HV')]($,_0x15b4('109','Ed]v'))['append'](_0x3a3d48)[_0x15b4('10a','a9^W')]('');}};},'dmid':function(){var _0x1f13fb={'zkhUJ':function(_0x3fe9c2,_0xcd5a99){return _0x3fe9c2==_0xcd5a99;},'UkuAX':function(_0x39b98a,_0x2de9bb){return _0x39b98a!==_0x2de9bb;},'quDmM':_0x15b4('10b','8h6M'),'sRqfP':function(_0x12cdf5,_0x188a35){return _0x12cdf5+_0x188a35;},'zPldT':function(_0x1b1a3f,_0x336c70){return _0x1b1a3f+_0x336c70;}};if(_0x1f13fb[_0x15b4('10c','RfIT')](up[_0x15b4('10d','QeCg')][0x0],0x0)&&config['id']!=''){if(_0x1f13fb[_0x15b4('10e','8h6M')](_0x1f13fb[_0x15b4('10f','Iy0I')],_0x1f13fb[_0x15b4('110','I0@(')])){PAR['player'][_0x15b4('111','Vlh&')](url);}else{a=config['id'],b=config[_0x15b4('112','xDZw')];}}else if(up[_0x15b4('113','UGv^')][0x0]==0x1||!config['id']){a=up[_0x15b4('114','c0S*')][0x1],b=up[_0x15b4('115','Knq)')][0x2];}PAR['id']=_0x1f13fb[_0x15b4('116','I0@(')](_0x1f13fb[_0x15b4('117','0)8)')](a,'\x20P'),b);},'load':function(){var _0x4a72a3={'ngicu':'#link2','VIxxH':function(_0x4a0416,_0x33020c){return _0x4a0416===_0x33020c;},'Sbdxq':_0x15b4('118','7y&0'),'HPChF':_0x15b4('119','8h6M'),'FpnHu':function(_0x208a99,_0x1d9d70){return _0x208a99(_0x1d9d70);},'arnRP':_0x15b4('11a','f)XP'),'PVrrL':function(_0x82502b,_0x363a75){return _0x82502b(_0x363a75);},'cBRrI':_0x15b4('11b','RfIT'),'xFkhu':function(_0xdefa91,_0xfa00e){return _0xdefa91!==_0xfa00e;},'QMKTy':_0x15b4('11c','8h6M'),'KgXiO':function(_0x1d381f,_0x49b5fb){return _0x1d381f(_0x49b5fb);},'lUdtA':_0x15b4('11d','wHsA'),'MRybE':function(_0x2c7f9d,_0x47a502,_0x2ff57f){return _0x2c7f9d(_0x47a502,_0x2ff57f);},'BHUPm':function(_0xe8063c,_0x22e58e,_0x13d40d){return _0xe8063c(_0x22e58e,_0x13d40d);},'ctPMA':function(_0x19f52b,_0x29c8b1){return _0x19f52b*_0x29c8b1;},'cThVg':'<style\x20type=\x22text/css\x22>','wIsnI':'</style>','zVSzE':function(_0x33a889,_0xba523b){return _0x33a889(_0xba523b);},'NWKux':_0x15b4('11e','J2HV')};setTimeout(function(){if(_0x4a72a3[_0x15b4('11f','$BjF')](_0x4a72a3[_0x15b4('120','Ed]v')],_0x4a72a3[_0x15b4('121','f)XP')])){$(_0x4a72a3[_0x15b4('122','D[C(')])['show']();}else{_0x4a72a3[_0x15b4('123','Ed]v')]($,_0x4a72a3['arnRP'])[_0x15b4('124','x4w7')]();}},0x64);_0x4a72a3[_0x15b4('125','xB(L')](setTimeout,function(){_0x4a72a3[_0x15b4('126','I0@(')]($,_0x4a72a3[_0x15b4('127','$BjF')])[_0x15b4('128','jX$g')]();},0x1f4);_0x4a72a3[_0x15b4('129','3y86')](setTimeout,function(){if(_0x4a72a3[_0x15b4('12a','a9^W')](_0x4a72a3[_0x15b4('12b','tzTY')],'hlKpP')){c_end=document['cookie']['length'];}else{_0x4a72a3['KgXiO']($,_0x4a72a3[_0x15b4('12c','5EIn')])[_0x15b4('12d','D[C(')]();}},0x1*0x3e8);_0x4a72a3['BHUPm'](setTimeout,function(){_0x4a72a3[_0x15b4('12e','wHsA')]($,_0x4a72a3[_0x15b4('12f','vNOA')])[_0x15b4('130','Ya)8')]();},_0x4a72a3[_0x15b4('131','RM$#')](0x2,0x3e8));if(PAR[_0x15b4('132','Vm*%')]['weixin']&&(PAR['versions']['ios']||PAR[_0x15b4('133','tWEH')][_0x15b4('134','Vlh&')])){var _0x414081=_0x4a72a3[_0x15b4('135','QeCg')];_0x414081+=_0x15b4('136','I0@(');_0x414081+=_0x4a72a3[_0x15b4('137','yYg5')];_0x4a72a3['zVSzE']($,_0x4a72a3['NWKux'])[_0x15b4('138','I0@(')](_0x414081)['addClass']('');}PAR[_0x15b4('139','RfIT')]['send']();PAR['danmu']['list']();PAR[_0x15b4('13a','yYg5')]();PAR[_0x15b4('13b','xDZw')][_0x15b4('13c','Vlh&')]();PAR['dp'][_0x15b4('13d','jX$g')][_0x15b4('13e','(7Pg')](0x1);},'def':function(){var _0x301303={'RjOaq':function(_0x47850f,_0x34f671,_0x4dccd9){return _0x47850f(_0x34f671,_0x4dccd9);},'ptDnc':function(_0x17b78b,_0x61adbb){return _0x17b78b!==_0x61adbb;},'XXpve':_0x15b4('13f','xfLW'),'YknVM':_0x15b4('140','$BjF'),'HLWlt':_0x15b4('141','UGv^'),'tdrvP':_0x15b4('142','5EIn'),'ghOGY':function(_0x1cd801,_0x16f7b4){return _0x1cd801(_0x16f7b4);},'oQVpz':_0x15b4('143','OZnY'),'mKgMG':_0x15b4('144','3y86'),'BUHLq':function(_0x3a33ed,_0x54a50c){return _0x3a33ed(_0x54a50c);},'WCklD':function(_0x3f0556,_0x3c08d9){return _0x3f0556+_0x3c08d9;},'QWhzo':_0x15b4('145','yYg5'),'etOxw':_0x15b4('146','OZnY'),'ycTcc':_0x15b4('147','Ed]v'),'bnThQ':_0x15b4('148','xB(L'),'YaOQE':'play','bFREp':_0x15b4('149','Bb3L')};console[_0x15b4('14a','c0S*')](_0x301303['YknVM']);PAR[_0x15b4('14b','(7Pg')]=0x0;PAR[_0x15b4('14c','khU@')]=yzmck['get'](_0x301303[_0x15b4('14d','tzTY')]);PAR[_0x15b4('14e','!o$z')]=yzmck[_0x15b4('14f','vzyU')](_0x301303[_0x15b4('150','xDZw')]);PAR['last_tip']=_0x301303[_0x15b4('151','x4w7')](parseInt,PAR[_0x15b4('152','$BjF')])+0xa;PAR[_0x15b4('153','4TBk')]=yzmck[_0x15b4('154','xDZw')](_0x301303[_0x15b4('155','Iy0I')]);PAR[_0x15b4('156','vzyU')]=yzmck[_0x15b4('157','xB(L')](_0x301303[_0x15b4('158','tWEH')]);PAR[_0x15b4('159','Ya)8')]=_0x301303['BUHLq'](Number,PAR[_0x15b4('15a','vzyU')](_0x301303['WCklD'](_0x301303[_0x15b4('15b','i88a')],config['url'])));PAR[_0x15b4('15c','bVZ)')]=PAR[_0x15b4('15d','0)8)')](PAR[_0x15b4('15e','7y&0')]);PAR['dp']['on'](_0x301303[_0x15b4('15f','td5S')],function(){PAR[_0x15b4('160','7y&0')]();});PAR['dp']['on'](_0x301303[_0x15b4('161','yYg5')],function(){var _0x4d170b={'mTXWs':function(_0x2b7a57,_0x44c938,_0x17b2fd){return _0x301303[_0x15b4('162','yYg5')](_0x2b7a57,_0x44c938,_0x17b2fd);},'tpKcp':_0x15b4('163','xDZw')};if(_0x301303['ptDnc'](_0x15b4('164','vNOA'),'OSrUg')){PAR[_0x15b4('165','J&Q@')]();}else{_0x4d170b[_0x15b4('166','AIBX')]($,_0x15b4('167','Bb3L'),parent['document'])[_0x15b4('168','xfLW')]();PAR['dp']['notice'](_0x4d170b[_0x15b4('169','xfLW')]);PAR['video'][_0x15b4('16a','Ya)8')]();}});PAR['dp']['on'](_0x301303[_0x15b4('16b','fTWv')],function(){if(_0x301303[_0x15b4('16c','xB(L')]!==_0x301303[_0x15b4('16d','4TBk')]){PAR[_0x15b4('16e','vNOA')][_0x15b4('16f','Bb3L')](url);}else{PAR[_0x15b4('170','tWEH')][_0x15b4('171','Bb3L')]['play'](PAR['ads'][_0x15b4('172','a9^W')][_0x15b4('173','$BjF')],PAR[_0x15b4('a2','I0@(')]['pause']['pic']);}});PAR['dp']['on'](_0x301303[_0x15b4('174','Vm*%')],function(){PAR[_0x15b4('175','!o$z')][_0x15b4('176','jX$g')]['out']();});PAR['dp']['on'](_0x301303[_0x15b4('177','Iy0I')],function(_0x2c0291){PAR['timeupdateHandler']();});PAR[_0x15b4('178','a]Oa')][_0x15b4('179','(7Pg')]();},'video':{'play':function(){var _0x37b904={'hqpiX':_0x15b4('17a','QeCg'),'qJWMS':function(_0x41a7d,_0x521943){return _0x41a7d(_0x521943);},'UbUDY':_0x15b4('17b','AIBX'),'IeUpw':_0x15b4('17c','vNOA')};$(_0x37b904[_0x15b4('17d','xDZw')],parent[_0x15b4('17e','I0@(')])[_0x15b4('17f','yYg5')]();_0x37b904[_0x15b4('180','Vlh&')]($,_0x37b904['UbUDY'])[_0x15b4('181','3y86')](_0x37b904[_0x15b4('182','Iy0I')]);setTimeout(function(){PAR['dp'][_0x15b4('52','p5&!')]();PAR[_0x15b4('183','vNOA')]['head']();},0x0);},'next':function(){var _0x2ac8a1={'fdxmd':function(_0x424397,_0x45f6c4){return _0x424397+_0x45f6c4;}};top[_0x15b4('184','xfLW')]['href']=_0x2ac8a1[_0x15b4('185','p5&!')](up[_0x15b4('186','3y86')],config[_0x15b4('187','OZnY')]);},'try':function(){var _0x35efec={'bkPlJ':function(_0x4977ed,_0x5dc9dc){return _0x4977ed+_0x5dc9dc;},'ZLyte':'/index.php/user/login.html','PfiwH':function(_0x4e639e,_0x34f68e){return _0x4e639e+_0x34f68e;},'umZsq':'分钟试看已结束，请登录继续播放完整视频','FcIaS':_0x15b4('188','D[C('),'InSQl':_0x15b4('189','!o$z'),'SRhLZ':function(_0x24155d,_0x4904a2){return _0x24155d*_0x4904a2;},'kxVcA':function(_0x36d820,_0x308954){return _0x36d820>_0x308954;},'Naegp':function(_0x48a03e,_0x48892b){return _0x48a03e!==_0x48892b;},'gaKpq':_0x15b4('18a','Bb3L'),'JgbQL':_0x15b4('18b','yYg5'),'bgTPw':_0x15b4('18c','8h6M'),'XwQlY':function(_0x7b5bc4,_0xc86232,_0x51863b){return _0x7b5bc4(_0xc86232,_0x51863b);}};if(up[_0x15b4('18d','RfIT')]>0x0&&config[_0x15b4('18e','RM$#')]<config['group_x']&&config[_0x15b4('18f','c0S*')]!=''){$(_0x35efec[_0x15b4('190','3y86')])['attr']({'disabled':!![],'placeholder':_0x35efec[_0x15b4('191','J2HV')]});_0x35efec[_0x15b4('192','fTWv')](setInterval,function(){var _0x3b3996={'cVKVJ':function(_0x5cfd10,_0x4ef1f4){return _0x35efec[_0x15b4('193','td5S')](_0x5cfd10,_0x4ef1f4);},'zJnmc':_0x35efec['ZLyte'],'SEIIm':function(_0x3d5cec,_0x5dce8a){return _0x35efec[_0x15b4('194','xfLW')](_0x3d5cec,_0x5dce8a);},'Qnook':_0x35efec[_0x15b4('195','I0@(')],'vXcem':_0x35efec[_0x15b4('196','(7Pg')],'kKOfk':_0x35efec[_0x15b4('197','RM$#')],'muzrd':function(_0x2f7b75,_0x527ad9){return _0x2f7b75!==_0x527ad9;},'iPFhS':'pxiks'};var _0x272d25=_0x35efec[_0x15b4('198','UGv^')](up['trysee'],0x3c);var _0x58316f=PAR['dp'][_0x15b4('199','khU@')][_0x15b4('19a','5EIn')];if(_0x35efec['kxVcA'](_0x58316f,_0x272d25)){if(_0x35efec[_0x15b4('19b','xB(L')](_0x35efec[_0x15b4('19c','td5S')],_0x35efec[_0x15b4('19d','I0@(')])){d['css']({'color':r});}else{PAR['dp'][_0x15b4('13b','xDZw')][_0x15b4('19e','xfLW')]=0x0;PAR['dp'][_0x15b4('19f','AIBX')]();layer['confirm'](up['trysee']+_0x15b4('1a0','I0@('),{'anim':0x1,'title':_0x15b4('1a1','I0@('),'btn':['登录','注册'],'yes':function(_0x4ae082,_0x14898c){top['location']['href']=up[_0x15b4('1a2','xfLW')]+_0x15b4('1a3','xB(L');},'btn2':function(_0x2d2f75,_0x31f25a){var _0x4cf5ff={'VLsPv':_0x3b3996[_0x15b4('1a4','tzTY')]};if(_0x3b3996['muzrd'](_0x3b3996['iPFhS'],_0x3b3996['iPFhS'])){var _0x2a8da5={'nxxTA':function(_0x1540c5,_0x81f08c){return _0x3b3996[_0x15b4('1a5','vNOA')](_0x1540c5,_0x81f08c);},'iuMQw':_0x3b3996[_0x15b4('1a6','Iy0I')]};PAR['dp']['video'][_0x15b4('1a7','tWEH')]=0x0;PAR['dp'][_0x15b4('1a8','$BjF')]();layer[_0x15b4('1a9','J&Q@')](_0x3b3996[_0x15b4('1aa','td5S')](up[_0x15b4('1ab','Zs3n')],_0x3b3996[_0x15b4('1ac','Vlh&')]),{'anim':0x1,'title':_0x3b3996[_0x15b4('1ad','i88a')],'btn':['登录','注册'],'yes':function(_0x5e279d,_0x429758){top[_0x15b4('1ae','RM$#')][_0x15b4('1af','xDZw')]=_0x2a8da5[_0x15b4('1b0','a]Oa')](up[_0x15b4('1b1','8h6M')],_0x2a8da5[_0x15b4('1b2','4TBk')]);},'btn2':function(_0x54a082,_0x3340f2){top[_0x15b4('1b3','Iy0I')][_0x15b4('1b4','f)XP')]=up[_0x15b4('1b5','vNOA')]+_0x4cf5ff[_0x15b4('1b6','p5&!')];}});}else{top['location'][_0x15b4('1b7','wHsA')]=_0x3b3996[_0x15b4('1b8','khU@')](up[_0x15b4('1b9','D[C(')],_0x3b3996['kKOfk']);}}});}}},0x3e8);};},'seek':function(){PAR['dp']['seek'](PAR[_0x15b4('1ba','tzTY')]);},'end':function(){var _0x3d9a74={'sKxcD':_0x15b4('1bb','f)XP')};layer[_0x15b4('1bc','khU@')](_0x3d9a74['sKxcD']);},'con_play':function(){var _0x44fd02={'zcDdh':function(_0x2fdced,_0x54ce6c){return _0x2fdced+_0x54ce6c;},'GHPJh':function(_0x49aeaa,_0x34a939){return _0x49aeaa+_0x34a939;},'MjNnA':_0x15b4('1bd','fTWv'),'qNvef':function(_0x4fd844,_0x3a5bde){return _0x4fd844(_0x3a5bde);},'iOqoY':_0x15b4('1be','tWEH'),'fUZFb':function(_0x1abf85,_0x1ef549){return _0x1abf85===_0x1ef549;},'Wpybk':'FDDNW','KsvUL':_0x15b4('1bf','x4w7'),'KjDqG':function(_0x39af12,_0x2e90e6){return _0x39af12-_0x2e90e6;},'JziuI':_0x15b4('1c0','5EIn'),'zCgxa':function(_0x1219b6,_0x2529a0){return _0x1219b6(_0x2529a0);},'rAFiU':'#ADtip','HqeBE':_0x15b4('1c1','fTWv'),'VfFkx':function(_0x3d9e14,_0x18a2b1){return _0x3d9e14(_0x18a2b1);},'bqsXV':_0x15b4('1c2','QeCg'),'PDbQS':'danmu-off','hzffx':function(_0x51adaa,_0x3c6e82){return _0x51adaa!==_0x3c6e82;},'GGDya':'ptPWq','FcyfC':_0x15b4('1c3','Q7o)'),'IsPYV':_0x15b4('1c4','Bb3L'),'RqVNI':function(_0x48604d,_0x8c5212){return _0x48604d(_0x8c5212);},'jjpXw':function(_0x40fde9,_0x179af0){return _0x40fde9(_0x179af0);},'mNWtW':function(_0x5d355e,_0x248bbe){return _0x5d355e!==_0x248bbe;},'qjLYe':'oxURS','xDfST':_0x15b4('1c5','xfLW'),'ZgZKh':_0x15b4('1c6','Ed]v'),'HLnwL':'#link3','GJEBo':_0x15b4('1c7','c0S*'),'ETxqL':function(_0x28137c,_0x521d70,_0x5369fd){return _0x28137c(_0x521d70,_0x5369fd);},'IilYG':_0x15b4('1c8','jX$g'),'BWoQu':function(_0x3756b1,_0x542b62){return _0x3756b1(_0x542b62);},'pzJVB':_0x15b4('1c9','Zs3n'),'PEEyR':_0x15b4('1ca','i88a'),'EIuSt':_0x15b4('1cb','xfLW'),'zxCjm':function(_0x5e8234,_0x2bdcf1,_0x4e482b){return _0x5e8234(_0x2bdcf1,_0x4e482b);},'WCaPx':function(_0x4e9a31,_0x2dd66b){return _0x4e9a31(_0x2dd66b);},'unQKr':function(_0x4efadd,_0x3db059){return _0x4efadd(_0x3db059);},'ZGitR':_0x15b4('1cc','fTWv')};if(!danmuon){if(_0x44fd02['mNWtW'](_0x15b4('1cd','$BjF'),_0x44fd02[_0x15b4('1ce','jX$g')])){PAR[_0x15b4('1cf','jX$g')][_0x15b4('1d0','Vm*%')]();}else{document[_0x15b4('1d1','tWEH')]('link')[_0x15b4('1d2','!o$z')]();}}else{if(_0x44fd02[_0x15b4('1d3','fTWv')]===_0x44fd02['ZgZKh']){var _0x16cf6d=_0x44fd02[_0x15b4('1d4','tWEH')](_0x44fd02[_0x15b4('1d5','Bb3L')](_0x15b4('1d6','I0@('),up['pbgjz'][i]),_0x44fd02[_0x15b4('1d7','bVZ)')]);_0x44fd02['qNvef']($,_0x15b4('1d8','a9^W'))[_0x15b4('1d9','Vm*%')](_0x16cf6d);}else{var _0x11839f=_0x15b4('1da','7y&0')+PAR[_0x15b4('1db','J2HV')]+_0x15b4('1dc','I0@(')+PAR[_0x15b4('1dd','c0S*')]+'</i>s</d><d\x20class=\x22conplaying\x22>否</d>';$(_0x44fd02['HLnwL'])[_0x15b4('1de','vNOA')](_0x11839f);var _0x21260a=document['getElementById'](_0x44fd02['GJEBo']);var _0x1d1c46=_0x21260a[_0x15b4('1df','eKXt')];var _0x107a16=null;_0x44fd02['ETxqL'](setTimeout,function(){var _0x1fe408={'QVMMk':_0x44fd02[_0x15b4('1e0','OZnY')],'NBwpy':function(_0x220a9e,_0x3a5053){return _0x44fd02[_0x15b4('1e1','khU@')](_0x220a9e,_0x3a5053);},'DpgQv':_0x15b4('1e2','OZnY'),'UGVLw':_0x44fd02[_0x15b4('1e3','3y86')],'VNrff':function(_0x3a6d7f,_0x30f2db){return _0x3a6d7f==_0x30f2db;},'gsPCg':function(_0x2c3c4f,_0x2d9920){return _0x2c3c4f(_0x2d9920);},'BfORV':_0x44fd02['KsvUL']};_0x107a16=setInterval(function(){if(_0x1fe408[_0x15b4('1e4','!o$z')](_0x1fe408[_0x15b4('1e5','$BjF')],_0x1fe408[_0x15b4('1e6','xfLW')])){layer[_0x15b4('1e7','$BjF')](_0x1fe408[_0x15b4('1e8','D[C(')]);}else{_0x1d1c46--;_0x21260a[_0x15b4('1e9','QeCg')]=_0x1d1c46;if(_0x1fe408[_0x15b4('1ea','UGv^')](_0x1d1c46,0x0)){clearInterval(_0x107a16);PAR[_0x15b4('1eb','QeCg')]['seek']();PAR['dp'][_0x15b4('1ec','tzTY')]();_0x1fe408[_0x15b4('1ed','7y&0')]($,_0x1fe408[_0x15b4('1ee','QeCg')])[_0x15b4('1ef','x4w7')]();}}},0x3e8);},0x1);}};var _0x57e9a6=_0x15b4('1f0','fTWv')+PAR['ctime']+'</span><span\x20class=\x22play-jump\x22>跳转播放</span></div></div>';_0x44fd02[_0x15b4('1f1','c0S*')]($,_0x44fd02[_0x15b4('1f2','UGv^')],parent[_0x15b4('1f3','khU@')])['remove']();_0x44fd02['BWoQu']($,_0x44fd02['pzJVB'])[_0x15b4('1f4','Bb3L')](_0x57e9a6);_0x44fd02[_0x15b4('1f5','Iy0I')]($,_0x44fd02[_0x15b4('1f6','5EIn')])['on'](_0x44fd02['EIuSt'],function(){if(_0x44fd02[_0x15b4('1f7','a]Oa')](_0x15b4('1f8','fTWv'),_0x44fd02[_0x15b4('1f9','Vm*%')])){$(_0x44fd02[_0x15b4('1fa','Zs3n')])[_0x15b4('1fb','I0@(')]();}else{if(PAR['ad']['video'][_0x15b4('1fc','8h6M')]>_0x44fd02[_0x15b4('1fd','x4w7')](PAR['ad'][_0x15b4('1fe','3y86')]['duration'],0.1)){var _0x7dbbdc=_0x44fd02[_0x15b4('1ff','f)XP')]['split']('|'),_0x24041b=0x0;while(!![]){switch(_0x7dbbdc[_0x24041b++]){case'0':_0x44fd02[_0x15b4('200','Zs3n')]($,_0x44fd02[_0x15b4('201','QeCg')])['remove']();continue;case'1':$(_0x44fd02[_0x15b4('202','5EIn')])[_0x15b4('203','Iy0I')]();continue;case'2':_0x44fd02[_0x15b4('204','wHsA')]($,_0x44fd02[_0x15b4('205','jX$g')])[_0x15b4('206','tWEH')](_0x44fd02[_0x15b4('207','vzyU')]);continue;case'3':PAR['ad']['destroy']();continue;case'4':PAR[_0x15b4('208','tWEH')](config[_0x15b4('209','fTWv')]);continue;}break;}}}});_0x44fd02['zxCjm'](setTimeout,function(){$(_0x15b4('20a','7y&0'))['remove']();},0x14*0x3e8);_0x44fd02['WCaPx']($,'.conplaying')['on'](_0x44fd02[_0x15b4('20b','xB(L')],function(){clearTimeout(_0x107a16);$(_0x44fd02[_0x15b4('20c','$BjF')])['remove']();PAR['dp']['play']();PAR['jump']['head']();});_0x44fd02[_0x15b4('20d','vNOA')]($,_0x44fd02[_0x15b4('20e','c0S*')])['on'](_0x15b4('1d2','!o$z'),function(){_0x44fd02['RqVNI'](clearTimeout,_0x107a16);PAR['video'][_0x15b4('20f','Q7o)')]();_0x44fd02[_0x15b4('210','vzyU')]($,_0x15b4('211','0)8)'))[_0x15b4('212','OZnY')]();PAR['dp'][_0x15b4('1ec','tzTY')]();});}},'jump':{'def':function(){var _0xa409c7={'FBuMb':'请输入有效时间哟！','Xijxt':function(_0x3a8a12,_0x148713){return _0x3a8a12(_0x148713);},'ZGRUz':function(_0x3bdd59,_0x22d9fc){return _0x3bdd59(_0x22d9fc);},'THKLT':_0x15b4('213','D[C('),'hDFBL':function(_0x363238,_0x25c896){return _0x363238===_0x25c896;},'kFGgh':_0x15b4('214','tzTY'),'DNrCb':'设置完成，将在刷新或下一集生效','SzOPn':function(_0x951928,_0x37576e){return _0x951928>_0x37576e;},'ZLhMn':function(_0x4c10db,_0x26906f){return _0x4c10db>_0x26906f;},'AgJco':_0x15b4('215','c0S*'),'tbSJc':function(_0x115b76){return _0x115b76();},'rZqkn':function(_0x26d046,_0x2db5d0){return _0x26d046!==_0x2db5d0;},'shHUD':_0x15b4('216','tWEH'),'vzUsg':function(_0x25908b){return _0x25908b();},'onfel':_0x15b4('217','p5&!'),'OIolj':function(_0x19b0e6,_0x29c24e){return _0x19b0e6>_0x29c24e;},'cShFf':function(_0xf59447,_0x22f259){return _0xf59447!==_0x22f259;},'GAsqV':_0x15b4('218','Bb3L'),'SVUti':function(_0x3a621d,_0x1b00d0){return _0x3a621d(_0x1b00d0);},'ZkfCT':_0x15b4('219','!o$z'),'dJrqM':_0x15b4('21a','Ya)8'),'DWqUT':_0x15b4('21b','Vlh&'),'OWWFh':_0x15b4('21c','0)8)'),'uQhRn':function(_0x22b026,_0x2f8f64,_0x29bca9,_0x2766d1,_0x52c91f,_0x5c23d2,_0x3e21a4){return _0x22b026(_0x2f8f64,_0x29bca9,_0x2766d1,_0x52c91f,_0x5c23d2,_0x3e21a4);},'IsPYA':'frists','nHxee':'lasts','qnpwW':'lastt','gWOwV':function(_0x127e3a,_0x11b1e4){return _0x127e3a(_0x11b1e4);}};h=_0xa409c7[_0x15b4('21d','Q7o)')];l=_0xa409c7['dJrqM'];f=_0xa409c7['DWqUT'];j=_0xa409c7[_0x15b4('21e','i88a')];_0xa409c7['uQhRn'](_0x2fb36f,h,_0xa409c7[_0x15b4('21f','bVZ)')],PAR[_0x15b4('220','$BjF')],_0x15b4('221','c0S*'),PAR[_0x15b4('222','xB(L')],f);_0xa409c7['uQhRn'](_0x2fb36f,l,_0xa409c7[_0x15b4('223','I0@(')],PAR[_0x15b4('224','Iy0I')],_0xa409c7[_0x15b4('225','a]Oa')],PAR[_0x15b4('226','AIBX')],j);function _0x5703e2(){layer['msg'](_0xa409c7[_0x15b4('227','tWEH')]);}function _0x28147b(){if(_0xa409c7[_0x15b4('228','8h6M')](_0xa409c7[_0x15b4('229','J2HV')],_0xa409c7[_0x15b4('22a','vzyU')])){layer['msg'](_0xa409c7[_0x15b4('22b','khU@')]);}else{var _0x988a66={'AwUcC':function(_0x343dc9,_0x25fd15){return _0xa409c7['Xijxt'](_0x343dc9,_0x25fd15);},'nsfHi':function(_0x33fc4b,_0x474e89){return _0x33fc4b>_0x474e89;}};_0xa409c7['ZGRUz']($,b)[_0x15b4('22c','RM$#')](_0xa409c7[_0x15b4('22d','Zs3n')]);$(b)['click'](function(){o=_0x988a66[_0x15b4('22e','I0@(')]($,t)['val']();if(_0x988a66[_0x15b4('22f','Iy0I')](o,0x0)){yzmck['set'](c,0x0);}else{_0x5703e2();};});}}function _0x2fb36f(_0x28c24b,_0x30624f,_0xadcd50,_0x2544d3,_0xbbbb5e,_0x3807e3){var _0x1d0fe1={'WxZZf':function(_0x468cf3,_0x2911c4){return _0xa409c7['ZGRUz'](_0x468cf3,_0x2911c4);},'WwVjU':_0x15b4('230','Knq)'),'mumST':function(_0x1cf7d7,_0x4a5cd6){return _0xa409c7['ZLhMn'](_0x1cf7d7,_0x4a5cd6);},'oKRgd':function(_0x351eca,_0x35c930){return _0x351eca===_0x35c930;},'UmLlC':_0xa409c7[_0x15b4('231','td5S')],'yrLBj':function(_0x1fead7,_0x3fb51e){return _0xa409c7[_0x15b4('232','4TBk')](_0x1fead7,_0x3fb51e);},'QdMqH':function(_0x1a96b2){return _0xa409c7[_0x15b4('233','vNOA')](_0x1a96b2);},'otZxR':function(_0x429a9b,_0x4d5d20){return _0xa409c7['ZGRUz'](_0x429a9b,_0x4d5d20);},'JKrga':function(_0x4f3d0c,_0x2f965f){return _0xa409c7[_0x15b4('234','RfIT')](_0x4f3d0c,_0x2f965f);},'DYBvb':_0xa409c7[_0x15b4('235','RM$#')],'GxnGg':function(_0x3a8cfc){return _0xa409c7['vzUsg'](_0x3a8cfc);},'LcJtl':_0xa409c7[_0x15b4('236','p5&!')],'vXbpC':_0x15b4('237','0)8)'),'ZflnG':function(_0x4df12c,_0x31bba7){return _0xa409c7[_0x15b4('238','7y&0')](_0x4df12c,_0x31bba7);}};_0xa409c7[_0x15b4('239','xfLW')]($,_0x28c24b)['on'](_0x15b4('23a','a]Oa'),function(){var _0x106cee={'CfKrj':function(_0x3eed3a,_0x71ee18){return _0x1d0fe1[_0x15b4('23b','Vm*%')](_0x3eed3a,_0x71ee18);},'yQvue':_0x1d0fe1[_0x15b4('23c','Q7o)')],'iSBRI':function(_0x2c6d31){return _0x2c6d31();}};if(_0x15b4('23d','J&Q@')!==_0x15b4('23e','QeCg')){_0x106cee['CfKrj']($,_0x28c24b)[_0x15b4('23f','xDZw')](_0x106cee['yQvue']);_0x106cee[_0x15b4('240','xDZw')](_0x28147b);_0xbbbb5e=_0x106cee[_0x15b4('241','I0@(')]($,_0x3807e3)[_0x15b4('242','p5&!')]();yzmck[_0x15b4('243','3y86')](_0x2544d3,_0xbbbb5e);}else{o=$(_0x3807e3)[_0x15b4('244','7y&0')]();if(_0x1d0fe1['mumST'](o,0x0)){if(_0x1d0fe1['oKRgd'](_0x1d0fe1['UmLlC'],_0x15b4('245','xfLW'))){_0x1d0fe1[_0x15b4('246','!o$z')]($,_0x28c24b)['toggleClass'](_0x15b4('247','7y&0'));_0x1d0fe1['QdMqH'](_0x28147b);_0xbbbb5e=_0x1d0fe1['otZxR']($,_0x3807e3)['val']();yzmck[_0x15b4('248','5EIn')](_0x2544d3,_0xbbbb5e);}else{PAR[_0x15b4('249','xDZw')][_0x15b4('24a','tWEH')]();}}else{if(_0x1d0fe1[_0x15b4('24b','yYg5')](_0x1d0fe1['DYBvb'],_0x1d0fe1[_0x15b4('24c','f)XP')])){PAR['dp']['play']();PAR['jump'][_0x15b4('24d','fTWv')]();}else{_0x1d0fe1[_0x15b4('24e','fTWv')](_0x5703e2);}};}});if(_0xadcd50==0x1){if(_0xa409c7['cShFf'](_0xa409c7['GAsqV'],_0xa409c7[_0x15b4('24f','J2HV')])){yzmck[_0x15b4('250','a]Oa')](_0x30624f,0x0);}else{_0xa409c7[_0x15b4('251','UGv^')]($,_0x28c24b)[_0x15b4('252','i88a')](_0x15b4('253','eKXt'));_0xa409c7[_0x15b4('254','4TBk')]($,_0x28c24b)[_0x15b4('255','tzTY')](function(){var _0x202dd9={'xUlKl':_0x1d0fe1['LcJtl']};if(_0x1d0fe1['vXbpC']===_0x1d0fe1['vXbpC']){o=$(_0x3807e3)[_0x15b4('256','Vlh&')]();if(_0x1d0fe1[_0x15b4('257','Knq)')](o,0x0)){yzmck[_0x15b4('258','0)8)')](_0x30624f,0x0);}else{_0x1d0fe1[_0x15b4('259','0)8)')](_0x5703e2);};}else{var _0x142dbc=_0x202dd9[_0x15b4('25a','eKXt')][_0x15b4('25b','QeCg')]('|'),_0x2c72e0=0x0;while(!![]){switch(_0x142dbc[_0x2c72e0++]){case'0':that['console'][_0x15b4('25c','!o$z')]=func;continue;case'1':that['console'][_0x15b4('25d','Knq)')]=func;continue;case'2':that['console']['error']=func;continue;case'3':that[_0x15b4('49','jX$g')]['info']=func;continue;case'4':that[_0x15b4('25e','x4w7')][_0x15b4('25f','eKXt')]=func;continue;case'5':that[_0x15b4('260','AIBX')][_0x15b4('261','f)XP')]=func;continue;case'6':that[_0x15b4('262','td5S')]['warn']=func;continue;}break;}}});}}else{$(_0x28c24b)['click'](function(){o=_0xa409c7['ZGRUz']($,_0x3807e3)['val']();if(_0xa409c7[_0x15b4('263','c0S*')](o,0x0)){yzmck[_0x15b4('264','td5S')](_0x30624f,0x1);}else{_0x5703e2();};});}};_0xa409c7['gWOwV']($,f)[_0x15b4('265','(7Pg')]({'value':PAR[_0x15b4('266','RfIT')]});$(j)[_0x15b4('267','I0@(')]({'value':PAR['lastt']});PAR['jump'][_0x15b4('268','D[C(')]();},'head':function(){var _0x420c4={'tLOBd':function(_0x2b0b0d,_0x8ab13a){return _0x2b0b0d(_0x8ab13a);},'aCBHI':_0x15b4('269','RM$#'),'WWeoe':function(_0x58354e,_0x1b02a3){return _0x58354e>_0x1b02a3;},'HRclC':function(_0x36e5a6,_0x580e31){return _0x36e5a6==_0x580e31;},'VvwYP':function(_0x145f74,_0xe80a5){return _0x145f74!==_0xe80a5;},'LqING':_0x15b4('26a','xDZw'),'YaqwD':function(_0x32ac40,_0x17113d){return _0x32ac40==_0x17113d;}};if(_0x420c4['WWeoe'](PAR[_0x15b4('26b','wHsA')],PAR[_0x15b4('26c','c0S*')]))PAR['playtime']=PAR['stime'];if(_0x420c4[_0x15b4('26d','UGv^')](PAR[_0x15b4('26e','J2HV')],0x1)){if(_0x420c4[_0x15b4('26f','I0@(')](_0x420c4['LqING'],_0x420c4[_0x15b4('270','Iy0I')])){_0x420c4[_0x15b4('271','7y&0')]($,_0x420c4['aCBHI'])[_0x15b4('272','bVZ)')](_0x420c4['tLOBd']($,this)[_0x15b4('273','xDZw')]());}else{if(_0x420c4['WWeoe'](PAR[_0x15b4('274','yYg5')],PAR['playtime'])||PAR[_0x15b4('275','eKXt')]==0x0){PAR['jump_f']=0x1;}else{PAR['jump_f']=0x0;}}}if(_0x420c4[_0x15b4('276','khU@')](PAR[_0x15b4('277','vzyU')],0x1)){PAR['dp']['seek'](PAR[_0x15b4('221','c0S*')]);PAR['dp'][_0x15b4('278','wHsA')]('已为您跳过片头');}},'last':function(){var _0x2f373a={'jLock':'.list-show','EDbhx':function(_0x5878,_0x14ddc9){return _0x5878(_0x14ddc9);},'RJEzS':'.danmuku-num','pdpmM':function(_0x5a8c7a,_0x724c5a){return _0x5a8c7a(_0x724c5a);},'GaRYE':function(_0x148dbc,_0x502bfb){return _0x148dbc-_0x502bfb;},'LvnZr':function(_0x457f13,_0x4c0042){return _0x457f13<_0x4c0042;},'DcTjq':_0x15b4('279','3y86'),'PohpR':function(_0x58bad4,_0x40941f){return _0x58bad4>_0x40941f;},'jnOrC':function(_0x110a78,_0x4f4516){return _0x110a78<_0x4f4516;},'iHRgS':function(_0x420f52,_0x5261cd){return _0x420f52!==_0x5261cd;},'ykTnp':'xdHXj','bLxWx':function(_0x4af80d,_0x237f83){return _0x4af80d+_0x237f83;},'jyQOQ':_0x15b4('27a','jX$g'),'oqLdF':function(_0x3aff9d,_0x1e3ea2){return _0x3aff9d!=_0x1e3ea2;},'UpSWl':function(_0x161b78,_0x55799c){return _0x161b78===_0x55799c;},'mAFjp':'rHDqW','WPPkk':_0x15b4('27b','5EIn'),'ipkbW':function(_0x1f312c,_0x27b197,_0x4b830a){return _0x1f312c(_0x27b197,_0x4b830a);},'eRxoB':function(_0x5746c7,_0x423da3){return _0x5746c7(_0x423da3);}};if(_0x2f373a[_0x15b4('27c','QeCg')](config[_0x15b4('27d','Knq)')],'')){if(_0x2f373a[_0x15b4('27e','J&Q@')](_0x2f373a[_0x15b4('27f','5EIn')],_0x2f373a[_0x15b4('280','td5S')])){layer[_0x15b4('281','eKXt')](_0x15b4('282','J2HV'));}else{if(PAR[_0x15b4('283','RfIT')]==0x1){_0x2f373a[_0x15b4('284','Iy0I')](setInterval,function(){var _0x52dcee=_0x2f373a[_0x15b4('285','a9^W')](PAR['dp'][_0x15b4('286','x4w7')][_0x15b4('287','xDZw')],PAR['dp'][_0x15b4('288','eKXt')][_0x15b4('289','p5&!')]);if(_0x2f373a[_0x15b4('28a','AIBX')](_0x52dcee,PAR[_0x15b4('28b','Ed]v')]))PAR['dp']['notice'](_0x2f373a['DcTjq']);if(_0x2f373a['PohpR'](PAR['lastt'],0x0)&&_0x2f373a[_0x15b4('28c','I0@(')](_0x52dcee,PAR[_0x15b4('28d','x4w7')])){if(_0x2f373a[_0x15b4('28e','wHsA')]('vQAls',_0x2f373a['ykTnp'])){PAR['setCookie'](_0x2f373a[_0x15b4('28f','8h6M')](_0x2f373a[_0x15b4('290','bVZ)')],config[_0x15b4('291','Bb3L')]),'',-0x1);PAR[_0x15b4('292','vNOA')][_0x15b4('293','xDZw')]();}else{var _0x2cc348={'ieAai':_0x2f373a[_0x15b4('294','RfIT')]};a=d[_0x15b4('295','xDZw')];b=d[_0x15b4('296','tzTY')];c=d[_0x15b4('297','xDZw')];_0x2f373a[_0x15b4('298','vzyU')]($,_0x2f373a[_0x15b4('299','xB(L')])[_0x15b4('29a','c0S*')](c);_0x2f373a[_0x15b4('29b','J2HV')]($,a)[_0x15b4('29c','RM$#')](function(_0x276d5b,_0x2e58f7){l=_0x15b4('29d','(7Pg')+_0x2e58f7[0x0]+_0x15b4('29e','wHsA')+PAR[_0x15b4('29f','Zs3n')](_0x2e58f7[0x0])+_0x15b4('2a0','xB(L')+_0x2e58f7[0x4]+'\x22>'+_0x2e58f7[0x4]+_0x15b4('2a1','5EIn')+_0x2e58f7[0x3]+'\x20\x20IP地址：'+_0x2e58f7[0x5]+'\x22>'+_0x2e58f7[0x6]+_0x15b4('2a2','xfLW')+_0x2e58f7[0x5]+_0x15b4('2a3','Q7o)')+b+_0x15b4('2a4','xfLW')+_0x2e58f7[0x4]+'\x27,\x27'+_0x2e58f7[0x3]+_0x15b4('2a5','jX$g');$(_0x2cc348['ieAai'])[_0x15b4('2a6','8h6M')](l);});}};},0x3e8);};}}else{_0x2f373a[_0x15b4('2a7','3y86')]($,_0x15b4('2a8','3y86'))[_0x15b4('2a9','Zs3n')]();};},'ad':function(_0x3b79c2,_0x31b432){}},'danmu':{'send':function(){var _0x5e634e={'YRHAc':function(_0x661596,_0x18ad4f){return _0x661596+_0x18ad4f;},'uTFag':_0x15b4('2aa','Zs3n'),'VJnEl':function(_0x1a9d37,_0x2082db){return _0x1a9d37(_0x2082db);},'sUzER':_0x15b4('2ab','Ya)8'),'nqMCJ':function(_0xffcedd,_0x20ad05){return _0xffcedd(_0x20ad05);},'Sjwdw':'size','LSDml':'jOwsK','XGbFu':function(_0x38f84a,_0x2f61c7){return _0x38f84a(_0x2f61c7);},'KhVZV':_0x15b4('2ac','jX$g'),'NhegG':_0x15b4('2ad','Vlh&'),'ZjbMw':function(_0x4197c1,_0x50334b){return _0x4197c1!==_0x50334b;},'bMgJb':'OeXZp','RnvoO':function(_0x156364,_0x35c4db){return _0x156364==_0x35c4db;},'mwwCO':_0x15b4('2ae','xfLW'),'vbIfg':function(_0x353f06,_0x953dc6,_0x129760){return _0x353f06(_0x953dc6,_0x129760);},'LqeRJ':function(_0x2c97ad,_0x42c453){return _0x2c97ad+_0x42c453;},'GMccY':function(_0x5bdcda,_0x42d1ee){return _0x5bdcda===_0x42d1ee;},'GoFOc':function(_0xf5b99d,_0x459f1f){return _0xf5b99d(_0x459f1f);},'LZbuh':function(_0xffb7b3,_0x1a7dfc){return _0xffb7b3>_0x1a7dfc;},'gwcYG':function(_0x15e646,_0x3c64d2){return _0x15e646!=_0x3c64d2;},'fpZvi':_0x15b4('2af','c0S*'),'yWOtL':function(_0x376977,_0x7fdadc){return _0x376977<_0x7fdadc;},'QvzLZ':_0x15b4('2b0','fTWv'),'pepud':_0x15b4('2b1','RfIT'),'wgWgp':function(_0xa6691d,_0x486989){return _0xa6691d!=_0x486989;},'ngLZI':function(_0x44c6fd,_0x930dc){return _0x44c6fd===_0x930dc;},'PxotU':_0x15b4('2b2','(7Pg'),'sSZPV':function(_0x4b2442,_0xd9840e){return _0x4b2442!==_0xd9840e;},'XuWUd':_0x15b4('2b3','td5S'),'jbdBf':_0x15b4('2b4','tzTY'),'yTCVo':'dmsent','vNnaD':function(_0x493601,_0x1a0635){return _0x493601-_0x1a0635;},'WTKlp':function(_0x5460c4,_0x296266){return _0x5460c4*_0x296266;},'PETVr':function(_0x93dd7c,_0x3fa2e1){return _0x93dd7c!==_0x3fa2e1;},'tqQwt':_0x15b4('2b5','Bb3L'),'ujjXP':_0x15b4('2b6','c0S*'),'ByanK':function(_0x16ec02,_0x3ad023){return _0x16ec02+_0x3ad023;},'ahXZa':_0x15b4('2b7','Ya)8'),'rGzRn':_0x15b4('2b8','OZnY'),'OVpzb':function(_0x2e7dd6,_0x46f0a8){return _0x2e7dd6==_0x46f0a8;},'NMJZD':function(_0x25ace5,_0x1cc560){return _0x25ace5(_0x1cc560);},'PcZxs':'.memory-play-wrap,#loading-box','wfRLG':_0x15b4('2b9','c0S*'),'OpsOT':_0x15b4('2ba','RM$#'),'FhdWM':_0x15b4('2bb','i88a'),'eAukX':function(_0x17d527){return _0x17d527();},'qHUCa':_0x15b4('2bc','Ed]v'),'CqdTe':_0x15b4('2bd','OZnY'),'ZdxJs':_0x15b4('2be','D[C('),'aSoxy':function(_0x56905d,_0x2b7020){return _0x56905d(_0x2b7020);}};g=$(_0x5e634e['qHUCa']);d=_0x5e634e['NMJZD']($,_0x5e634e[_0x15b4('2bf','UGv^')]);h=_0x15b4('2c0','(7Pg');_0x5e634e[_0x15b4('2c1','D[C(')]($,_0x5e634e[_0x15b4('2c2','xB(L')](h,_0x15b4('2c3','a]Oa')))['on'](_0x15b4('2c4','5EIn'),function(){if('JwfzA'===_0x5e634e[_0x15b4('2c5','J2HV')]){c_start=_session[_0x15b4('5e','OZnY')](_0x5e634e[_0x15b4('2c6','tWEH')](c_name,'='));if(c_start!==-0x1){var _0x3e1c13=_0x5e634e[_0x15b4('2c7','RfIT')][_0x15b4('2c8','3y86')]('|'),_0x572cb6=0x0;while(!![]){switch(_0x3e1c13[_0x572cb6++]){case'0':c_end=_session['indexOf'](';',c_start);continue;case'1':if(c_end===-0x1){c_end=_session[_0x15b4('2c9','vzyU')];}continue;case'2':;continue;case'3':c_start=c_start+c_name[_0x15b4('2ca','!o$z')]+0x1;continue;case'4':return _0x5e634e['VJnEl'](unescape,_session['substring'](c_start,c_end));}break;}}}else{r=_0x5e634e[_0x15b4('2cb','7y&0')]($,this)[_0x15b4('2cc','c0S*')]('value');setTimeout(function(){d['css']({'color':r});},0x64);}});$(_0x5e634e['ByanK'](h,_0x5e634e[_0x15b4('2cd','khU@')]))['on'](_0x5e634e[_0x15b4('2ce','5EIn')],function(){var _0x1a610a={'oWgVe':_0x5e634e[_0x15b4('2cf','5EIn')],'lWFSw':_0x5e634e['LSDml']};t=_0x5e634e[_0x15b4('2d0','yYg5')]($,this)[_0x15b4('2cc','c0S*')](_0x5e634e[_0x15b4('2d1','xfLW')]);setTimeout(function(){if(_0x15b4('2d2','bVZ)')===_0x1a610a['lWFSw']){d['attr'](_0x1a610a['oWgVe'],t);}else{d[_0x15b4('e0','yYg5')](_0x15b4('2d3','AIBX'),t);}},0x64);});_0x5e634e[_0x15b4('2d4','J&Q@')]($,h+_0x15b4('2d5','RfIT'))['on'](_0x5e634e[_0x15b4('2d6','a]Oa')],function(){var _0x1a9c02={'NUIcU':_0x5e634e[_0x15b4('2d7','f)XP')],'xoFcV':function(_0x24bff6,_0x861895){return _0x5e634e[_0x15b4('2d8','tWEH')](_0x24bff6,_0x861895);},'fOyGf':_0x5e634e[_0x15b4('2d9','OZnY')],'swIiJ':_0x5e634e[_0x15b4('2da','a9^W')]};if(up[_0x15b4('2db','xfLW')]>0x0&&_0x5e634e[_0x15b4('2dc','Ed]v')](config['group'],config[_0x15b4('2dd','!o$z')])){if(_0x5e634e[_0x15b4('2de','4TBk')](_0x15b4('2df','tzTY'),_0x15b4('2e0','td5S'))){PAR['video'][_0x15b4('2e1','xfLW')]();}else{layer['msg'](_0x5e634e[_0x15b4('2e2','Vm*%')]);return;}};t=_0x5e634e[_0x15b4('2e3','c0S*')]($,this)['attr'](_0x5e634e[_0x15b4('2e4','AIBX')]);setTimeout(function(){var _0x4cd7b9={'giypV':_0x1a9c02['NUIcU']};if(_0x1a9c02[_0x15b4('2e5','jX$g')](_0x1a9c02[_0x15b4('2e6','Vm*%')],_0x1a9c02['fOyGf'])){if(a['search'](up[_0x15b4('2e7','OZnY')][i])!=-0x1){layer[_0x15b4('2e8','jX$g')](_0x4cd7b9[_0x15b4('2e9','J&Q@')]);return;}}else{d['attr'](_0x1a9c02[_0x15b4('2ea','!o$z')],t);}},0x64);});g['on'](_0x15b4('2eb','I0@('),function(){var _0x981900={'yrgwH':function(_0x305595,_0x5c0ec1){return _0x5e634e['LqeRJ'](_0x305595,_0x5c0ec1);},'maGvW':function(_0x385fba,_0x251928){return _0x5e634e[_0x15b4('2ec','0)8)')](_0x385fba,_0x251928);},'qyZGO':function(_0x3999a1,_0x22466e){return _0x5e634e[_0x15b4('2ed','p5&!')](_0x3999a1,_0x22466e);},'aAFAi':function(_0xba3f,_0x553c8e){return _0x5e634e[_0x15b4('2ee','td5S')](_0xba3f,_0x553c8e);},'QIEMe':_0x15b4('2ef','OZnY')};a=document[_0x15b4('2f0','8h6M')]('dmtext');a=a['value'];b=d[_0x15b4('2f1','AIBX')](_0x15b4('2f2','a]Oa'));c=d[_0x15b4('2f3','OZnY')]('color');z=d[_0x15b4('2f4','a]Oa')](_0x15b4('2f5','tWEH'));if(_0x5e634e['LZbuh'](up[_0x15b4('2f6','tzTY')],0x0)&&config[_0x15b4('2f7','D[C(')]<config[_0x15b4('2f8','a]Oa')]&&_0x5e634e[_0x15b4('2f9','Vm*%')](config[_0x15b4('2fa','UGv^')],'')){layer[_0x15b4('2fb','Vlh&')](_0x5e634e[_0x15b4('2fc','vNOA')]);return;}for(var _0x309f54=0x0;_0x5e634e[_0x15b4('2fd','xDZw')](_0x309f54,up[_0x15b4('2fe','8h6M')]['length']);_0x309f54++){if(_0x5e634e[_0x15b4('2ff','7y&0')](_0x5e634e[_0x15b4('300','(7Pg')],_0x5e634e[_0x15b4('301','Vlh&')])){if(_0x5e634e[_0x15b4('302','J2HV')](a[_0x15b4('303','vzyU')](up[_0x15b4('304','eKXt')][_0x309f54]),-0x1)){if(_0x5e634e['ngLZI'](_0x5e634e['PxotU'],_0x15b4('305','Iy0I'))){c_start=_0x981900[_0x15b4('306','4TBk')](c_start,c_name[_0x15b4('307','vNOA')])+0x1;c_end=_session[_0x15b4('308','Ed]v')](';',c_start);if(_0x981900[_0x15b4('309','tWEH')](c_end,-0x1)){c_end=_session[_0x15b4('30a','I0@(')];};return unescape(_session['substring'](c_start,c_end));}else{layer[_0x15b4('30b','p5&!')](_0x5e634e[_0x15b4('30c','p5&!')]);return;}}}else{timer=_0x5e634e[_0x15b4('30d','Ed]v')](setInterval,function(){num--;span['innerHTML']=num;if(_0x981900[_0x15b4('30e','Ed]v')](num,0x0)){_0x981900['aAFAi'](clearInterval,timer);PAR['video']['seek']();PAR['dp'][_0x15b4('16f','Bb3L')]();$(_0x981900[_0x15b4('30f','4TBk')])[_0x15b4('310','Q7o)')]();}},0x3e8);}}if(_0x5e634e[_0x15b4('311','tWEH')](a[_0x15b4('312','i88a')],0x1)){if(_0x5e634e[_0x15b4('313','wHsA')](_0x5e634e['XuWUd'],_0x5e634e[_0x15b4('314','tWEH')])){layer[_0x15b4('315','Zs3n')](_0x15b4('316','td5S'));return;}else{PAR[_0x15b4('317','J&Q@')][_0x15b4('318','3y86')][_0x15b4('319','vNOA')](PAR['ads'][_0x15b4('31a','OZnY')]['link'],PAR['ads'][_0x15b4('31b','!o$z')]['pic']);}}var _0x3b8392=Date['parse'](new Date());var _0x895c29=yzmck[_0x15b4('31c','(7Pg')](_0x5e634e[_0x15b4('31d','td5S')],_0x3b8392);if(_0x5e634e[_0x15b4('31e','J2HV')](_0x5e634e['vNnaD'](_0x3b8392,_0x895c29),_0x5e634e['WTKlp'](config[_0x15b4('31f','AIBX')],0x3e8))){if(_0x5e634e[_0x15b4('320','i88a')](_0x5e634e[_0x15b4('321','J2HV')],_0x5e634e[_0x15b4('322','8h6M')])){layer[_0x15b4('323','xB(L')](_0x5e634e['ByanK'](_0x5e634e[_0x15b4('324','td5S')],config['sendtime'])+'秒~');return;}else{PAR['danmu']['post_r'](a,b,c,d,'引战');}}d[_0x15b4('256','Vlh&')]('');PAR['dp'][_0x15b4('325','td5S')][_0x15b4('326','Ya)8')]({'text':a,'color':c,'type':b,'size':z});yzmck['set']('dmsent',_0x3b8392);});function _0x2450f8(){g[_0x15b4('327','x4w7')](_0x5e634e[_0x15b4('328','xfLW')]);};d[_0x15b4('329','xfLW')](function(_0x382383){var _0x536236={'ZjXkx':function(_0x4438f2,_0x2ce058){return _0x5e634e['OVpzb'](_0x4438f2,_0x2ce058);},'QoEBe':function(_0x268e64,_0x4636a3){return _0x5e634e['NMJZD'](_0x268e64,_0x4636a3);},'lXBMr':function(_0x1b4266,_0x40cf33){return _0x5e634e['NMJZD'](_0x1b4266,_0x40cf33);},'PgqqT':_0x5e634e['PcZxs']};if(_0x5e634e[_0x15b4('32a','5EIn')]!==_0x5e634e[_0x15b4('32b','a]Oa')]){if(_0x382383['keyCode']==0xd){if(_0x15b4('32c','wHsA')!==_0x5e634e[_0x15b4('32d','khU@')]){PAR[_0x15b4('32e','fTWv')]();}else{_0x5e634e[_0x15b4('32f','Bb3L')](_0x2450f8);}};}else{num--;span[_0x15b4('330','wHsA')]=num;if(_0x536236[_0x15b4('331','x4w7')](num,0x0)){_0x536236['QoEBe'](clearInterval,timer);PAR[_0x15b4('1eb','QeCg')][_0x15b4('332','(7Pg')]();PAR['dp'][_0x15b4('1ec','tzTY')]();_0x536236[_0x15b4('333','a9^W')]($,_0x536236[_0x15b4('334','Bb3L')])['remove']();}}});},'list':function(){var _0x4b1147={'XbcVY':function(_0xba99f8,_0x14cf69){return _0xba99f8(_0x14cf69);},'kLJFa':_0x15b4('335','jX$g'),'Zkgpt':_0x15b4('336','a]Oa'),'DGOFe':function(_0x4a2398,_0x47e884){return _0x4a2398==_0x47e884;},'Jruwb':_0x15b4('337','4TBk'),'aascs':function(_0x31c6ae,_0x216dde){return _0x31c6ae(_0x216dde);},'zNYoD':_0x15b4('338','J&Q@'),'rRKDh':function(_0x3ef400,_0x1e95ff){return _0x3ef400(_0x1e95ff);},'WNfOG':_0x15b4('339','$BjF'),'SSxUT':_0x15b4('33a','Knq)'),'BMWpQ':function(_0x53607a,_0x25cedf){return _0x53607a(_0x25cedf);},'WROQb':function(_0x12c955,_0x592b32){return _0x12c955+_0x592b32;},'eEEzd':_0x15b4('33b','I0@('),'dlJrR':function(_0x3789c7){return _0x3789c7();},'wANkn':function(_0x5b5d1e,_0x59ce1b){return _0x5b5d1e===_0x59ce1b;},'XpuYE':_0x15b4('33c','(7Pg'),'xmMHu':function(_0xa212e7,_0x470078){return _0xa212e7(_0x470078);},'DulbH':'cBdBr','ODoLR':_0x15b4('33d','I0@('),'NrpZa':_0x15b4('33e','a9^W'),'RdSkq':_0x15b4('33f','!o$z'),'ZJkXo':function(_0x520f8c,_0x1da4bc){return _0x520f8c<_0x1da4bc;},'hoPEQ':_0x15b4('340','4TBk'),'gQXxk':_0x15b4('341','c0S*'),'kXlfI':'#vod-title','eCpYA':function(_0xb52c5a,_0x543932,_0x4e90e9,_0x579faa){return _0xb52c5a(_0x543932,_0x4e90e9,_0x579faa);},'TRAxR':_0x15b4('342','fTWv'),'QmoZA':'.yzmplayer-danmu','cJxbs':'show'};_0x4b1147['xmMHu']($,_0x4b1147[_0x15b4('343','wHsA')])['on'](_0x4b1147[_0x15b4('344','vzyU')],function(){_0x4b1147[_0x15b4('345','QeCg')]($,_0x15b4('346','a]Oa'))['empty']();$[_0x15b4('347','td5S')]({'url':_0x4b1147[_0x15b4('348','khU@')](config[_0x15b4('349','J&Q@')]+_0x4b1147[_0x15b4('34a','D[C(')],PAR['id']),'success':function(_0x502446){var _0x54f5a3={'SoUsb':function(_0x26f686,_0x5434cf){return _0x4b1147[_0x15b4('34b','fTWv')](_0x26f686,_0x5434cf);},'GTCBx':_0x4b1147[_0x15b4('34c','RfIT')],'EFgrE':function(_0x1090ae,_0x1a9471){return _0x4b1147[_0x15b4('34d','tWEH')](_0x1090ae,_0x1a9471);},'zLzXu':_0x4b1147['Zkgpt']};if(_0x4b1147[_0x15b4('34e','tWEH')](_0x502446[_0x15b4('34f','vzyU')],0x17)){var _0x7625a1=_0x4b1147[_0x15b4('350','7y&0')][_0x15b4('351','Vlh&')]('|'),_0x38f38c=0x0;while(!![]){switch(_0x7625a1[_0x38f38c++]){case'0':a=_0x502446[_0x15b4('352','a]Oa')];continue;case'1':b=_0x502446['name'];continue;case'2':c=_0x502446[_0x15b4('353','fTWv')];continue;case'3':_0x4b1147['aascs']($,_0x4b1147[_0x15b4('354','xfLW')])[_0x15b4('355','RM$#')](c);continue;case'4':_0x4b1147[_0x15b4('356','Vm*%')]($,a)[_0x15b4('357','fTWv')](function(_0xdb1801,_0x26ed3e){l=_0x15b4('358','x4w7')+_0x26ed3e[0x0]+'\x22><li>'+PAR[_0x15b4('359','AIBX')](_0x26ed3e[0x0])+_0x15b4('35a','tWEH')+_0x26ed3e[0x4]+'\x22>'+_0x26ed3e[0x4]+_0x15b4('35b','a]Oa')+_0x26ed3e[0x3]+'\x20\x20IP地址：'+_0x26ed3e[0x5]+'\x22>'+_0x26ed3e[0x6]+'</li><li\x20class=\x22report\x22\x20onclick=\x22PAR.danmu.report(\x27'+_0x26ed3e[0x5]+_0x15b4('35c','vzyU')+b+_0x15b4('35d','xDZw')+_0x26ed3e[0x4]+'\x27,\x27'+_0x26ed3e[0x3]+_0x15b4('35e','3y86');_0x54f5a3[_0x15b4('35f','(7Pg')]($,_0x54f5a3['GTCBx'])['append'](l);});continue;}break;}}_0x4b1147[_0x15b4('360','a]Oa')]($,_0x4b1147[_0x15b4('361','D[C(')])['on'](_0x4b1147['SSxUT'],function(){PAR['dp'][_0x15b4('362','bVZ)')](_0x54f5a3['EFgrE']($,this)['attr'](_0x54f5a3[_0x15b4('363','eKXt')]));});}});});_0x4b1147[_0x15b4('364','Q7o)')]($,'.yzmplayer-watching-number')[_0x15b4('365','fTWv')](up[_0x15b4('366','RfIT')]);_0x4b1147['xmMHu']($,_0x15b4('367','yYg5'))['html'](_0x4b1147[_0x15b4('368','p5&!')]);for(var _0x58fc50=0x0;_0x4b1147['ZJkXo'](_0x58fc50,up['pbgjz'][_0x15b4('369','yYg5')]);_0x58fc50++){var _0x4105cb=_0x4b1147['hoPEQ']+up['pbgjz'][_0x58fc50]+_0x4b1147[_0x15b4('36a','AIBX')];$(_0x4b1147['kXlfI'])[_0x15b4('36b','p5&!')](_0x4105cb);}_0x4b1147[_0x15b4('36c','x4w7')](_0x380b95,_0x4b1147['TRAxR'],_0x4b1147[_0x15b4('36d','td5S')],_0x4b1147[_0x15b4('36e','yYg5')]);function _0x380b95(_0x4e519a,_0x3c7203,_0x1e648f,_0x44c8d5){var _0xca288b={'SmBnK':function(_0xce56c1){return _0xce56c1();}};if(_0x15b4('36f','xB(L')===_0x4b1147['DulbH']){_0xca288b[_0x15b4('370','UGv^')](er);}else{_0x4b1147['xmMHu']($,_0x4e519a)[_0x15b4('2eb','I0@(')](function(){var _0x4d6091={'bxubf':function(_0x39ce1f){return _0x4b1147[_0x15b4('371','RM$#')](_0x39ce1f);}};if(_0x4b1147[_0x15b4('372','Vm*%')](_0x15b4('373','x4w7'),_0x4b1147[_0x15b4('374','UGv^')])){_0x4d6091[_0x15b4('375','QeCg')](k);}else{_0x4b1147[_0x15b4('376','p5&!')]($,_0x3c7203)['toggleClass'](_0x1e648f);$(_0x44c8d5)[_0x15b4('377','Vlh&')]();}});}}},'report':function(_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a){var _0x1137ef={'bBYfH':function(_0x4187c,_0x360cc3){return _0x4187c!==_0x360cc3;},'AnauB':_0x15b4('378','Iy0I'),'iUhyl':_0x15b4('379','Ed]v'),'Yvfpi':_0x15b4('37a','(7Pg'),'XDPwV':_0x15b4('37b','x4w7'),'AynkL':'ErBbK','FlaCh':_0x15b4('37c','x4w7'),'PZQOK':_0x15b4('37d','i88a'),'xpBTi':'色情低俗','WLsAS':function(_0x3baf34,_0x481965){return _0x3baf34+_0x481965;},'nJPJL':_0x15b4('37e','a]Oa'),'EwgYs':_0x15b4('37f','tWEH'),'dUoJT':_0x15b4('380','4TBk')};layer[_0x15b4('381','Iy0I')](_0x1137ef[_0x15b4('382','a9^W')](''+_0x2cf060,'<!--br><br><span\x20style=\x22color:#333\x22>请选择需要举报的类型</span-->'),{'anim':0x1,'title':_0x15b4('383','khU@'),'btn':[_0x1137ef['PZQOK'],_0x1137ef[_0x15b4('384','c0S*')],_0x1137ef['Yvfpi'],_0x1137ef['nJPJL'],_0x1137ef[_0x15b4('385','J2HV')],_0x1137ef[_0x15b4('386','Iy0I')],_0x15b4('387','Ed]v'),'剧透','引战'],'btn3':function(_0x538fbf,_0x38deb6){var _0x4d8642={'EsuWY':_0x15b4('388','RM$#')};if(_0x1137ef['bBYfH'](_0x1137ef[_0x15b4('389','RM$#')],_0x1137ef[_0x15b4('38a','td5S')])){PAR[_0x15b4('38b','Vlh&')]['post_r'](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,_0x1137ef['Yvfpi']);}else{$(_0x4d8642['EsuWY'])[_0x15b4('38c','tzTY')](_0x15b4('38d','7y&0'));}},'btn4':function(_0x2ffda3,_0x1a6c7a){PAR[_0x15b4('38e','!o$z')][_0x15b4('38f','xfLW')](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,_0x15b4('390','khU@'));},'btn5':function(_0x3982cc,_0x460674){var _0x1ae271={'psvbd':function(_0x20d514){return _0x20d514();}};if(_0x15b4('391','td5S')===_0x1137ef['XDPwV']){PAR[_0x15b4('392','eKXt')][_0x15b4('393','f)XP')](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,_0x15b4('394','vzyU'));}else{_0x1ae271[_0x15b4('395','Bb3L')](er);}},'btn6':function(_0x11aa53,_0x5e3894){if(_0x15b4('396','khU@')!==_0x1137ef['AynkL']){PAR[_0x15b4('397','I0@(')]=0x0;}else{PAR['danmu']['post_r'](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,_0x15b4('398','xfLW'));}},'btn7':function(_0x3a41b0,_0x339f57){PAR[_0x15b4('399','I0@(')]['post_r'](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,_0x15b4('39a','i88a'));},'btn8':function(_0x1c6e4f,_0x131d50){PAR[_0x15b4('39b','8h6M')]['post_r'](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,'剧透');},'btn9':function(_0x4d29b4,_0x4b1358){PAR[_0x15b4('39c','Vm*%')]['post_r'](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,'引战');}},function(_0x345ea8,_0x556841){if(_0x1137ef[_0x15b4('39d','c0S*')]!=='UZomL'){PAR['danmu'][_0x15b4('39e','eKXt')](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,_0x1137ef[_0x15b4('39f','a]Oa')]);}else{_0x35914e=config['id'],_0x4595d9=config[_0x15b4('3a0','f)XP')];}},function(_0x5a7f90){PAR['danmu'][_0x15b4('3a1','I0@(')](_0x35914e,_0x4595d9,_0x2cf060,_0x20ef0a,_0x1137ef['xpBTi']);});},'post_r':function(_0x4dbed9,_0x7d63c1,_0x20a600,_0x3fc820,_0x565aaf){var _0x1383a5={'QAsdd':_0x15b4('3a2','Bb3L'),'WCMqD':function(_0x36d41b,_0x228218){return _0x36d41b+_0x228218;},'tppJn':function(_0x1d712a,_0xcddf58){return _0x1d712a+_0xcddf58;},'GIiBY':function(_0x12b456,_0x539586){return _0x12b456+_0x539586;},'RncOu':function(_0x4e1abc,_0x1fc248){return _0x4e1abc+_0x1fc248;},'QPxdW':_0x15b4('3a3','fTWv'),'FnHZm':'&type=','ReSZB':_0x15b4('3a4','xDZw')};$[_0x15b4('3a5','Vlh&')]({'type':'get','url':_0x1383a5['WCMqD'](_0x1383a5[_0x15b4('3a6','wHsA')](_0x1383a5['tppJn'](_0x1383a5[_0x15b4('3a7','OZnY')](_0x1383a5[_0x15b4('3a8','eKXt')](_0x1383a5[_0x15b4('3a9','f)XP')](_0x1383a5[_0x15b4('3aa','3y86')](_0x1383a5['RncOu'](config[_0x15b4('3ab','f)XP')],'?ac=report&cid=')+_0x3fc820,_0x1383a5[_0x15b4('3ac','wHsA')]),_0x4dbed9),_0x1383a5[_0x15b4('3ad','a]Oa')]),_0x565aaf),'&title='),_0x7d63c1),_0x1383a5['ReSZB'])+_0x20a600,'cache':![],'dataType':_0x15b4('3ae','td5S'),'beforeSend':function(){},'success':function(_0x262b93){layer[_0x15b4('3af','i88a')](_0x1383a5[_0x15b4('3b0','a9^W')]);},'error':function(_0x2f0b8c){var _0x1b4cd5='服务故障\x20or\x20网络异常，稍后再试6！';layer['msg'](_0x1b4cd5);}});}},'setCookie':function(_0x3b8e3f,_0x408e50,_0x2aed93){var _0xdeb8bc={'AcAhw':_0x15b4('3b1','p5&!'),'zDTAI':function(_0x5b75a6,_0x305234){return _0x5b75a6+_0x305234;},'cPvNK':_0x15b4('3b2','vNOA'),'BLnOr':function(_0x5519dd,_0x24196b){return _0x5519dd+_0x24196b;},'keInx':'SRphH','AXbRf':function(_0x8f647,_0x10cce4){return _0x8f647+_0x10cce4;},'hCwkx':function(_0x8f9ed1,_0x13ecb1){return _0x8f9ed1===_0x13ecb1;},'XaHuB':function(_0x29004f,_0x47a0ef){return _0x29004f+_0x47a0ef;}};var _0x1b9ded=new Date();_0x1b9ded[_0x15b4('3b3','wHsA')](_0xdeb8bc[_0x15b4('3b4','xB(L')](_0x1b9ded['getHours'](),_0x2aed93));if(window['sessionStorage']){window[_0x15b4('3b5','Vm*%')][_0x15b4('3b6','tWEH')](_0xdeb8bc['cPvNK'],_0xdeb8bc[_0x15b4('3b7','Vm*%')](_0xdeb8bc[_0x15b4('3b8','AIBX')](_0x3b8e3f,'=')+escape(_0x408e50),_0x2aed93===null?'':_0xdeb8bc[_0x15b4('3b9','c0S*')](_0x15b4('3ba','Iy0I'),_0x1b9ded[_0x15b4('3bb','jX$g')]())));}else{if(_0xdeb8bc[_0x15b4('3bc','xfLW')]!==_0xdeb8bc[_0x15b4('3bd','fTWv')]){document[_0x15b4('3be','f)XP')](_0xdeb8bc['AcAhw'])['click']();}else{document[_0x15b4('3bf','tWEH')]=_0xdeb8bc[_0x15b4('3c0','yYg5')](_0xdeb8bc['AXbRf'](_0x3b8e3f,'=')+escape(_0x408e50),_0xdeb8bc[_0x15b4('3c1','vNOA')](_0x2aed93,null)?'':_0xdeb8bc[_0x15b4('3c2','Knq)')](_0x15b4('3c3','Vlh&'),_0x1b9ded['toGMTString']()));}}},'getCookie':function(_0x23061c){var _0x1bfd8c={'yshxc':function(_0x7ced67,_0x15176c,_0x4ebf19){return _0x7ced67(_0x15176c,_0x4ebf19);},'JjMcu':_0x15b4('3c4','Q7o)'),'JcpyD':'.yzmplayer-setting-speeds\x20\x20.title','IUbtd':function(_0xa8a086,_0x76002a){return _0xa8a086(_0x76002a);},'oqPfW':_0x15b4('3c5','AIBX'),'VDcKU':_0x15b4('3c6','tWEH'),'CPCYZ':function(_0x50ebea,_0x3a4f1f){return _0x50ebea(_0x3a4f1f);},'kCUnA':'.memory-play-wrap,#loading-box','yjIab':function(_0x521184,_0x2de5dd){return _0x521184>_0x2de5dd;},'kxGDF':function(_0x480e72,_0x21d3c2){return _0x480e72!==_0x21d3c2;},'NUlPz':_0x15b4('3c7','Iy0I'),'KNbqf':_0x15b4('3c8','td5S'),'uJWMv':function(_0x7656a6,_0x293f21){return _0x7656a6+_0x293f21;},'qLnSZ':function(_0x1cb0ae,_0x58b835){return _0x1cb0ae!==_0x58b835;},'PwqjR':function(_0x5b26fc,_0x5141e8){return _0x5b26fc+_0x5141e8;},'jGlhx':function(_0x5acb99,_0xb610ee){return _0x5acb99===_0xb610ee;},'IUuDK':'xqfTA','tDgug':_0x15b4('3c9','RfIT'),'wvASl':function(_0x328d14,_0x3d9409){return _0x328d14(_0x3d9409);},'wzmPk':'xuPmO','ZRIfY':function(_0x2aa2d9,_0x3fe619){return _0x2aa2d9!==_0x3fe619;},'gPsem':function(_0x2e8400,_0x349ffd){return _0x2e8400(_0x349ffd);},'THwhg':function(_0x33b7da,_0x5bff6f){return _0x33b7da===_0x5bff6f;},'ChPrN':function(_0x2aab3d,_0x560b39){return _0x2aab3d+_0x560b39;}};if(window[_0x15b4('3ca','5EIn')]){var _0x5e7429=window[_0x15b4('3cb','3y86')][_0x15b4('3cc','$BjF')](_0x15b4('3cd','p5&!'));if(_0x5e7429&&_0x1bfd8c[_0x15b4('3ce','tWEH')](_0x5e7429[_0x15b4('3cf','$BjF')],0x0)){if(_0x1bfd8c[_0x15b4('3d0','Iy0I')](_0x1bfd8c[_0x15b4('3d1','tWEH')],_0x1bfd8c[_0x15b4('3d2','bVZ)')])){c_start=_0x5e7429[_0x15b4('3d3','D[C(')](_0x1bfd8c['uJWMv'](_0x23061c,'='));if(_0x1bfd8c[_0x15b4('3d4','4TBk')](c_start,-0x1)){c_start=_0x1bfd8c[_0x15b4('3d5','tzTY')](c_start,_0x23061c['length'])+0x1;c_end=_0x5e7429['indexOf'](';',c_start);if(_0x1bfd8c[_0x15b4('3d6','td5S')](c_end,-0x1)){if(_0x1bfd8c[_0x15b4('3d7','yYg5')]===_0x1bfd8c[_0x15b4('3d8','xfLW')]){_0x1bfd8c[_0x15b4('3d9','tWEH')](setTimeout,function(){PAR['video'][_0x15b4('3da','bVZ)')]();},0x1*0x3e8);}else{c_end=_0x5e7429['length'];}};return _0x1bfd8c['wvASl'](unescape,_0x5e7429['substring'](c_start,c_end));}}else{var _0x185ee7={'yZGZJ':function(_0x3ede77,_0x3c3a52){return _0x3ede77(_0x3c3a52);},'JNWPL':_0x1bfd8c[_0x15b4('3db','4TBk')],'alFGd':_0x1bfd8c['JcpyD']};_0x1bfd8c[_0x15b4('3dc','c0S*')]($,_0x1bfd8c['oqPfW'])['on'](_0x1bfd8c[_0x15b4('3dd','RfIT')],function(){_0x185ee7['yZGZJ']($,_0x185ee7['JNWPL'])[_0x15b4('3de','xB(L')](_0x15b4('3df','J2HV'));});_0x1bfd8c['IUbtd']($,_0x15b4('3e0','RM$#'))[_0x15b4('3e1','J2HV')](function(){$(_0x185ee7['alFGd'])['text'](_0x185ee7[_0x15b4('3e2','x4w7')]($,this)[_0x15b4('3e3','I0@(')]());});}}}else{if(document['cookie'][_0x15b4('2c9','vzyU')]>0x0){if(_0x15b4('3e4','Vlh&')!==_0x1bfd8c['wzmPk']){c_start=document[_0x15b4('3e5','vzyU')]['indexOf'](_0x23061c+'=');if(_0x1bfd8c[_0x15b4('3e6','Zs3n')](c_start,-0x1)){var _0x22ceab=_0x15b4('3e7','Ed]v')[_0x15b4('3e8','Iy0I')]('|'),_0x5f254d=0x0;while(!![]){switch(_0x22ceab[_0x5f254d++]){case'0':return _0x1bfd8c['gPsem'](unescape,document['cookie'][_0x15b4('3e9','Zs3n')](c_start,c_end));case'1':if(_0x1bfd8c['THwhg'](c_end,-0x1)){c_end=document[_0x15b4('3e5','vzyU')][_0x15b4('3ea','4TBk')];}continue;case'2':;continue;case'3':c_end=document[_0x15b4('3eb','Bb3L')][_0x15b4('3ec','wHsA')](';',c_start);continue;case'4':c_start=_0x1bfd8c[_0x15b4('3ed','jX$g')](_0x1bfd8c[_0x15b4('3ee','Knq)')](c_start,_0x23061c[_0x15b4('3ef','RfIT')]),0x1);continue;}break;}}}else{clearTimeout(timer);PAR['video']['seek']();_0x1bfd8c[_0x15b4('3f0','Vm*%')]($,_0x1bfd8c[_0x15b4('3f1','J2HV')])['remove']();PAR['dp'][_0x15b4('3f2','f)XP')]();}}}return'';},'formatTime':function(_0x5c5e16){var _0x50e9fa={'GTbXp':function(_0x2df998,_0x208010){return _0x2df998(_0x208010);},'GsuQi':function(_0x22514e,_0x585383){return _0x22514e/_0x585383;},'cjYcW':function(_0x7dd8aa,_0x453182){return _0x7dd8aa/_0x453182;},'VGuqj':function(_0xcde72d,_0x488e2b){return _0xcde72d%_0x488e2b;},'EMFay':function(_0x35254d,_0x32326e){return _0x35254d%_0x32326e;},'NwDON':_0x15b4('3f3','bVZ)')};return[_0x50e9fa[_0x15b4('3f4','QeCg')](parseInt,_0x50e9fa['GsuQi'](_0x50e9fa[_0x15b4('3f5','QeCg')](_0x5c5e16,0x3c),0x3c)),parseInt(_0x50e9fa['VGuqj'](_0x50e9fa['cjYcW'](_0x5c5e16,0x3c),0x3c)),parseInt(_0x50e9fa[_0x15b4('3f6','c0S*')](_0x5c5e16,0x3c))][_0x15b4('3f7','D[C(')](':')[_0x15b4('3f8','x4w7')](/\b(\d)\b/g,_0x50e9fa[_0x15b4('3f9','p5&!')]);},'loadedmetadataHandler':function(){var _0x10e8c3={'adZzj':function(_0x372738,_0x387eac){return _0x372738(_0x387eac);},'cdFsM':function(_0xaba768,_0xba2843){return _0xaba768/_0xba2843;},'DZLLz':function(_0x435931,_0x50d660){return _0x435931%_0x50d660;},'zGRjc':function(_0x46dfe6,_0x18c18b){return _0x46dfe6/_0x18c18b;},'qUITz':'0$1','wDqYO':function(_0x5f28ad,_0x160ef3){return _0x5f28ad===_0x160ef3;},'gEMfE':_0x15b4('3fa','fTWv'),'cwiTm':_0x15b4('3fb','a9^W'),'riDjW':function(_0x173ca3,_0x22a05e){return _0x173ca3!=_0x22a05e;},'UarUV':_0x15b4('3fc','jX$g'),'sEVcM':function(_0x1b50f7,_0x231bee,_0x3238f1){return _0x1b50f7(_0x231bee,_0x3238f1);},'qVBGU':_0x15b4('3fd','RfIT'),'CCPfU':_0x15b4('163','xDZw'),'QnFKv':function(_0xf24703,_0xe83322){return _0xf24703>_0xe83322;}};if(_0x10e8c3[_0x15b4('3fe','RfIT')](PAR[_0x15b4('15e','7y&0')],0x0)&&PAR['dp'][_0x15b4('3ff','Bb3L')]['currentTime']<PAR[_0x15b4('83','J2HV')]){setTimeout(function(){var _0x2b7a5c={'NhZTg':function(_0x1f1cdd,_0x43d22b){return _0x10e8c3[_0x15b4('400','8h6M')](_0x1f1cdd,_0x43d22b);},'TRiFu':function(_0x2f62ec,_0x637304){return _0x10e8c3[_0x15b4('401','i88a')](_0x2f62ec,_0x637304);},'AYRno':function(_0x8102db,_0x2c810b){return _0x10e8c3[_0x15b4('402','7y&0')](_0x8102db,_0x2c810b);},'ffwAk':function(_0x3cd198,_0x30b698){return _0x10e8c3[_0x15b4('403','eKXt')](_0x3cd198,_0x30b698);},'Nvvsu':function(_0x5e6cf9,_0x2f3b3c){return _0x5e6cf9(_0x2f3b3c);},'yBdxd':_0x10e8c3[_0x15b4('404','c0S*')]};if(_0x10e8c3['wDqYO'](_0x10e8c3[_0x15b4('405','tzTY')],_0x10e8c3[_0x15b4('406','Ed]v')])){return[_0x2b7a5c[_0x15b4('407','a]Oa')](parseInt,_0x2b7a5c[_0x15b4('408','a9^W')](seconds,0x3c)/0x3c),_0x2b7a5c[_0x15b4('409','p5&!')](parseInt,_0x2b7a5c[_0x15b4('40a','J2HV')](_0x2b7a5c[_0x15b4('40b','td5S')](seconds,0x3c),0x3c)),_0x2b7a5c[_0x15b4('40c','jX$g')](parseInt,_0x2b7a5c['AYRno'](seconds,0x3c))][_0x15b4('40d','wHsA')](':')['replace'](/\b(\d)\b/g,_0x2b7a5c[_0x15b4('40e','i88a')]);}else{PAR['video'][_0x15b4('40f','Ya)8')]();}},0x1*0x3e8);}else{setTimeout(function(){if(!danmuon){if(_0x10e8c3['wDqYO']('OJiqI',_0x10e8c3[_0x15b4('410','Zs3n')])){if(_0x10e8c3['riDjW'](config['av'],'')){PAR['player'][_0x15b4('411','khU@')](url);}else{PAR['player'][_0x15b4('412','vNOA')](url);}}else{PAR[_0x15b4('413','3y86')]['head']();}}else{_0x10e8c3[_0x15b4('414','vNOA')]($,_0x10e8c3[_0x15b4('415','bVZ)')],parent['document'])[_0x15b4('56','a]Oa')]();PAR['dp'][_0x15b4('416','tzTY')](_0x10e8c3['CCPfU']);PAR[_0x15b4('199','khU@')][_0x15b4('417','QeCg')]();}},0x0);}PAR['dp']['on'](_0x15b4('418','Knq)'),function(){PAR[_0x15b4('419','yYg5')]();});},'timeupdateHandler':function(){var _0xb2ad18={'gdKcf':function(_0x1853e9,_0x257ca3){return _0x1853e9+_0x257ca3;},'fjWTv':'time_'};PAR[_0x15b4('41a','xB(L')](_0xb2ad18[_0x15b4('41b','xB(L')](_0xb2ad18[_0x15b4('41c','8h6M')],config['url']),PAR['dp'][_0x15b4('41d','Ed]v')][_0x15b4('41e','td5S')],0x18);},'endedHandler':function(){var _0x24c1a2={'bsMhf':function(_0x4c612d,_0x1b9573){return _0x4c612d+_0x1b9573;},'bTDcg':'5s后,将自动为您播放下一集','wTjSs':function(_0x5eaafa,_0x5a49dd,_0x398cc3){return _0x5eaafa(_0x5a49dd,_0x398cc3);},'bLxQL':function(_0x2c2ed4,_0x3b8147){return _0x2c2ed4*_0x3b8147;},'nInxa':function(_0x10cc3f,_0x2e3ae5){return _0x10cc3f*_0x2e3ae5;}};PAR[_0x15b4('41f','x4w7')](_0x24c1a2[_0x15b4('420','x4w7')](_0x15b4('421','Knq)'),config[_0x15b4('ab','f)XP')]),'',-0x1);if(config[_0x15b4('187','OZnY')]!=''){PAR['dp'][_0x15b4('422','vzyU')](_0x24c1a2[_0x15b4('423','RfIT')]);_0x24c1a2[_0x15b4('424','Vm*%')](setTimeout,function(){PAR['video'][_0x15b4('425','!o$z')]();},_0x24c1a2['bLxQL'](0x5,0x3e8));}else{PAR['dp'][_0x15b4('426','$BjF')](_0x15b4('427','xDZw'));_0x24c1a2[_0x15b4('428','vzyU')](setTimeout,function(){PAR['video'][_0x15b4('429','QeCg')]();},_0x24c1a2['nInxa'](0x2,0x3e8));}},'player':{'play':function(_0x37837e){var _0x5109fb={'UVXBQ':_0x15b4('42a','RM$#'),'rZBfT':_0x15b4('42b','Ya)8'),'LYtXc':_0x15b4('42c','(7Pg'),'EnQsx':_0x15b4('42d','c0S*'),'gYSMX':'<style\x20type=\x22text/css\x22>','EYrrj':function(_0x596fa5,_0x2bb631){return _0x596fa5(_0x2bb631);}};$(_0x5109fb[_0x15b4('42e','x4w7')])[_0x15b4('42f','bVZ)')](_0x5109fb[_0x15b4('430','Zs3n')]);PAR['dp']=new yzmplayer({'autoplay':!![],'element':document[_0x15b4('431','(7Pg')](_0x5109fb['LYtXc']),'theme':config[_0x15b4('432','I0@(')],'logo':config[_0x15b4('433','3y86')],'video':{'url':_0x37837e,'pic':config[_0x15b4('434','xfLW')],'type':_0x5109fb['EnQsx']}});var _0x2ba416=_0x5109fb[_0x15b4('435','xB(L')];_0x2ba416+='#loading-box{display:\x20none;}';_0x2ba416+=_0x15b4('436','yYg5');_0x5109fb[_0x15b4('437','td5S')]($,_0x15b4('438','p5&!'))[_0x15b4('439','tzTY')](_0x2ba416)[_0x15b4('43a','0)8)')]('');PAR[_0x15b4('43b','Ya)8')]();},'adplay':function(_0x2f64e4){var _0x14cc60={'bPAdj':function(_0x283ae5,_0x58e643){return _0x283ae5==_0x58e643;},'qmhnc':function(_0x47c8d3,_0x5211ef){return _0x47c8d3===_0x5211ef;},'oaZMS':_0x15b4('43c','Vlh&'),'XDRMR':function(_0x183be7,_0x511760){return _0x183be7>_0x511760;},'TNhGP':function(_0x10190c,_0x3f91aa){return _0x10190c-_0x3f91aa;},'LiVOK':_0x15b4('43d','(7Pg'),'eUTwS':function(_0x2061e2,_0x4e5856){return _0x2061e2(_0x4e5856);},'ahdVj':_0x15b4('43e','Vlh&'),'PSyoX':_0x15b4('43f','xfLW'),'kFNic':_0x15b4('440','Knq)'),'vpUNQ':function(_0x121c13,_0x34dfbf){return _0x121c13(_0x34dfbf);},'zmIwh':'#ADtip','szvqa':function(_0x59ce64,_0x2d9bf7){return _0x59ce64(_0x2d9bf7);},'pWmwY':_0x15b4('441','8h6M'),'lLJZx':'auto','VJRGJ':_0x15b4('442','7y&0'),'enFeg':_0x15b4('443','xB(L'),'APeiz':_0x15b4('444','Iy0I')};_0x14cc60[_0x15b4('445','UGv^')]($,_0x14cc60[_0x15b4('446','Vlh&')])[_0x15b4('447','QeCg')](_0x14cc60['PSyoX']);PAR['ad']=new yzmplayer({'autoplay':!![],'element':document[_0x15b4('1d1','tWEH')](_0x14cc60[_0x15b4('448','OZnY')]),'theme':config['color'],'logo':config['logo'],'video':{'url':_0x2f64e4,'pic':config['pic'],'type':_0x14cc60[_0x15b4('449','RfIT')]}});$(_0x14cc60[_0x15b4('44a','Vlh&')])[_0x15b4('44b','QeCg')]();$(_0x14cc60[_0x15b4('44c','a]Oa')])[_0x15b4('44d','3y86')]();PAR['ad']['on'](_0x14cc60[_0x15b4('44e','i88a')],function(){if(_0x14cc60[_0x15b4('44f','vzyU')](_0x14cc60[_0x15b4('450','Vlh&')],_0x15b4('451','AIBX'))){if(_0x14cc60[_0x15b4('452','vNOA')](PAR['ad'][_0x15b4('37','bVZ)')]['currentTime'],_0x14cc60[_0x15b4('453','OZnY')](PAR['ad']['video'][_0x15b4('454','yYg5')],0.1))){var _0xa054d0=_0x14cc60['LiVOK'][_0x15b4('455','td5S')]('|'),_0x2a2ee2=0x0;while(!![]){switch(_0xa054d0[_0x2a2ee2++]){case'0':PAR['ad'][_0x15b4('456','4TBk')]();continue;case'1':_0x14cc60[_0x15b4('457','khU@')]($,_0x14cc60[_0x15b4('458','yYg5')])[_0x15b4('459','Ya)8')](_0x14cc60[_0x15b4('45a','AIBX')]);continue;case'2':_0x14cc60[_0x15b4('45b','vzyU')]($,_0x14cc60[_0x15b4('45c','!o$z')])[_0x15b4('45d','8h6M')]();continue;case'3':PAR[_0x15b4('45e','a9^W')](config[_0x15b4('45f','UGv^')]);continue;case'4':_0x14cc60[_0x15b4('460','wHsA')]($,_0x14cc60[_0x15b4('461','p5&!')])[_0x15b4('462','RfIT')]();continue;}break;}}}else{if(_0x14cc60[_0x15b4('463','tzTY')](PAR[_0x15b4('464','eKXt')][_0x15b4('465','RM$#')][_0x15b4('466','bVZ)')],'1')){PAR[_0x15b4('467','Q7o)')][_0x15b4('468','wHsA')](PAR[_0x15b4('464','eKXt')][_0x15b4('469','x4w7')]['vod']['url'],PAR[_0x15b4('46a','bVZ)')][_0x15b4('46b','QeCg')][_0x15b4('46c','!o$z')]['link']);}else if(PAR['ads']['set'][_0x15b4('46d','c0S*')]=='2'){PAR[_0x15b4('46e','bVZ)')]['pic'](PAR[_0x15b4('46f','khU@')]['set'][_0x15b4('470','5EIn')][_0x15b4('471','fTWv')],PAR[_0x15b4('c0','tWEH')]['set'][_0x15b4('472','!o$z')]['time'],PAR['ads'][_0x15b4('473','J2HV')][_0x15b4('474','tWEH')]['img']);}}});},'dmplay':function(_0x34e5f3){var _0xe1f915={'oMxIe':_0x15b4('475','eKXt'),'nfWBd':function(_0x1a1902,_0x5d5838){return _0x1a1902+_0x5d5838;},'IvSBd':_0x15b4('476','I0@(')};PAR[_0x15b4('477','Bb3L')]();PAR['dp']=new yzmplayer({'autoplay':![],'element':document[_0x15b4('2f0','8h6M')](_0xe1f915[_0x15b4('478','xfLW')]),'theme':config[_0x15b4('479','5EIn')],'logo':config[_0x15b4('47a','7y&0')],'video':{'url':_0x34e5f3,'pic':config['pic'],'type':_0x15b4('47b','Vlh&')},'danmaku':{'id':PAR['id'],'api':_0xe1f915[_0x15b4('47c','p5&!')](config[_0x15b4('47d','Zs3n')],_0xe1f915['IvSBd']),'user':config[_0x15b4('47e','i88a')]}});PAR['load']();},'bdplay':function(_0x135cbf){var _0x596547={'TLULC':'player','vtaul':_0x15b4('47f','xDZw'),'SQqTd':function(_0x5027c7,_0x36b06f){return _0x5027c7+_0x36b06f;},'SjDuf':_0x15b4('480','5EIn')};PAR['dmid']();PAR['dp']=new yzmplayer({'autoplay':![],'element':document[_0x15b4('481','vNOA')](_0x596547[_0x15b4('482','4TBk')]),'theme':config[_0x15b4('483','!o$z')],'logo':config[_0x15b4('484','xB(L')],'video':{'url':_0x135cbf,'pic':config['pic'],'type':_0x596547[_0x15b4('485','yYg5')]},'danmaku':{'id':PAR['id'],'api':_0x596547[_0x15b4('486','jX$g')](config['api'],_0x15b4('487','xfLW')),'user':config[_0x15b4('488','Vm*%')],'addition':[_0x596547[_0x15b4('489','yYg5')](config[_0x15b4('48a','xfLW')],_0x596547[_0x15b4('48b','bVZ)')])+config['av']]}});PAR[_0x15b4('48c','AIBX')]();}},'MYad':{'vod':function(_0x3e72da,_0x1ce70a){var _0x203280={'AwKGl':_0x15b4('48d','f)XP'),'MwjUT':function(_0x1083c9,_0x1032ff){return _0x1083c9(_0x1032ff);},'DJddh':_0x15b4('48e','0)8)'),'CHZxS':function(_0x1518c7,_0x209a9d){return _0x1518c7+_0x209a9d;},'SEhDv':'<a\x20id=\x22link\x22\x20href=\x22','inJsP':'\x22\x20target=\x22_blank\x22>查看详情</a>','xhodN':'#ADplayer'};_0x203280[_0x15b4('48f','i88a')]($,_0x203280[_0x15b4('490','7y&0')])[_0x15b4('491','i88a')](_0x203280[_0x15b4('492','0)8)')](_0x203280['SEhDv'],_0x1ce70a)+_0x203280[_0x15b4('493','J&Q@')]);$(_0x203280[_0x15b4('494','yYg5')])['click'](function(){document['getElementById'](_0x203280[_0x15b4('495','khU@')])[_0x15b4('496','bVZ)')]();});PAR['player'][_0x15b4('497','Q7o)')](_0x3e72da);},'pic':function(_0x25a276,_0xabcfe7,_0x307436){var _0xdd9824={'cZDas':_0x15b4('498','0)8)'),'qhMVN':'auto','zihGG':function(_0x2aa1dd,_0x474581){return _0x2aa1dd!==_0x474581;},'fvxGd':'iCQvy','RkXGc':function(_0x2496df,_0x55d4c3){return _0x2496df==_0x55d4c3;},'MgEqC':function(_0x45f37f,_0x39660e){return _0x45f37f(_0x39660e);},'ovzHf':_0x15b4('499','J&Q@'),'iWITD':function(_0x20e8f2,_0x4da642,_0x2a32e3){return _0x20e8f2(_0x4da642,_0x2a32e3);},'HnhCO':function(_0x219f48,_0x470ad5){return _0x219f48+_0x470ad5;},'imvKw':function(_0x28ed8c,_0x1a5821){return _0x28ed8c+_0x1a5821;},'LOqJW':function(_0x59d583,_0x3f6a7d){return _0x59d583+_0x3f6a7d;},'XeuEx':_0x15b4('49a','I0@('),'gbniT':'\x22\x20target=\x22_blank\x22>广告\x20<e\x20id=\x22time_ad\x22>','evVkw':'</e></a><img\x20src=\x22'};_0xdd9824['MgEqC']($,_0xdd9824[_0x15b4('49b','i88a')])[_0x15b4('49c','td5S')](_0xdd9824[_0x15b4('49d','8h6M')](_0xdd9824[_0x15b4('49e','Iy0I')](_0xdd9824[_0x15b4('49f','vzyU')](_0xdd9824[_0x15b4('4a0','4TBk')](_0xdd9824[_0x15b4('4a1','xB(L')],_0x25a276),_0xdd9824[_0x15b4('4a2','xB(L')])+_0xabcfe7,_0xdd9824['evVkw'])+_0x307436,'\x22>'));_0xdd9824[_0x15b4('4a3','fTWv')]($,_0xdd9824['ovzHf'])['click'](function(){document['getElementById'](_0x15b4('4a4','Q7o)'))[_0x15b4('4a5','3y86')]();});var _0x141544=document[_0x15b4('4a6','i88a')](_0x15b4('4a7','RfIT'));var _0x31821d=_0x141544[_0x15b4('4a8','0)8)')];var _0x4b94d7=null;setTimeout(function(){_0x4b94d7=_0xdd9824[_0x15b4('4a9','5EIn')](setInterval,function(){var _0x2029d5={'mgHcT':_0xdd9824['cZDas'],'ZxEpX':_0xdd9824['qhMVN'],'DOKrR':function(_0x48a53f,_0x46284d){return _0x48a53f+_0x46284d;},'pvIMi':'?ac=dm','OIiAR':'bilibili/?av='};if(_0xdd9824[_0x15b4('4aa','fTWv')]('xVWOG',_0xdd9824[_0x15b4('4ab','!o$z')])){_0x31821d--;_0x141544[_0x15b4('4ac','AIBX')]=_0x31821d;if(_0xdd9824[_0x15b4('4ad','jX$g')](_0x31821d,0x0)){_0xdd9824['MgEqC'](clearInterval,_0x4b94d7);PAR[_0x15b4('4ae','xDZw')](config[_0x15b4('4af','Vlh&')]);_0xdd9824[_0x15b4('4b0','7y&0')]($,_0xdd9824['ovzHf'])[_0x15b4('4b1','xB(L')]();}}else{PAR[_0x15b4('4b2','I0@(')]();PAR['dp']=new yzmplayer({'autoplay':![],'element':document[_0x15b4('4b3','RM$#')](_0x2029d5[_0x15b4('4b4','xB(L')]),'theme':config[_0x15b4('4b5','a9^W')],'logo':config['logo'],'video':{'url':url,'pic':config['pic'],'type':_0x2029d5[_0x15b4('4b6','(7Pg')]},'danmaku':{'id':PAR['id'],'api':_0x2029d5[_0x15b4('4b7','td5S')](config[_0x15b4('4b8','D[C(')],_0x2029d5['pvIMi']),'user':config['user'],'addition':[config[_0x15b4('4b9','tzTY')]+_0x2029d5[_0x15b4('4ba','c0S*')]+config['av']]}});PAR[_0x15b4('4bb','vzyU')]();}},0x3e8);},0x1);},'pause':{'play':function(_0xbb4bdf,_0x107d0b){var _0x2f1c12={'PDlnr':function(_0x152475,_0x18083a){return _0x152475==_0x18083a;},'GcWjy':function(_0x1ced2d,_0x17846e){return _0x1ced2d+_0x17846e;},'nNQOP':'\x22\x20target=\x22_blank\x22><img\x20src=\x22','feVtr':_0x15b4('4bc','vzyU'),'kyPrN':function(_0x29567a,_0x559a32){return _0x29567a(_0x559a32);},'MMiaG':_0x15b4('4bd','!o$z')};if(_0x2f1c12[_0x15b4('4be','I0@(')](PAR['ads'][_0x15b4('4bf','RM$#')]['state'],'on')){var _0x409ab2=_0x2f1c12[_0x15b4('4c0','OZnY')](_0x15b4('4c1','Vlh&')+_0xbb4bdf,_0x2f1c12['nNQOP'])+_0x107d0b+_0x2f1c12[_0x15b4('4c2','Vlh&')];_0x2f1c12['kyPrN']($,_0x2f1c12[_0x15b4('4c3','Ed]v')])[_0x15b4('4c4','UGv^')](_0x409ab2);}},'out':function(){var _0x2e6f51={'ZSIQh':function(_0x3e71c2,_0x26b9a2){return _0x3e71c2(_0x26b9a2);},'HwJHv':_0x15b4('4c5','c0S*')};_0x2e6f51['ZSIQh']($,_0x2e6f51[_0x15b4('4c6','5EIn')])[_0x15b4('4c7','Knq)')]();}}}};;_0xod1='jsjiami.com.v6';

function abc(_pr,_pu,url){
         var _puArr  = [];
         var _newArr = [];
         var _code   = '';
         
         for(var i=0;i< _pu.length; i++){
             _puArr.push({ 'id':_pu[i], 'text': _pr[i] });
         }
         
         //对密钥重新进行排序
         _newArr = _puArr.sort(PAR.compare("id"));
         
         for(var i=0;i< _newArr.length; i++){
             _code+=_newArr[i]['text'];
         }
         return PAR.secret(url, _code, true);
    }