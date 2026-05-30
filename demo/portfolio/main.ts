/**
 * Portfolio prototype entry — single-scroll demo intended to be ported
 * to a Next.js route at connorburns.dev/projects/playbook. See
 * PortfolioPreparation.md for the full scope.
 *
 * Layout:
 *   - Hero: full connected layout (book + field + sandbox)
 *   - "How it's built": each code snippet has a live mini-demo
 *     beside it showing what that snippet's API call produces in
 *     isolation.
 *
 * Snippet 5 ("compose with createConnectedLayout") deliberately has
 * no mini-demo — the hero IS that snippet, so duplicating it would
 * just be noise.
 */

import { Playbook, PlayDisplayer, createConnectedLayout } from '../../src/index.js';
import '../../src/styles.css';
import './styles.css';

/* -------------------- Hero -------------------- */

const heroLayout = createConnectedLayout('hero-connected');
const heroField = new PlayDisplayer('large', 'Portfolio', heroLayout.fieldSlot);
const heroBook = new Playbook({
  title: 'Portfolio',
  field: heroField,
  allowSave: true,
  pageOrientation: 'vertical',
  parentId: heroLayout.bookSlot,
});
heroField.spawnSandbox(true, heroLayout.sandboxSlot, heroBook.createSaveButton());
heroBook.addPage(
  'https://i.ibb.co/kSFmpZV/Hail-Mary-Out.png',
  'Hail Mary Out',
  'https://youtu.be/qyqCTMirNWg?t=289',
  ['straight-deep', 'mid-90-left', 'none', 'none', 'none', 'mid-90-right', 'straight-deep', 'pass-qb', 'none', 'hole-four-fb', 'none'],
);
heroBook.addPage(
  'https://i.ibb.co/vsRPBKF/Left-Handoff-FB.png',
  'Left Handoff FB',
  null,
  ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'hand-off-left-qb', 'hole-one-lhb', 'hole-two-fb', 'hole-five-rhb'],
);

/* -------------------- "How it's built" mini demos -------------------- */

// 1. Bare field — no moves set. Play Animation auto-disables itself
//    via the hasAnyMoves guard; tooltip reads "Set a move using a
//    dropdown first." Demonstrates the contract.
new PlayDisplayer('large', '', 'demo-field');

// 2. Field with moves preset — Play Animation is live; click to run.
const demoSetmove = new PlayDisplayer('large', 'Slant', 'demo-setmove');
demoSetmove.setMove('lte', 'straight-deep');
demoSetmove.setMove('rte', 'mid-90-right');
demoSetmove.setMove('qb', 'pass-qb');
demoSetmove.setMove('fb', 'hole-four-fb');

// 3. Field + sandbox (no book) — end-user composition UI in isolation.
const demoSandboxField = new PlayDisplayer('large', 'Sandbox', 'demo-sandbox-field');
demoSandboxField.spawnSandbox(false, 'demo-sandbox-controls');

// 4. Book + field bound (no sandbox) — Initialize Play loads the saved
//    move list back into the field; Play Animation then runs it.
const demoBookField = new PlayDisplayer('large', 'Playbook', 'demo-bookfield-field');
const demoBook = new Playbook({
  title: 'Playbook',
  field: demoBookField,
  allowSave: false,
  pageOrientation: 'vertical',
  parentId: 'demo-bookfield-book',
});
demoBook.addPage(
  'https://i.ibb.co/kSFmpZV/Hail-Mary-Out.png',
  'Hail Mary Out',
  null,
  ['straight-deep', 'mid-90-left', 'none', 'none', 'none', 'mid-90-right', 'straight-deep', 'pass-qb', 'none', 'hole-four-fb', 'none'],
);
demoBook.addPage(
  'https://i.ibb.co/vsRPBKF/Left-Handoff-FB.png',
  'Left Handoff FB',
  null,
  ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'hand-off-left-qb', 'hole-one-lhb', 'hole-two-fb', 'hole-five-rhb'],
);
