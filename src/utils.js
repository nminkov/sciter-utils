import * as Env from "@env";
import * as Sciter from "@sciter";
import * as Sys from "@sys";

export default class Utils {
    /**
     * Convert measure in device pixels (ppx)
     * @param {string} measure - (optional)
     * @param {string} axis - (optional) ["width", "height"]
     * @returns {number}
     */
    static devicePixels(measure, axis) {
        if (typeof measure === "undefined")
            measure = "1in";

        return Sciter.devicePixels(measure, axis);
    }

    /**
     * Convert dip to ppx
     * @param {string} measure
     * @param {number} dpi - resolution
     * @returns {number} value or false on failure
     * @note on a 96 DPI screen, 1 dip === 1ppx, on a 192 DPI screen, 1 dip === 2ppx
     */
    static dipPpx(measure, dpi) {
        // extract value and unit
        const [, value, unit] = measure.match(/(\d+)(\w+)/);

        // convert value to number
        const length = Number.parseInt(value, 10);

        // check types
        if (typeof length !== "number" || unit !== "dip")
            return -1;

        return length * dpi / 96;
    }

    /**
     * Convert ppx to dip
     * @param {string} measure
     * @param {number} dpi - resolution
     * @returns {number} value or false on failure
     * @note on a 96 DPI screen, 1 dip === 1ppx, on a 192 DPI screen, 1 dip === 2ppx
     */
    static ppxDip(measure, dpi) {
        // extract value and unit
        const [, value, unit] = measure.match(/(\d+)(\w+)/);

        // convert value to number
        const length = Number.parseInt(value, 10);

        // check types
        if (typeof length !== "number" || unit !== "ppx")
            return false;

        return length * 96 / dpi;
    }

    /**
     * Convert millimeters to ppx
     * @param {string} measure
     * @param {number} dpi - resolution
     * @returns {number} value or false on failure
     */
    static mmPpx(measure, dpi) {
        // extract value and unit
        const [, value, unit] = measure.match(/([\d.]+)(\w+)/);

        // convert value to number
        const length = Number.parseFloat(value);

        // check types
        if (typeof length !== "number" || unit !== "mm")
            return false;

        // 1 inch = 25.4mm = 96dip
        const dip = length * 96 / 25.4;

        return dip * dpi / 96;
    }

    /**
     * Get monitors count
     * @returns {number}
     */
    static monitorsCount() {
        return Window.screens;
    }

    /**
     * Log monitors info
     */
    static logMonitors() {
        const screens = Utils.monitorsCount();

        for (let index = 0; index < screens; ++index) {
            const [w, h] = Window.screenBox(index, "frame", "dimension");
            const primary = Window.screenBox(index, "isPrimary");
            const device = Window.screenBox(index, "device");
            const ratio = Window.screenBox(index, "devicePixelRatio");

            console.log(`monitor ${index + 1} - ${w} x ${h} - ${primary ? "primary" : "secondary"} - ${device} - ${ratio}`);
        }
    }

    /**
     * Get screen dimensions
     * @param {boolean, undefined} asPPX - true coordinates are in physical device pixels (default), false in CSS pixels
     * @returns {Array} [width, height]
     */
    static screenDimensions(asPPX) {
        // get screen dimensions
        const [w, h] = Window.this.screenBox("frame", "dimension", asPPX);

        //console.debug("screen dimensions", w, h);

        return [w, h];
    }

    /**
     * Get window rectangle
     * @param {Window, undefined} window - if no Window is provided Window.this will be used
     * @param {boolean, undefined} asPPX - true coordinates are in ppx (default), false in dpi
     * @return Array} [left, top, width, height]
     * @throws Error
     */
    static windowRect(window, asPPX) {
        if (!window)
            window = Window.this;
        else
        if (typeof window !== "object" || window.constructor.name !== "Window")
            throw new Error("invalid arguments");

        // get window dimensions with border
        const [wx, wy, ww, wh] = window.box("rectw", "border", "screen", asPPX);

        //console.debug("window rect", wx, wy, ww, wh);

        return [wx, wy, ww, wh];
    }

    /**
     * Get window dimensions
     * @param {Window, undefined} window - if no Window is provided Window.this will be used
     * @param {boolean, undefined} asPPX - true coordinates are in ppx (default), false in dpi
     * @return {Array} [width, height]
     */
    static windowDimensions(window, asPPX) {
        // get window dimensions with border
        const [wx, wy, ww, wh] = Utils.windowRect(window, asPPX);
        //console.debug("window dimensions", ww, wh);

        return [ww, wh];
    }

    /**
     * Set window dimensions
     * @param {Window} window
     * @param {number} width
     * @param {number} height
     * @param {boolean} ppx - ppx true, dpi false
     * @throws Error
     */
    static setWindowDimensions(window, width, height, ppx) {
        if (typeof window !== "object" || window.constructor.name !== "Window"
                || typeof width !== "number" || typeof height !== "number" || typeof ppx !== "boolean")
            throw new Error("invalid arguments");

        // get window top and left
        const rect = Utils.windowRect(window, true);

        if (!ppx) {
            // convert dpi to ppx
            width = Sciter.devicePixels(width, "width");
            height = Sciter.devicePixels(height, "height");
        }

        // resize
        Window.this.move(rect[0], rect[1], width, height);
    }

    // todo -oNiki/David: reference must be enum strict value or string (to preserver backward compatibility)
    /**
     * Center window on screen
     * @param {Window, undefined} window - if no Window is provided Window.this will be used
     * @param {string} reference - ["screen", "parent"]
     * @param {Length, undefined} xOffset - optional offset to apply to horizontal position
     * @param {Length, undefined} yOffset - optional offset to apply to vertical position
     * @throws Error
     */
    static centerWindow(window, reference, xOffset, yOffset) {
        if (!window)
            window = Window.this;
        else
        if (typeof window !== "object" || window.constructor.name !== "Window")
            throw new Error("invalid arguments");

        if (typeof reference !== "string")
            throw new Error("invalid arguments");
            
        let centerX;
        let centerY;

        if (reference === "parent" && window.parent) {
            //console.debug("center window on parent");

            // get parent window rectangle
            const [px, py, pw, ph] = Utils.windowRect(window.parent, true);

            centerX = px + (pw / 2);
            centerY = py + (ph / 2);
        }
        else {
            //console.debug("center window on screen");

            // get screen dimensions
            const [sw, sh] = Utils.screenDimensions(true);

            // calculate screen center
            centerX = sw / 2;
            centerY = sh / 2;
        }

        // apply optional horizontal offset
        if (xOffset) {
            // convert to ppx
            const offset = xOffset.valueOf();
            if (offset)
                centerX += offset;
        }

        // apply optional vertical offset
        if (yOffset) {
            // convert to ppx
            const offset = yOffset.valueOf();
            if (offset)
                centerY += offset;
        }

        //console.debug(`center (${centerX}, ${centerY})`, xOffset, yOffset);

        Utils.centerWindowXY(window, centerX, centerY);
    }

    /**
     * Center window around position
     * @param {Window, undefined} window - if no Window is provided Window.this will be used
     * @param {number} x - x center in ppx
     * @param {number} y - y center in ppx
     * @return void
     */
    static centerWindowXY(window, x, y) {
       if (!window)
           window = Window.this;
       else
       if (typeof window !== "object" || window.constructor.name !== "Window")
           throw new Error("invalid arguments");

       if (typeof x !== "number" || typeof y !== "number")
           throw new Error("invalid arguments");

       const [ww, wh] = Utils.windowDimensions(window, true);

       // calculate position
       const left = x - (ww / 2);
       const top = y - (wh / 2);

       //console.debug("center window", left, top);

       // move window
       window.move(left, top);
   }

    /**
     * Bring window to front
     * @param {Window, undefined} window - if no Window is provided Window.this will be used
     * @throws Error
     */
    static windowToFront(window) {
        if (!window)
           window = Window.this;
        else
        if (typeof window !== "object" || window.constructor.name !== "Window")
            throw new Error("invalid arguments");

        // bring window to front
        window.isTopmost = true;
        window.isTopmost = false;
    }

    /**
     * Focus window
     */
    static focusWindow() {
        // set focus
        document.body.state.focus = true;
    }

    /**
     * Add window reload with F5
     */
    static addReloadWindow() {
        Utils.addKeyboardShortcut(Window.this.document, {
            key: "F5",
        }, function() {
            console.log("Reload window...");

            // reload app
            Window.this.load(location.href);

            // consume event
            return true;
        });
    }

    /**
     * Add minimize window shortcut
     */
    static minimizeWindowShortcut() {
        Utils.addKeyboardShortcut(Window.this.document, {
            key: "M",
            metaKey: true,
        }, function() {
            console.log("Minimize window...");

            Window.this.state = Window.WINDOW_MINIMIZED;

            // consume event
            return true;
        });
    }

    /**
     * Close window on escape
     * @param {Window, undefined} window - if no Window is provided Window.this will be used
     * @throws Error
     */
    static closeWindowOnEscape(window) {
        if (!window)
           window = Window.this;
        else
        if (typeof window !== "object" || window.constructor.name !== "Window")
            throw new Error("invalid arguments");

        Utils.addKeyboardShortcut(window.document, {
            key: "Escape",
        }, () => {
            window.close();
        });
    }

    /**
     * Get event key as string
     * @param {Event} event
     * @returns {string}
     */
    static keyStr(event) {
        return `${event.metaKey ? "meta" : ""} ${event.ctrlKey ? "ctrl" : ""} ${event.altKey ? "alt" : ""} ${event.shiftKey ? "shift" : ""} ${event.code}`;
    }

    /**
     * Log keyboard keys
     * @param {Element} element
     * @param {Function} function_ - func to call
     * @returns {boolean}
     */
    static keyLogger(element, function_) {
        if (element === undefined || typeof function_ !== "function")
            return false;

        element.on("keyup", function(event) {
            // call callback
            const result = function_(event);

            if (result !== undefined)
                return result;
        });

        return true;
    }

    /**
     * Add keyboard shortcut
     * @param {Element} element
     * @param {object} shortcut
     * @param {Function} function_ - func to call
     * @returns {boolean}
     */
    static addKeyboardShortcut(element, shortcut, function_) {
        if (element === undefined || shortcut === undefined
                || shortcut.key === undefined || typeof function_ !== "function")
            return false;

        shortcut.ctrlKey = shortcut.ctrlKey ?? false;
        shortcut.shiftKey = shortcut.shiftKey ?? false;
        shortcut.altKey = shortcut.altKey ?? false;
        shortcut.metaKey = shortcut.metaKey ?? false;

        element.on("keyup", function(event) {
            //console.debug("keyup", Utils.keyStr(event));

            // compare key
            if (event.code === shortcut.key
                // compare modifiers
                && event.ctrlKey === shortcut.ctrlKey
                && event.shiftKey === shortcut.shiftKey
                && event.altKey === shortcut.altKey) {

                // call callback
                const result = function_(event);

                if (result !== undefined)
                    return result;
            }
        });

        return true;
    }

    /**
     * Open link in browser
     * @param {string} url
     */
    static openLink(url) {
        console.log(`GUI - Open link in browser - ${url}`);

        // open url in default browser
        Env.launch(url);
    }

    /**
     * Get sciter info
     * @returns {string}
     */
    static sciterInfo() {
        return `sciter v${Sciter.VERSION} r${Sciter.REVISION} quick.js v${Sciter.QUICKJS_VERSION}`;
    }

    /**
     * Sleep
     * @param {number} delay - in milliseconds
     * @note blocks code execution until completion,
     * see https://stackoverflow.com/questions/1141302/is-there-a-sleep-function-in-javascript
     */
    static sleep(delay) {
        const start = Date.now();

        while (Date.now() < start + delay);

        // not implemented yet
        //Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
    }

    /**
     * Play sound
     * @param {string} file
     * @returns {Promise}
     */
    static async playSound(file) {
        // try catch not needed because of the promise
        const audio = await Audio.load(file);
        await audio.play();
    }

    /**
     * Get text from url
     * @param {string} url
     * @returns {string}
     * @throws Error if get fails
     */
    static getUrl(url) {
        // get url content
        const result = fetch(url, {
            sync: true
        });

        if (result.ok)
            return result.text();

        throw new Error(`Get url - result - ${result.status} - url - ${url}`);
    }

    /**
     * Load json from file
     * @param {string} url
     * @param {object} json - [in,out]
     * @throws Error if json cannot be parsed
     */
    static loadJson(url, json) {
        // clear json object
        for (const property of Object.getOwnPropertyNames(json))
            delete json[property];

        const text = Utils.getUrl(url);

        // convert text to json
        Object.assign(json, JSON.parse(text));
    }

    /**
     * Save json to file
     * @param {string} url
     * @param {object} json
     * @throws Error if save file fails
     */
    static saveJson(url, json) {
        // convert json to string
        const string_ = JSON.stringify(json, undefined, 4);

        (async () => {
            // open file for writing
            const file = await Sys.fs.open(URL.toPath(url), "wb+");

            // write to file
            await file.write(string_);

            // close file
            file.close();
        })();
    }

    /**
     * Flush IO queue
     * @note avoid closing app while some operations still haven't been executed
     */
    static flushIOQueue() {
        // flush i/o queue before closing app otherwise the previous line never gets executed
        for (let n = 0; n < 100; ++n) {
            if (!Window.this.doEvent("I/O"))
                break;
        }
    }

    /**
     * Check if file exists
     * @param {string} file
     * @returns {boolean}
     * @note use file, not url
     */
    static fileExists(file) {
        const stat = Sys.fs.$stat(file);

        return stat === null ? false : (Boolean(stat.st_mode & 0x80_00));
    }

    /**
     * Check if directory exists
     * @param {string} dir
     * @returns {boolean}
     * @note use file, not url
     */
    static dirExists(dir) {
        const stat = Sys.fs.$stat(dir);

        return stat === null ? false : (Boolean(stat.st_mode & 0x40_00));
    }

    /**
     * Capitalize first letter
     * @param {string} string_
     * @returns {string}
     */
    static capitalizeFirstLetter(string_) {
        return string_.charAt(0).toUpperCase() + string_.slice(1);
    }

    /**
     * Get directory separator
     * @returns {string}
     * @throws Error when platform is unknown
     */
    static getSeparator() {
        switch (Env.PLATFORM) {
            case "Windows":
                return "\\";

            case "Linux":
            case "OSX":
            case "Android":
                return "/";

            default:
                throw new Error(`unknown platform ${Env.PLATFORM}`);
        }
    }
}
