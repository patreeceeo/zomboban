import { html, LitElement, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

import { customElement, property, state } from "lit/decorators.js";
import { MenuItem, Menu } from "../systems/MenuSystem";

@customElement(`lit-menu-app`)
export class LitMenuApp extends LitElement {
  @property()
  menu = new Menu();

  @state()
  selectedIndex = 0;

  renderMenuItem = (item: MenuItem, index: number) => {
    return html`<lit-menu-item
      title=${item.title}
      index=${index}
      @confirm=${item.onConfirm}
      ?selected=${index === this.selectedIndex}
    />`;
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

  render() {
    const { title } = this;
    return html`<div>
      <h3>${title}</h3>
      <menu><slot></slot></menu>
    </div>`;
  }
}

@customElement(`lit-menu-item`)
export class LitMenuItem extends LitElement {
  @property()
  title = "Item";

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
    const { title, selected } = this;
    return html`<li @click=${this.handleClick} class=${classMap({ selected })}>
      ${title}
    </li>`;
  }
}
