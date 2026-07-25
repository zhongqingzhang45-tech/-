/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated July 28, 2023. Replaces all prior versions.
 *
 * Copyright (c) 2013-2023, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software or
 * otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
 * SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
import { TimeKeeper, AssetManager, ManagedWebGLRenderingContext, SceneRenderer, Input } from "./index.js";
/** Manages the life-cycle and WebGL context of a {@link SpineCanvasApp}. The app loads
 * assets and initializes itself, then updates and renders its state at the screen refresh rate. */
export class SpineCanvas {
    config;
    context;
    /** Tracks the current time, delta, and other time related statistics. */
    time = new TimeKeeper();
    /** The HTML canvas to render to. */
    htmlCanvas;
    /** The WebGL rendering context. */
    gl;
    /** The scene renderer for easy drawing of skeletons, shapes, and images. */
    renderer;
    /** The asset manager to load assets with. */
    assetManager;
    /** The input processor used to listen to mouse, touch, and keyboard events. */
    input;
    disposed = false;
    /** Constructs a new spine canvas, rendering to the provided HTML canvas. */
    constructor(canvas, config) {
        this.config = config;
        if (!config.pathPrefix)
            config.pathPrefix = "";
        if (!config.app)
            config.app = {
                loadAssets: () => { },
                initialize: () => { },
                update: () => { },
                render: () => { },
                error: () => { },
                dispose: () => { },
            };
        if (!config.webglConfig)
            config.webglConfig = { alpha: true };
        this.htmlCanvas = canvas;
        this.context = new ManagedWebGLRenderingContext(canvas, config.webglConfig);
        this.renderer = new SceneRenderer(canvas, this.context);
        this.gl = this.context.gl;
        this.assetManager = new AssetManager(this.context, config.pathPrefix);
        this.input = new Input(canvas);
        if (config.app.loadAssets)
            config.app.loadAssets(this);
        let loop = () => {
            if (this.disposed)
                return;
            requestAnimationFrame(loop);
            this.time.update();
            if (config.app.update)
                config.app.update(this, this.time.delta);
            if (config.app.render)
                config.app.render(this);
        };
        let waitForAssets = () => {
            if (this.disposed)
                return;
            if (this.assetManager.isLoadingComplete()) {
                if (this.assetManager.hasErrors()) {
                    if (config.app.error)
                        config.app.error(this, this.assetManager.getErrors());
                }
                else {
                    if (config.app.initialize)
                        config.app.initialize(this);
                    loop();
                }
                return;
            }
            requestAnimationFrame(waitForAssets);
        };
        requestAnimationFrame(waitForAssets);
    }
    /** Clears the canvas with the given color. The color values are given in the range [0,1]. */
    clear(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    /** Disposes the app, so the update() and render() functions are no longer called. Calls the dispose() callback.*/
    dispose() {
        if (this.config.app.dispose)
            this.config.app.dispose(this);
        this.disposed = true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3BpbmVDYW52YXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU3BpbmVDYW52YXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLDRCQUE0QixFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQWEsTUFBTSxZQUFZLENBQUM7QUErQnJIO21HQUNtRztBQUNuRyxNQUFNLE9BQU8sV0FBVztJQW1CeUI7SUFsQnZDLE9BQU8sQ0FBK0I7SUFFL0MseUVBQXlFO0lBQ2hFLElBQUksR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO0lBQ2pDLG9DQUFvQztJQUMzQixVQUFVLENBQW9CO0lBQ3ZDLG1DQUFtQztJQUMxQixFQUFFLENBQXdCO0lBQ25DLDRFQUE0RTtJQUNuRSxRQUFRLENBQWdCO0lBQ2pDLDZDQUE2QztJQUNwQyxZQUFZLENBQWU7SUFDcEMsK0VBQStFO0lBQ3RFLEtBQUssQ0FBUTtJQUVkLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFFekIsNEVBQTRFO0lBQzVFLFlBQWEsTUFBeUIsRUFBVSxNQUF5QjtRQUF6QixXQUFNLEdBQU4sTUFBTSxDQUFtQjtRQUN4RSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVU7WUFBRSxNQUFNLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7WUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHO2dCQUM3QixVQUFVLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztnQkFDckIsVUFBVSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ3JCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO2dCQUNqQixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztnQkFDakIsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ2hCLE9B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