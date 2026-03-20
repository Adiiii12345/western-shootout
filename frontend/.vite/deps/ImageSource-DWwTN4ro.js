import { W as TextureSource, ut as ExtensionType } from "./Geometry-DxUTDsd-.js";
//#region node_modules/.pnpm/pixi.js@8.17.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/ImageSource.mjs
var ImageSource = class extends TextureSource {
	constructor(options) {
		super(options);
		this.uploadMethodId = "image";
		this.autoGarbageCollect = true;
	}
	static test(resource) {
		return globalThis.HTMLImageElement && resource instanceof HTMLImageElement || typeof ImageBitmap !== "undefined" && resource instanceof ImageBitmap || globalThis.VideoFrame && resource instanceof VideoFrame;
	}
};
ImageSource.extension = ExtensionType.TextureSource;
//#endregion
export { ImageSource as t };

//# sourceMappingURL=ImageSource-DWwTN4ro.js.map