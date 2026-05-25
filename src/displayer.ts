/**
 * `PlayDisplayer` — top-down rendering of an offensive formation with animatable players.
 *
 * V2 changes from V1:
 *   - ES class instead of constructor function + prototype assignment
 *   - One `setMove(position, name)` method replaces 11 hardcoded `setLTEMove`/etc.
 *   - Per-position state stored in a `players: Record<Position, PlayerSlot>` map
 *     instead of 22 sibling fields on the instance (`ltemove`, `ltename`, etc.)
 *   - jQuery `.animate()` → Web Animations API (see `animation.ts`)
 *   - Strict TypeScript, no `any`
 */

import { animateInSequence, resetAnimation } from './animation.js';
import { createDiv, createOption, mountInto } from './dom.js';
import { getMove, getMoveCatalog } from './moves.js';
import type { FieldSize, MoveName, MoveStep, Position } from './types.js';
import { POSITIONS, POSITION_LABELS, POSITION_FULL_NAMES } from './types.js';

export interface PlayDisplayerOptions {
  size: FieldSize;
  name: string;
  parentId?: string | null;
}

/** Internal per-position state: the DOM node plus the currently-assigned move. */
interface PlayerSlot {
  element: HTMLDivElement;
  moveName: MoveName;
  steps: MoveStep[];
}

export class PlayDisplayer {
  readonly size: FieldSize;
  readonly name: string;
  /** Outer wrapper for the field UI. Mounted under the parent passed to the constructor. */
  readonly root: HTMLDivElement;
  /** The header element above the field (shows the current play name). */
  readonly fieldTop: HTMLDivElement;

  private readonly players: Record<Position, PlayerSlot>;

  constructor(options: PlayDisplayerOptions);
  constructor(size: FieldSize, name: string, parentId?: string | null);
  constructor(
    sizeOrOptions: FieldSize | PlayDisplayerOptions,
    name?: string,
    parentId?: string | null,
  ) {
    const opts: PlayDisplayerOptions =
      typeof sizeOrOptions === 'string'
        ? { size: sizeOrOptions, name: name ?? '', parentId: parentId ?? null }
        : sizeOrOptions;

    this.size = opts.size;
    this.name = opts.name;

    const sizeSuffix = opts.size === 'large' ? '-large' : '';

    // Header
    this.fieldTop = createDiv(`field-top${sizeSuffix}`);
    this.fieldTop.innerText = this.name;

    // Field rows
    const field = createDiv(`field${sizeSuffix}`);
    const frontLine = createDiv(`front${sizeSuffix}`);
    const middleLine = createDiv(`mid-back${sizeSuffix}`);
    const backLine = createDiv(`mid-back${sizeSuffix}`);

    // Build a slot for each position
    const players: Partial<Record<Position, PlayerSlot>> = {};
    for (const pos of POSITIONS) {
      const el = createDiv(`player${sizeSuffix}`);
      el.id = `${pos}${this.name}`;
      // Plain label — CSS handles centering via flex.
      el.textContent = POSITION_LABELS[pos];
      // a11y: full position name for screen readers (avoids the SR reading "LTE" as letters).
      el.setAttribute('aria-label', POSITION_FULL_NAMES[pos]);
      el.setAttribute('role', 'img');
      players[pos] = { element: el, moveName: 'none', steps: [] };
    }
    this.players = players as Record<Position, PlayerSlot>;

    // Place players into formation rows
    const frontPositions: Position[] = ['lte', 'lt', 'lg', 'c', 'rg', 'rt', 'rte'];
    const backPositions: Position[] = ['lhb', 'fb', 'rhb'];
    for (const pos of frontPositions) frontLine.append(this.players[pos].element);
    middleLine.append(this.players.qb.element);
    for (const pos of backPositions) backLine.append(this.players[pos].element);

    field.append(frontLine, middleLine, backLine);

    // Play / Reset buttons in their own controls bar below the field.
    const controls = createDiv('pb-controls');
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.textContent = 'Play Animation';
    playBtn.addEventListener('click', () => {
      void this.playAnimation();
    });

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      this.reset();
    });

    controls.append(playBtn, resetBtn);

    // Responsive stage: holds field-top + field at their natural pixel
    // dimensions; scaled-to-fit by a ResizeObserver below (see styles.css
    // for the matching --pb-field-scale custom property).
    const stage = createDiv('pb-field-stage');
    stage.dataset.size = opts.size;
    const stageInner = createDiv('pb-field-inner');
    stageInner.append(this.fieldTop, field);
    stage.append(stageInner);

    // Outer wrapper
    this.root = createDiv('pb-displayer');
    this.root.dataset.size = opts.size;
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-label', `Play displayer: ${this.name || 'unnamed'}`);
    this.root.append(stage, controls);

    mountInto(this.root, opts.parentId);

    // Keep `--pb-field-scale` in sync with the stage's actual width so the
    // inner (at natural pixel dimensions) visually fills the available space.
    // Capped at 1 so we never upscale beyond natural size.
    const naturalWidth = opts.size === 'large' ? 854 : 1220;
    const applyScale = (): void => {
      const w = stage.clientWidth;
      if (w > 0) {
        const scale = Math.min(w / naturalWidth, 1);
        stageInner.style.setProperty('--pb-field-scale', String(scale));
      }
    };
    applyScale(); // synchronous initial pass (forces layout via clientWidth)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(applyScale);
      ro.observe(stage);
    }
  }

  /** Set the move assignment for a position. Pass `'none'` to clear. */
  setMove(position: Position, move: MoveName): void {
    if (move === 'none') {
      this.players[position].moveName = 'none';
      this.players[position].steps = [];
      return;
    }
    const m = getMove(move, this.size);
    if (m) {
      this.players[position].moveName = move;
      this.players[position].steps = m.steps;
    } else {
      // Unknown move name — treat as none, matching V1 behavior.
      this.players[position].moveName = 'none';
      this.players[position].steps = [];
    }
  }

  /** Get the current move name assigned to a position. */
  getMove(position: Position): MoveName {
    return this.players[position].moveName;
  }

  /** Update the title shown above the field. */
  setFieldName(name: string): void {
    this.fieldTop.innerText = name;
  }

  /** Animate all positions through their currently-assigned moves. */
  async playAnimation(): Promise<void> {
    await Promise.all(
      POSITIONS.map((pos) => {
        const slot = this.players[pos];
        return slot.steps.length > 0
          ? animateInSequence(slot.steps, slot.element)
          : Promise.resolve();
      }),
    );
  }

  /** Cancel all animations and return players to their starting positions. */
  reset(): void {
    for (const pos of POSITIONS) {
      resetAnimation(this.players[pos].element);
    }
  }

  /**
   * Spawn a sandbox UI below the field — dropdowns for every position so the end user
   * can compose their own animation. If `allowSave`, also adds a "Set Custom Name" input
   * that updates the field header (used to label plays before saving them to a `Playbook`).
   */
  spawnSandbox(allowSave: boolean = false, parentId?: string | null): HTMLDivElement {
    const shell = createDiv(this.size === 'large' ? 'sandbox-large' : 'sandbox');

    const form = document.createElement('form');
    form.className = 'forms2';
    form.id = `sandboxform${this.name}`;

    const catalog = getMoveCatalog(this.size);
    const selects: Partial<Record<Position, HTMLSelectElement>> = {};

    for (const pos of POSITIONS) {
      const label = document.createElement('label');
      label.innerText = `${POSITION_LABELS[pos]}: `;
      label.htmlFor = `select-${pos}-${this.name}`;

      const select = document.createElement('select');
      select.id = `select-${pos}-${this.name}`;
      select.name = POSITION_LABELS[pos];

      select.append(createOption('none'));
      for (const move of catalog) {
        select.append(createOption(move.name));
      }

      form.append(label, select);
      selects[pos] = select;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      for (const pos of POSITIONS) {
        const sel = selects[pos];
        if (sel) this.setMove(pos, sel.value as MoveName);
      }
      this.setFieldName('Sandbox');
    });

    shell.append(form);

    // Footer row — Confirm Animations sits alongside the (optional) rename form
    // so all the action affordances are in a single left-justified row below
    // the dropdown grid. The `form=...` attribute keeps Confirm wired to the
    // dropdown form even though the button lives outside it.
    const footer = createDiv('pb-sandbox-footer');

    const confirmBtn = document.createElement('input');
    confirmBtn.type = 'submit';
    confirmBtn.value = 'Confirm Animations';
    confirmBtn.setAttribute('form', form.id);
    footer.append(confirmBtn);

    if (allowSave) {
      const nameForm = document.createElement('form');
      nameForm.className = 'pb-sandbox-rename';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'Name of play';
      nameInput.setAttribute('aria-label', 'Play name');

      const setNameBtn = document.createElement('input');
      setNameBtn.type = 'submit';
      setNameBtn.value = 'Set Custom Name';

      nameForm.append(nameInput, setNameBtn);
      nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.setFieldName(nameInput.value);
      });

      footer.append(nameForm);
    }

    shell.append(footer);

    mountInto(shell, parentId);
    return shell;
  }
}

