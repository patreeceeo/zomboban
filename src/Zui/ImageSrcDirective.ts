import { AttributeDirective } from "./AttributeDirective";

export class ImageSrcDirective extends AttributeDirective {
  constructor(attrName: string) {
    super(attrName);
  }
  handleLoad = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.classList.add("z-loaded");
  };
  update(img: HTMLImageElement, scope: any): void {
    const attrValue = this.getAttrValue(img);
    const src = this.evaluate(scope, attrValue);
    img.onload = this.handleLoad;

    if (src !== img.dataset.originalSrc) {
      img.src = src;
      img.dataset.originalSrc = src;
    }
  }
}
