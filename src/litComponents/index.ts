import { html, LitElement, css } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { classMap } from "lit/directives/class-map.js";

import { customElement, property, state } from "lit/decorators.js";
import { MenuItem, Menu } from "../systems/MenuSystem";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";

@customElement(`lit-menu-app`)
export class LitMenuApp extends LitElement {
  @property()
  menu = new Menu();

  @state()
  selectedIndex = 0;

  renderMenuItem = (item: MenuItem, index: number) => {
    return html`<lit-menu-item
      index=${index}
      @confirm=${item.onConfirm}
      ?selected=${index === this.selectedIndex}
      >${unsafeHTML(item.content)}</lit-menu-item
    >`;
  };

  handleConfirm = (e: CustomEvent) => {
    this.selectedIndex = e.detail.index;
  };

  render() {
    const { menu } = this;
    return html`<lit-menu title=${menu.title} @confirm=${this.handleConfirm}
      >${menu.items.map(this.renderMenuItem)}</lit-menu
    >`;
  }
}

@customElement(`lit-menu`)
export class LitMenu extends LitElement {
  @property()
  title = "Menu";

  static styles = css`
    div {
      background-color: rgba(0, 0, 0, 0.8);
    }
  `;

  render() {
    const { title } = this;
    return html`<div>
      <h3 @click=${() => console.log("wtf")}>${title}</h3>
      <menu><slot></slot></menu>
    </div>`;
  }
}

@customElement(`lit-menu-item`)
export class LitMenuItem extends LitElement {
  @property()
  description = "";

  @property({ type: Boolean })
  selected = false;

  @property({ type: Number })
  index = -1;

  handleClick = () => {
    const event = new CustomEvent("confirm", {
      detail: { index: this.index },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  };

  static styles = css`
    li {
      cursor: pointer;
    }
    .selected {
      color: green;
    }
  `;

  render() {
    const { selected } = this;
    return html`<li @click=${this.handleClick} class=${classMap({ selected })}>
      <slot></slot>
    </li>`;
  }
}

@customElement(`lit-feedback-form`)
export class LitFeedbackForm extends LitElement {
  render() {
    return html`<iframe
      src="https://docs.google.com/forms/d/e/1FAIpQLSe9_AQBRFdvvT4ooQqdKsTE103C372S9QyRlo5Wxm54zgGQ7A/viewform?embedded=true"
      width=${SCREENX_PX}
      height=${SCREENY_PX * 1.6}
      frameborder="0"
      marginheight="0"
      marginwidth="0"
      >Loading…</iframe
    >`;
  }
}
